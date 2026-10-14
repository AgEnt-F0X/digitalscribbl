-- ============================================================================
-- v2 — Bennett University graduating cohort (2026 convocation)
--
-- Fresh-project schema. This replaces v1 migrations 001–013: it does not
-- replay them, does not assume any of their tables, and is safe to run once on
-- an empty database.
--
-- Design rules carried from docs/v2/04-schema.md:
--   · One institution, many programs. Programs are *configurable*: only CSE has
--     batch structure enabled at launch; every other program is course-wide.
--   · Enrollment number is the identity anchor. It is matched against the
--     private convocation roster server-side and is never exposed to the
--     browser client.
--   · Photos are out of this migration (Cloudinary wiring ships in its own
--     phase). Shirts, scribbles, groups, and the phase machine are in.
--   · Batches are a per-program switch, never a hardcoded 52.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Academic structure ─────────────────────────────────────────────────────

create table if not exists public.academic_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.programs (
  id                uuid primary key default gen_random_uuid(),
  academic_group_id uuid not null references public.academic_groups(id) on delete cascade,
  name              text not null,
  -- Stable key used in code and URLs, e.g. 'btech-cse'. Immutable.
  key               text not null unique,
  -- UG | PG | DIPLOMA | PHD. Derived from the convocation roster, not guessed.
  level             text not null default 'UG'
                    check (level in ('UG','PG','DIPLOMA','PHD')),
  graduation_year   integer not null default 2026,
  -- When true, students of this program pick a batch 1..batch_count. When
  -- false the whole program is one cohort and batch is ignored.
  batches_enabled   boolean not null default false,
  batch_count       integer check (batch_count is null or batch_count > 0),
  created_at        timestamptz not null default now(),
  unique (academic_group_id, name),
  -- A program that is not batch-enabled must not advertise a batch range.
  constraint programs_batch_config_consistent
    check (batches_enabled or batch_count is null)
);

create table if not exists public.batches (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid not null references public.programs(id) on delete cascade,
  graduation_year  integer not null,
  -- 1-based within the program, matching the onboarding picker.
  batch_number     integer not null check (batch_number between 1 and 500),
  created_at       timestamptz not null default now(),
  unique (program_id, graduation_year, batch_number)
);

-- ── Identity ───────────────────────────────────────────────────────────────

