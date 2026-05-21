-- ============================================================
-- 010: Role IA, account lifecycle, sharing, audit, phase machine,
--      free-tier degrade flags, B.Tech CS seed.
-- Aligns the database with docs/08, docs/09, docs/10 (Round 2 — 2026-05-21).
-- Idempotent: re-running is safe.
-- ============================================================

-- ── 1. Role flag consistency ──────────────────────────────────
-- Single source of truth lives in lib/utils/role.ts. The DB just
-- prevents impossible combinations.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_admin_implies_verified'
  ) then
    alter table public.users
      add constraint users_admin_implies_verified
        check (not is_admin or (is_university_verified and not is_guest));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'users_verified_xor_guest'
  ) then
    alter table public.users
      add constraint users_verified_xor_guest
        check (not (is_university_verified and is_guest));
  end if;
end $$;

-- ── 2. Account deletion (doc 08 §7) ───────────────────────────
alter table public.users
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists delete_opted_out_shirt boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_deleted_not_suspended'
  ) then
    alter table public.users
      add constraint users_deleted_not_suspended
        check (not is_deleted or not is_suspended);
  end if;
end $$;

create table if not exists public.account_delete_otps (
  user_id     uuid primary key references public.users(id) on delete cascade,
  otp_hash    text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.account_delete_otps enable row level security;

-- Owner-only read; nobody can read others' OTPs.
drop policy if exists "Own OTP read" on public.account_delete_otps;
create policy "Own OTP read"
  on public.account_delete_otps
  for select
  using (auth.uid() = user_id);

-- ── 3. Profile slugs + history (doc 08 §"Sharing" + decision 5) ──
create table if not exists public.profile_slugs (
  slug         text primary key,
  user_id      uuid not null references public.users(id) on delete cascade,
  is_current   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profile_slug_length check (char_length(slug) between 3 and 40),
  constraint profile_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$')
);

create unique index if not exists profile_slugs_one_current_per_user
  on public.profile_slugs (user_id)
  where is_current = true;

create index if not exists profile_slugs_user_idx
  on public.profile_slugs (user_id, created_at desc);

alter table public.profile_slugs enable row level security;

drop policy if exists "Public read current slugs" on public.profile_slugs;
create policy "Public read current slugs"
  on public.profile_slugs for select
  using (true);  -- slugs are public by design (used in /u/<slug> URLs)

-- ── 4. Share links + visit attribution (doc 08 + decision 6) ──
create table if not exists public.share_links (
  code         text primary key,                  -- 10-char nanoid, custom alphabet
  owner_id     uuid not null references public.users(id) on delete cascade,
  target_type  text not null check (target_type in ('profile', 'shirt', 'group')),
  target_id    uuid,                              -- null for 'profile' (resolves to owner_id)
  label        text,                              -- human-friendly tag e.g. "WhatsApp"
  campaign     text,                              -- e.g. 'whatsapp', 'qr_print', 'instagram'
  expires_at   timestamptz,                       -- optional auto-revoke
  is_revoked   boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint share_links_code_format check (char_length(code) = 10)
);

create index if not exists share_links_owner_idx
  on public.share_links (owner_id, created_at desc);

alter table public.share_links enable row level security;

drop policy if exists "Owner reads own links" on public.share_links;
create policy "Owner reads own links"
  on public.share_links for select
  using (auth.uid() = owner_id);

drop policy if exists "Owner inserts own links" on public.share_links;
create policy "Owner inserts own links"
  on public.share_links for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owner updates own links" on public.share_links;
create policy "Owner updates own links"
  on public.share_links for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create table if not exists public.share_link_visits (
  id                   uuid primary key default gen_random_uuid(),
  share_link_code      text not null references public.share_links(code) on delete cascade,
  visitor_user_id      uuid references public.users(id) on delete set null,
  anonymous_visit_id   text,
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  visit_count          integer not null default 1,
  became_user          boolean not null default false
);

-- Composite uniqueness so we upsert visits cleanly (one row per visitor per link).
create unique index if not exists share_link_visits_user_unique
  on public.share_link_visits (share_link_code, visitor_user_id)
  where visitor_user_id is not null;

create unique index if not exists share_link_visits_anon_unique
  on public.share_link_visits (share_link_code, anonymous_visit_id)
  where anonymous_visit_id is not null;

create index if not exists share_link_visits_link_time_idx
  on public.share_link_visits (share_link_code, first_seen_at desc);

alter table public.share_link_visits enable row level security;

drop policy if exists "Owner reads own link visits" on public.share_link_visits;
create policy "Owner reads own link visits"
  on public.share_link_visits for select
  using (
    exists (
      select 1 from public.share_links sl
      where sl.code = share_link_visits.share_link_code
        and sl.owner_id = auth.uid()
    )
  );

-- Visit inserts/updates only via server (service role); no client-side policy.

-- ── 5. Admin audit logs (doc 08 §"Admin") ─────────────────────
create table if not exists public.admin_audit_logs (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references public.users(id) on delete cascade,
  action       text not null,                     -- e.g. 'hide_scribble', 'suspend_user'
  target_type  text not null,                     -- 'user', 'scribble', 'shirt', 'group', 'setting'
  target_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_logs_admin_idx
  on public.admin_audit_logs (admin_id, created_at desc);

create index if not exists admin_audit_logs_target_idx
  on public.admin_audit_logs (target_type, target_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admin reads audit logs" on public.admin_audit_logs;
create policy "Admin reads audit logs"
  on public.admin_audit_logs for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- ── 6. System health runs (doc 09) ────────────────────────────
create table if not exists public.system_health_runs (
  id           uuid primary key default gen_random_uuid(),
  run_at       timestamptz not null default now(),
  db_pct       numeric(5,2),
  storage_pct  numeric(5,2),
  realtime_pct numeric(5,2),
  resend_pct   numeric(5,2),
  actions_taken jsonb not null default '[]'::jsonb,
  status       text not null default 'green'
    check (status in ('green', 'yellow', 'orange', 'red'))
);

create index if not exists system_health_runs_time_idx
  on public.system_health_runs (run_at desc);

alter table public.system_health_runs enable row level security;

drop policy if exists "Admin reads health runs" on public.system_health_runs;
create policy "Admin reads health runs"
  on public.system_health_runs for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- ── 7. Yearbook fields (schema-ready; UI deferred — doc 10) ───
alter table public.users
  add column if not exists yearbook_legacy_line text,
  add column if not exists yearbook_next_step text,
  add column if not exists yearbook_visibility text not null default 'public',
  add column if not exists yearbook_featured_scribble_ids uuid[] not null default '{}',
  add column if not exists yearbook_ceremony_seen_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_yearbook_visibility_check'
  ) then
    alter table public.users
      add constraint users_yearbook_visibility_check
        check (yearbook_visibility in ('public', 'batch', 'hidden'));
  end if;
end $$;

create table if not exists public.yearbook_renders (
  user_id        uuid primary key references public.users(id) on delete cascade,
  shirt_id       uuid not null references public.shirts(id) on delete cascade,
  front_png_url  text,
  back_png_url   text,
  generated_at   timestamptz,
  is_stale       boolean not null default true
);

create index if not exists yearbook_renders_stale_idx
  on public.yearbook_renders (is_stale)
  where is_stale = true;

-- ── 8. Phase machine + soft-degrade flags (doc 09 + doc 10) ───
-- Each row is a jsonb value in platform_settings. Conflict-safe insert.
insert into public.platform_settings (key, value) values
  -- Phase machine
  ('phase',                       '"scribble_open"'::jsonb),
  ('scribble_ends_at',            'null'::jsonb),
  ('yearbook_opens_at',           'null'::jsonb),
  ('transition_message',
    '"Scribble phase has ended. Yearbook is being prepared."'::jsonb),
  -- Soft-degrade flags (doc 09)
  ('disable_voice_notes',         'false'::jsonb),
  ('disable_realtime_presence',   'false'::jsonb),
  ('disable_realtime_broadcast',  'false'::jsonb),
  ('disable_email_digest',        'false'::jsonb),
  ('disable_new_signups',         'false'::jsonb),
  ('disable_scribble_writes',     'false'::jsonb),
  ('disable_head_uploads',        'false'::jsonb),
  ('disable_share_link_creation', 'false'::jsonb)
on conflict (key) do nothing;

-- ── 9. Performance indexes (doc 08 §12) ───────────────────────
create index if not exists notifications_user_unread_partial
  on public.notifications (user_id, created_at desc)
  where is_read = false;

create index if not exists scribble_requests_owner_status_idx
  on public.scribble_requests (owner_id, status, created_at desc);

-- ── 10. B.Tech CS seed (v1 launch scope) ──────────────────────
-- We keep the existing academic_groups / programs / batches structure so
-- the dashboard joins remain unchanged. For v1 we seed one group, one
-- program, and 52 batches. Other courses get added on request.
--
-- The existing unique(program_id, graduation_year) constraint blocks 52
-- batches that share the same year, so we relax it to include label.
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'batches_program_id_graduation_year_key'
  ) then
    alter table public.batches drop constraint batches_program_id_graduation_year_key;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'batches_program_year_label_uk'
  ) then
    alter table public.batches
      add constraint batches_program_year_label_uk unique (program_id, graduation_year, label);
  end if;
