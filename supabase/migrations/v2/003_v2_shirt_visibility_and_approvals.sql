-- ============================================================================
-- v2 — Shirt visibility, the approval queue, and per-person blocks.
--
-- Replaces the v1 `users.shirt_permission` matrix ('open' | 'batch_only' |
-- 'request_only' | 'locked') with three per-shirt modes plus one unconditional
-- block switch.
--
-- Why this shape:
--   · The DEFAULT is fully open, because real scribble day is open. A student
--     who wants the whole batch on their shirt should never have to configure
--     anything.
--   · Batch is a *browsing filter*, never an access gate. A student can choose
--     to only show their shirt to "my batch" when sharing, but nobody is ever
--     refused for being in a different batch.
--   · Moderation is per-person, not per-mode: a block outlives any later mode
--     change, so switching a shirt back to open never re-admits a blocked user.
--   · Approval is a queue on the scribble, not a lock on the shirt: the
--     scribbler gets to draw immediately and sees their own work, and only the
--     public reveal waits for the owner.
-- ============================================================================

-- ── Shirts gain a visibility mode ───────────────────────────────────────────
-- `open` is the default, so a new shirt is signable the moment it is created.

alter table public.shirts
  add column if not exists visibility text not null default 'open'
    check (visibility in ('open','circle','approval'));

comment on column public.shirts.visibility is
  'open = anyone with the link signs immediately; circle = only people the owner added; approval = anyone may draw but the owner approves each scribbler.';

-- ── Circle membership: the private shirt's guest list ──────────────────────
-- Deliberately not a "group". A circle exists only to gate one shirt and
-- disappears with it. No member cap, no invite tokens, no feed.

create table if not exists public.shirt_circle (
  shirt_id   uuid not null references public.shirts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  added_by   uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shirt_id, user_id)
);

create index if not exists shirt_circle_user_idx on public.shirt_circle(user_id);

-- ── Blocks: one row, no expiry, survives every mode change ────────────────

create table if not exists public.shirt_blocks (
  shirt_id   uuid not null references public.shirts(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  reason     text,
  created_at timestamptz not null default now(),
  primary key (shirt_id, blocked_id)
);

create index if not exists shirt_blocks_user_idx on public.shirt_blocks(blocked_id);

-- ── Approval queue ─────────────────────────────────────────────────────────
-- `pending`  — drawn, visible ONLY to the scribbler (and the shirt owner).
-- `approved` — revealed to everyone; behaves exactly like an open-shirt scribble.
-- `rejected` — never revealed; the scribbler is told it was declined, with no
--              reason required, so moderation stays private and un-arguable.

alter table public.scribbles
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending','approved','rejected')),
  add column if not exists decided_at timestamptz,
  add column if not exists decided_by uuid references public.users(id) on delete set null;

-- Approved-by-default keeps open and circle shirts on a single code path: the
-- only difference is the value written at insert time.
comment on column public.scribbles.approval_status is
  'pending = held for the shirt owner to approve; approved = publicly visible; rejected = never revealed.';

-- The public read must never expose an unreviewed scribble. This index backs
-- the filtered query used by every shirt view.
drop index if exists public.scribbles_shirt_panel_idx;
create index if not exists scribbles_shirt_panel_visible_idx
  on public.scribbles(shirt_id, panel)
  where not is_hidden and approval_status = 'approved';

-- Index for the owner's approval inbox.
create index if not exists scribbles_pending_idx
  on public.scribbles(shirt_id, created_at)
  where approval_status = 'pending' and not is_hidden;

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.shirt_circle enable row level security;
alter table public.shirt_blocks enable row level security;

-- A member can confirm their own membership; the owner needs the full list and
-- gets it through the service role in an API route, so a `true` policy here
-- would leak other people's circle lists to any authenticated user.
create policy shirt_circle_read_self on public.shirt_circle
  for select to authenticated using (auth.uid() = user_id);

-- Same reasoning: "was I blocked?" is a fact only the blocked user and the
-- owner should learn, and the owner reads it via the service role.
create policy shirt_blocks_read_self on public.shirt_blocks
  for select to authenticated using (auth.uid() = blocked_id);

-- ── Grants ─────────────────────────────────────────────────────────────────

revoke all on public.shirt_circle, public.shirt_blocks from anon, authenticated;
grant select on public.shirt_circle, public.shirt_blocks to authenticated;

-- `visibility` must be selectable by the client (the dashboard reads it) and
-- the new scribble columns by the studio (to tell "mine, still pending").
grant select (id, owner_id, shirt_number, is_locked, front_occupancy, back_occupancy,
              visibility, created_at)
  on public.shirts to authenticated;
grant select (id, shirt_id, scribbler_id, panel, x, y, w, h, canvas_json, canvas_svg,
              is_flagged, is_hidden, approval_status, decided_at, created_at)
  on public.scribbles to authenticated;

-- ── Read policies must respect approval ────────────────────────────────────
-- Replace the v1 policy, which returned any non-hidden scribble to everyone.

drop policy if exists scribbles_read on public.scribbles;
create policy scribbles_read on public.scribbles
  for select to authenticated
  using (
    not is_hidden
    and (
      approval_status = 'approved'
      -- The scribbler always sees their own work, even while it is pending.
      or auth.uid() = scribbler_id
    )
  );

-- ── Phase guard also blocks approving a scribble after sealing ─────────────
-- Approving reveals content, so it is a write to the finished artifact and must
-- respect the same window as placement.

create or replace function public.scribble_approval_phase_guard()
returns trigger language plpgsql as $$
declare
  phase text;
begin
  if new.approval_status = 'approved' and old.approval_status = 'pending' then
    phase := public.current_phase();
    if phase not in ('scribble_open','countdown') then
      raise exception 'cannot approve scribbles (phase=%)', phase using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists scribble_approval_phase_guard_trg on public.scribbles;
create trigger scribble_approval_phase_guard_trg
  before update of approval_status on public.scribbles
  for each row execute function public.scribble_approval_phase_guard();