create table if not exists public.users (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null unique,
  -- Official name from the convocation roster. Editable by the owner later.
  display_name         text not null,
  -- The identity anchor. Unique across the platform: one student, one profile.
  enrollment_number    text not null unique,
  academic_group_id    uuid references public.academic_groups(id),
  program_id           uuid references public.programs(id),
  batch_id             uuid references public.batches(id),

  avatar_config        jsonb,
  yearbook_quote       text,
  thank_you_message    text,
  shirt_permission     text not null default 'open'
                         check (shirt_permission in ('open','batch_only','request_only','locked')),

  -- ── Verification ──
  -- 'pending' until the enrollment mailbox is proven; guests never leave
  -- 'guest' because they are not roster students.
  verification_status  text not null default 'pending'
                         check (verification_status in ('unverified','pending','verified','rejected')),
  verified_at          timestamptz,

  is_admin             boolean not null default false,
  is_suspended         boolean not null default false,
  is_deleted           boolean not null default false,
  -- True for non-roster Google accounts: they can sign, never own a shirt.
  is_guest             boolean not null default false,
  is_university_verified boolean not null default false,
  onboarding_completed boolean not null default false,

  -- ── Yearbook (phase later; columns present so the phase ships without a
  --    second migration) ──
  yearbook_visibility  text not null default 'public'
                         check (yearbook_visibility in ('public','hidden')),
  yearbook_card_style  text not null default 'scribble_avatar'
                         check (yearbook_card_style in ('graduation_photo','scribble_avatar')),

  last_seen            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists users_program_idx on public.users(program_id);
create index if not exists users_batch_idx   on public.users(batch_id);
create index if not exists users_guest_idx   on public.users(is_guest) where is_guest;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

-- A verified student must have a program; a batch only exists for programs
-- that enable it. Enforced in the database, not just in app code.
create or replace function public.enforce_user_academic_shape()
returns trigger language plpgsql as $$
declare
  batch_program_id  uuid;
  batch_enabled     boolean;
begin
  if new.batch_id is null then
    return new;
  end if;

  select b.program_id, p.batches_enabled
    into batch_program_id, batch_enabled
    from public.batches b
    join public.programs p on p.id = b.program_id
   where b.id = new.batch_id;

  -- Batch must exist, and belong to a program that actually has batches.
  if batch_program_id is null then
    raise exception 'unknown batch %', new.batch_id;
  end if;
  if coalesce(batch_enabled, false) is not true then
    raise exception 'batch selected for a course-wide program';
  end if;

  -- The batch must belong to THIS user's program. Without this, a BBA student
  -- could point at a CSE batch row: the batch is valid and its program is
  -- batch-enabled, so the checks above pass, yet grouping would then place them
  -- in the wrong cohort.
  if new.program_id is null or new.program_id is distinct from batch_program_id then
    raise exception 'batch % does not belong to program %', new.batch_id, new.program_id;
  end if;

  return new;
end;
$$;

drop trigger if exists users_academic_shape_guard on public.users;
create trigger users_academic_shape_guard
  before insert or update of batch_id on public.users
  for each row execute function public.enforce_user_academic_shape();

-- Public profile slugs. One current slug per user.
create table if not exists public.profile_slugs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  slug       text not null unique,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists profile_slugs_one_current
  on public.profile_slugs(user_id) where is_current;

-- ── Shirts and scribbles ───────────────────────────────────────────────────

create table if not exists public.shirts (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.users(id) on delete cascade,
  shirt_number   integer not null default 1 check (shirt_number between 1 and 3),
  is_locked      boolean not null default false,
  front_occupancy numeric(5,2) not null default 0,
  back_occupancy  numeric(5,2) not null default 0,
  created_at     timestamptz not null default now(),
  unique (owner_id, shirt_number)
);

create table if not exists public.scribbles (
  id            uuid primary key default gen_random_uuid(),
  shirt_id      uuid not null references public.shirts(id) on delete cascade,
  scribbler_id  uuid not null references public.users(id) on delete cascade,
  panel         text not null check (panel in ('front','back')),
  x             integer not null,
  y             integer not null,
  w             integer not null check (w between 40 and 300),
  h             integer not null check (h between 40 and 300),
  canvas_json   jsonb not null,
  canvas_svg    text,
  is_flagged    boolean not null default false,
  flag_count    integer not null default 0,
  is_hidden     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists scribbles_shirt_panel_idx
  on public.scribbles(shirt_id, panel) where not is_hidden;
create index if not exists scribbles_scribbler_idx
  on public.scribbles(scribbler_id);

create table if not exists public.scribble_reactions (
  id          uuid primary key default gen_random_uuid(),
  scribble_id uuid not null references public.scribbles(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (scribble_id, user_id, emoji)
);

create table if not exists public.scribble_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  owner_id     uuid not null references public.users(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, owner_id)
);

create table if not exists public.scribble_reports (
  id           uuid primary key default gen_random_uuid(),
  scribble_id  uuid not null references public.scribbles(id) on delete cascade,
  reporter_id  uuid not null references public.users(id) on delete cascade,
  reason       text,
  created_at   timestamptz not null default now(),
  unique (scribble_id, reporter_id)
);

create table if not exists public.shirt_notes (
  id         uuid primary key default gen_random_uuid(),
  shirt_id   uuid not null references public.shirts(id) on delete cascade,
  author_id  uuid not null references public.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 280),
  -- Public by default. Private notes are deliberately out of v2.0.
  visibility text not null default 'public' check (visibility = 'public'),
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shirt_notes_shirt_idx on public.shirt_notes(shirt_id) where not is_hidden;

-- ── Groups ─────────────────────────────────────────────────────────────────
-- A group is either a whole course or one batch inside a batch-enabled
-- program. Students are auto-joined to their cohort group on onboarding; they
-- may also create their own friend groups.

create table if not exists public.friend_groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  admin_id     uuid references public.users(id) on delete set null,
  -- Exactly one of these scopes a cohort group; both null = free group.
  program_id   uuid references public.programs(id) on delete cascade,
  batch_id     uuid references public.batches(id) on delete cascade,
  kind         text not null default 'free'
                 check (kind in ('free','course','batch')),
  invite_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_at   timestamptz not null default now(),
  constraint friend_groups_cohort_scope
    check (
      (kind = 'free'  and program_id is null and batch_id is null) or
      (kind = 'course' and program_id is not null and batch_id is null) or
      (kind = 'batch'  and batch_id is not null)
    )
);

-- One cohort group per program, and one per batch.
create unique index if not exists friend_groups_one_course_group
  on public.friend_groups(program_id) where kind = 'course';
create unique index if not exists friend_groups_one_batch_group
  on public.friend_groups(batch_id) where kind = 'batch';

create table if not exists public.friend_group_members (
  group_id  uuid not null references public.friend_groups(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists friend_group_members_user_idx on public.friend_group_members(user_id);

-- One memorable mark per member per group.
create table if not exists public.group_marks (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.friend_groups(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text check (body is null or char_length(body) between 1 and 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- ── Operations ─────────────────────────────────────────────────────────────

create table if not exists public.platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Phase machine. 'countdown' still allows signing; 'yearbook' freezes it.
insert into public.platform_settings (key, value) values
  ('phase', '"scribble_open"'),
  ('scribble_ends_at', 'null'),
  ('yearbook_opens_at', 'null'),
  ('convocation_uploads', '"off"'),
  ('auto_hide_threshold', '3')
on conflict (key) do nothing;

create or replace function public.current_phase()
returns text language sql stable as $$
  select coalesce((select value #>> '{}' from public.platform_settings where key = 'phase'), 'scribble_open');
$$;

create or replace function public.scribbles_phase_guard()
returns trigger language plpgsql as $$
declare
  phase text;
begin
  phase := public.current_phase();
  if phase not in ('scribble_open','countdown') then
    raise exception 'signing is closed (phase=%)', phase using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists scribbles_phase_guard_trg on public.scribbles;
create trigger scribbles_phase_guard_trg
  before insert on public.scribbles
  for each row execute function public.scribbles_phase_guard();

drop trigger if exists shirt_notes_phase_guard_trg on public.shirt_notes;
create trigger shirt_notes_phase_guard_trg
  before insert on public.shirt_notes
  for each row execute function public.scribbles_phase_guard();

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_unread_idx
  on public.notifications(user_id, created_at desc) where not is_read;

create table if not exists public.user_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_id uuid not null references public.users(id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (reporter_id, reported_id)
);

create table if not exists public.admin_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.users(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_logs_recent_idx
  on public.admin_audit_logs(created_at desc);

-- ── Row level security ─────────────────────────────────────────────────────
-- Reads: authenticated app users. Writes: API routes via the service role.
-- The browser client never receives email or enrollment_number (grants below).

alter table public.academic_groups enable row level security;
alter table public.programs             enable row level security;
alter table public.batches              enable row level security;
alter table public.users                enable row level security;
alter table public.profile_slugs        enable row level security;
alter table public.shirts               enable row level security;
alter table public.scribbles            enable row level security;
alter table public.scribble_reactions   enable row level security;
alter table public.scribble_requests    enable row level security;
alter table public.scribble_reports     enable row level security;
alter table public.shirt_notes          enable row level security;
alter table public.friend_groups        enable row level security;
alter table public.friend_group_members enable row level security;
alter table public.group_marks          enable row level security;
alter table public.notifications        enable row level security;
alter table public.user_reports         enable row level security;
alter table public.admin_audit_logs     enable row level security;
-- platform_settings holds the phase machine, so it must be locked down too:
-- the browser client never reads it, and all app writes go through API routes
-- using the service role. Without RLS here, `current_phase()` would have to read
-- an unguarded table, and the default anon/authenticated privileges would let
-- anyone flip the phase (i.e. open or freeze signing) via PostgREST.
alter table public.platform_settings    enable row level security;

-- No policies on purpose: RLS enabled with zero policies denies anon and
-- authenticated entirely. Only the service role (which bypasses RLS) reads it.

create policy academic_groups_read on public.academic_groups
  for select to authenticated using (true);

create policy programs_read on public.programs
  for select to authenticated using (true);

create policy batches_read on public.batches
  for select to authenticated using (true);

-- Users can read their own row. Everyone else is read through API routes
-- (service role) so private columns are never exposed by PostgREST.
create policy users_read_self on public.users
  for select to authenticated using (auth.uid() = id);

create policy profile_slugs_read on public.profile_slugs
  for select to authenticated using (true);

create policy shirts_read on public.shirts
  for select to authenticated using (true);

create policy scribbles_read on public.scribbles
  for select to authenticated using (not is_hidden);

create policy scribble_reactions_read on public.scribble_reactions
  for select to authenticated using (true);

create policy shirt_notes_read on public.shirt_notes
  for select to authenticated using (not is_hidden);

create policy friend_groups_read on public.friend_groups
  for select to authenticated using (true);

create policy friend_group_members_read on public.friend_group_members
  for select to authenticated using (true);

create policy group_marks_read on public.group_marks
  for select to authenticated using (true);

create policy notifications_read_self on public.notifications
  for select to authenticated using (auth.uid() = user_id);

-- Reports are insert-only from the client, and only about yourself.
create policy user_reports_insert_self on public.user_reports
  for insert to authenticated with check (auth.uid() = reporter_id);

-- ── Column grants: never hand the browser a private column ─────────────────
-- Revoke first, then grant back only what the browser legitimately needs.
-- Everything is written through API routes using the service role, so no client
-- ever needs INSERT/UPDATE/DELETE on these tables.
revoke all on public.users from anon, authenticated;
revoke all on public.platform_settings, public.admin_audit_logs from anon, authenticated;
revoke all on public.shirts, public.scribbles, public.scribble_reactions,
  public.scribble_requests, public.scribble_reports, public.shirt_notes,
  public.friend_groups, public.friend_group_members, public.group_marks,
  public.notifications, public.profile_slugs, public.programs, public.batches,
  public.academic_groups from anon, authenticated;

-- `email`, `is_admin`, `is_suspended`, and `is_deleted` are intentionally
-- absent. A student may read their OWN row only (users_read_self), which is how
-- they see their own enrollment number; nobody else's.
grant select (id, display_name, enrollment_number, program_id, batch_id, avatar_config,
              yearbook_quote, thank_you_message, shirt_permission, verification_status,
              yearbook_visibility, yearbook_card_style, is_guest, is_university_verified,
              onboarding_completed, created_at)
  on public.users to authenticated;
grant select on public.shirts, public.scribbles, public.shirt_notes,
                public.profile_slugs, public.programs, public.batches,
                public.academic_groups, public.friend_groups,
                public.friend_group_members, public.group_marks,
                public.scribble_reactions
  to authenticated;
grant insert (reporter_id, reported_id, reason) on public.user_reports to authenticated;

-- Scrub any pre-existing default privileges for future tables, so a migration
-- added later cannot quietly re-expose a new table to the browser client.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on functions from anon, authenticated;
