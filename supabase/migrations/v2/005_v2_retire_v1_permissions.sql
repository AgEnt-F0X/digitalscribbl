-- ============================================================================
-- v2 — Retire the v1 permission model so the schema matches doc 07.
--
-- 001 was drafted before the one-door model was locked, so a fresh project
-- built from 001–004 ends up carrying BOTH access systems:
--
--   · users.shirt_permission            (v1 matrix — 4 modes, on the USER)
--   · shirts.visibility                 (v2 — 3 modes, on the SHIRT)
--   · scribble_requests                 (v1 — request BEFORE drawing)
--   · scribbles.approval_status         (v2 — draw, then approve the reveal)
--
-- Leaving both in place is the bug doc 07 was written to describe: two models
-- fighting, with the obsolete one wired into four live gates. This migration
-- removes the v1 half. `shirts.visibility` + `scribbles.approval_status` +
-- `shirt_circle` + `shirt_blocks` (added by 003) are the whole model from here.
--
-- Run order on a fresh project: 001 → 002 → 003 → 004 → 005.
-- ============================================================================

-- ── Drop the request-before-drawing flow ───────────────────────────────────
-- Approval in v2 is a reveal queue on the scribble, not a gate in front of it,
-- so nobody ever asks for permission to start drawing. The table is deleted,
-- not migrated: there is no v1 data on a fresh project.

drop table if exists public.scribble_requests cascade;

-- ── Drop the v1 permission matrix ──────────────────────────────────────────
-- Replaced by shirts.visibility ('open' | 'circle' | 'approval'), which 003
-- already adds with default 'open'.

alter table public.users drop column if exists shirt_permission;

-- ── Make sure the v2 columns are actually there ────────────────────────────
-- Belt-and-braces: 003 normally adds these, but a partially-applied set of
-- migrations would otherwise fail later with a confusing missing-column error.

alter table public.shirts
  add column if not exists visibility text not null default 'open'
    check (visibility in ('open','circle','approval'));

alter table public.scribbles
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending','approved','rejected')),
  add column if not exists decided_at timestamptz,
  add column if not exists decided_by uuid references public.users(id) on delete set null;

create table if not exists public.shirt_circle (
  shirt_id   uuid not null references public.shirts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  added_by   uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shirt_id, user_id)
);

create index if not exists shirt_circle_user_idx on public.shirt_circle(user_id);

create table if not exists public.shirt_blocks (
  shirt_id   uuid not null references public.shirts(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
-- ── Read policy must respect approval ──────────────────────────────────────
-- 001's policy returns any non-hidden scribble to any authenticated user, which
-- would leak a pending scribble to the whole batch on an `approval` shirt.
-- The author always sees her own work; everyone else waits.

drop policy if exists scribbles_read on public.scribbles;
create policy scribbles_read on public.scribbles
  for select to authenticated
  using (
    not is_hidden
    and (
      approval_status = 'approved'
      or auth.uid() = scribbler_id
    )
  );

-- ── Grants ─────────────────────────────────────────────────────────────────

revoke all on public.shirt_circle, public.shirt_blocks from anon, authenticated;
grant select on public.shirt_circle, public.shirt_blocks to authenticated;

alter table public.shirt_circle enable row level security;
alter table public.shirt_blocks   enable row level security;

-- A member can confirm only her own membership; the owner reads the full list
-- through the service role. A `using (true)` policy here would leak every
-- circle's guest list to any authenticated user.
create policy shirt_circle_read_self on public.shirt_circle
  for select to authenticated using (auth.uid() = user_id);

-- Same reasoning: "was I blocked?" is a fact for the blocked user and the
-- owner only.
create policy shirt_blocks_read_self on public.shirt_blocks
  for select to authenticated using (auth.uid() = blocked_id);

-- The client needs `visibility` to render the shirt's access chip.
grant select (id, owner_id, shirt_number, is_locked, front_occupancy,
              back_occupancy, sleeves_occupancy, visibility, created_at)
  on public.shirts to authenticated;

grant select (id, shirt_id, scribbler_id, panel, x, y, w, h, canvas_json,
              canvas_svg, is_flagged, is_hidden, approval_status, decided_at,
              created_at)
  on public.scribbles to authenticated;

-- ── Approving is a write to the finished artifact ──────────────────────────
-- Revealing content is what sealing protects, so it respects the phase window
-- exactly like placement does.

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

-- ── Report ─────────────────────────────────────────────────────────────────
-- Expected after running: `shirt_permission` and `scribble_requests` gone,
-- `visibility` defaulting to 'open' on every shirt, and no pending scribble
-- visible to anyone but its author and the shirt owner.

  reason     text,
  created_at timestamptz not null default now(),
  primary key (shirt_id, blocked_id)
);

create index if not exists shirt_blocks_user_idx on public.shirt_blocks(blocked_id);
