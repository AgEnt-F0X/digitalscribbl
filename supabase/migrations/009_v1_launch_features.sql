-- ============================================================
-- 009: v1 launch features
-- New columns + constraints for:
--   • voice notes on scribbles
--   • anonymous scribbles (revealed at deadline)
--   • per-user thank-you message (toast shown to signers)
--   • guest user flag (non-domain Google logins)
--   • per-shirt avatar override (each of up to 3 shirts can have its own look)
--   • hard cap of 3 shirts per user (shirt_number 1..3)
--   • daily quest tracking
-- ============================================================

-- ── Users: thank-you + guest flag ─────────────────────────────
alter table public.users
  add column if not exists thank_you_message text default 'Thanks for signing my shirt ❤️',
  add column if not exists is_guest boolean not null default false,
  add column if not exists last_quest_completed_on date,
  add column if not exists last_digest_sent_on date;

-- ── Shirts: per-shirt avatar + hard cap 3 ─────────────────────
alter table public.shirts
  add column if not exists avatar_config_override jsonb;

-- Enforce shirt_number is 1..3 (cap of 3 shirts per user)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shirts_shirt_number_range'
  ) then
    alter table public.shirts
      add constraint shirts_shirt_number_range check (shirt_number between 1 and 3);
  end if;
end $$;

-- ── Scribbles: voice + anonymous ──────────────────────────────
alter table public.scribbles
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists voice_url text,
  add column if not exists voice_duration_ms integer
    check (voice_duration_ms is null or voice_duration_ms between 0 and 12000);

-- ── Notifications: a new type for guest-signed scribbles ──────
-- (no schema change needed; type is just a text column)

-- ── Index for fast 'recent scribbles on my shirt' query ───────
create index if not exists scribbles_shirt_created_idx
  on public.scribbles(shirt_id, created_at desc)
  where is_hidden = false;

-- ── Friend group canvas support (shared canvas per group) ─────
-- Friend groups can have a single shared shirt canvas. We reuse the
-- shirts table with a new optional group_id column and allow owner_id
-- to be null for group shirts.
alter table public.shirts
  add column if not exists group_id uuid references public.friend_groups(id) on delete cascade,
  alter column owner_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shirts_owner_or_group'
  ) then
    alter table public.shirts
      add constraint shirts_owner_or_group
        check (
          (owner_id is not null and group_id is null)
          or (owner_id is null and group_id is not null)
        );
  end if;
end $$;

create unique index if not exists shirts_group_unique
  on public.shirts(group_id)
  where group_id is not null;

-- ── RLS for new columns ───────────────────────────────────────
-- Existing policies on users/shirts/scribbles already cover the new columns
-- via row-level read; no additional policies needed.

-- ── Backfill defaults ─────────────────────────────────────────
update public.users
  set thank_you_message = 'Thanks for signing my shirt ❤️'
  where thank_you_message is null;

-- ── Comments for documentation ────────────────────────────────
comment on column public.users.thank_you_message
  is 'Floating toast shown to anyone who signs this user''s shirt. Edited in onboarding/settings.';
comment on column public.users.is_guest
  is 'True for Google logins outside allowed email domains. Cannot own a shirt; can only scribble via direct invite link.';
comment on column public.users.last_quest_completed_on
  is 'Tracks which daily quest the user last completed, for the dashboard quest module.';
comment on column public.users.last_digest_sent_on
  is 'Tracks the last day a digest email was sent to this user, for Resend rate limiting.';
comment on column public.shirts.avatar_config_override
  is 'Optional per-shirt avatar override. If null, falls back to the user''s primary avatar_config.';
comment on column public.shirts.group_id
  is 'When set, this shirt is a shared friend-group canvas (owner_id must be null).';
comment on column public.scribbles.is_anonymous
  is 'When true, scribbler identity is hidden in the UI until the deadline reveal date.';
comment on column public.scribbles.voice_url
  is 'Optional Opus voice note attached to this scribble. Stored in shirt-textures bucket.';
comment on column public.scribbles.voice_duration_ms
  is 'Voice note duration in milliseconds. Capped at 12s (10s nominal, 2s buffer).';