end $$;

-- Seed (idempotent)
do $$
declare
  g_id uuid;
  p_id uuid;
  i    int;
begin
  insert into public.academic_groups (name) values ('University')
    on conflict (name) do nothing;
  select id into g_id from public.academic_groups where name = 'University' limit 1;

  insert into public.programs (academic_group_id, name)
    values (g_id, 'B.Tech Computer Science')
    on conflict (academic_group_id, name) do nothing;
  select id into p_id from public.programs
    where academic_group_id = g_id and name = 'B.Tech Computer Science' limit 1;

  for i in 1..52 loop
    insert into public.batches (program_id, graduation_year, label)
      values (p_id, 2026, 'Batch ' || lpad(i::text, 2, '0'))
      on conflict (program_id, graduation_year, label) do nothing;
  end loop;
end $$;

-- ── 11. Phase + write-block enforcement (RLS) ─────────────────
-- Block scribble inserts at the DB layer if phase is not scribble_open OR
-- the disable_scribble_writes flag is true. Belt-and-braces alongside
-- the API check.
create or replace function public.scribbles_phase_guard()
returns trigger language plpgsql security definer as $$
declare
  phase_val text;
  block_val text;
begin
  select value::text into phase_val
    from public.platform_settings where key = 'phase';
  select value::text into block_val
    from public.platform_settings where key = 'disable_scribble_writes';

  -- Allow inserts during scribble_open AND countdown (T-7d banner phase).
  -- lib/utils/phase.ts:isScribbleOpen treats both as writable; the trigger
  -- must agree or every POST 500s the day phase flips to countdown.
  if phase_val is not null and phase_val not in ('"scribble_open"', '"countdown"') then
    raise exception 'scribbles: phase_locked' using errcode = 'P0001';
  end if;

  if block_val = 'true' then
    raise exception 'scribbles: writes_disabled' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists scribbles_phase_guard_trigger on public.scribbles;
