-- Migration 011 — Critical fixes after senior dev review (docs/15-dev-review.md)
--
-- Patches to apply on databases that have already had 010 applied. Idempotent:
-- all changes are `create or replace`, `do $$` existence-checks, or `if not
-- exists`. Safe to re-run.
--
-- Single concern: fix the `scribbles_phase_guard()` trigger so it accepts
-- inserts during the `countdown` phase. 010 line ~341 rejected anything other
-- than `scribble_open`, contradicting `lib/utils/phase.ts:isScribbleOpen`
-- which treats `countdown` as writable. The bug ships latent and only triggers
-- the day admin flips phase to countdown — every scribble POST returns 500.

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

-- Re-bind the trigger to the new function body. `drop trigger if exists`
-- + recreate is the idempotent recipe even though `create or replace function`
-- alone is enough — being explicit makes the migration self-evident.
drop trigger if exists scribbles_phase_guard_trigger on public.scribbles;
create trigger scribbles_phase_guard_trigger
  before insert on public.scribbles
  for each row execute function public.scribbles_phase_guard();

comment on function public.scribbles_phase_guard() is
  'Blocks scribble inserts unless phase in (scribble_open, countdown) AND '
  'disable_scribble_writes is false. Pairs with lib/utils/phase.ts and '
  'lib/utils/platformFlags.ts. Patched in migration 011 — see docs/15.';