create trigger scribbles_phase_guard_trigger
  before insert on public.scribbles
  for each row execute function public.scribbles_phase_guard();

-- ── 12. Storage backfill ──────────────────────────────────────
-- Backfill yearbook_renders stub rows so the table is queryable by user_id
-- without nulls. Filled in lazily by the yearbook batch job.
insert into public.yearbook_renders (user_id, shirt_id, is_stale)
select s.owner_id, s.id, true
  from public.shirts s
  where s.owner_id is not null and s.shirt_number = 1
on conflict (user_id) do nothing;

-- ── 13. Comments ──────────────────────────────────────────────
comment on table public.profile_slugs is
  'Public-facing /u/<slug> URLs. Old slugs stay forever; only one is_current=true per user.';
comment on table public.share_links is
  '/i/<code> attribution links. Owner-created. Used to track who brought who in.';
comment on table public.share_link_visits is
  'One row per (link, visitor). Visit count incremented on repeat hits.';
comment on table public.admin_audit_logs is
  'Every privileged in-app admin action. Append-only.';
comment on table public.system_health_runs is
  'Daily cron (app/api/cron/system-health) writes here. See docs/09.';
comment on column public.users.is_deleted is
  'Soft-delete. Auth callback refuses session if true.';
comment on column public.users.yearbook_visibility is
  'public | batch | hidden. Drives /u/<slug> visibility in yearbook phase.';
comment on column public.users.yearbook_ceremony_seen_at is
  'Set the first time user opens their own yearbook page (doc 10).';
