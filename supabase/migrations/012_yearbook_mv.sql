-- ============================================================
-- 012: Yearbook materialised view + avatar_config backfill
--
-- Three concerns in one migration (each is tiny; splitting into
-- three files would be wasteful):
--   1. Backfill `avatar_config` for pre-Route-1 rows whose
--      `avatar_config` is null but have a legacy `body_style`.
--   2. Create `yearbook_grid_stats` materialised view so the
--      yearbook page avoids N+1 on scribble counts at scale
--      (1 000–2 000 users).
--   3. Create refresh helper + grant permissions.
--
-- Idempotent: all operations use `create or replace`, `if not
-- exists`, or `do $$` existence checks. Safe to re-run.
-- ============================================================

-- ── 1. Backfill avatar_config ──────────────────────────────────
-- Users who onboarded before Route 1 may still have a legacy
-- `body_style` column (M1–F3) but no `avatar_config`. We map
-- each body_style to its closest preset + default skin tone so
-- the yearbook grid renders them without falling back to the
-- `normalizeAvatarConfig` code path on every page load.
do $$
declare
  rec record;
  preset jsonb;
begin
  for rec in
    select id, body_style, shirt_color from public.users
    where avatar_config is null and body_style is not null
  loop
    preset := case rec.body_style
      when 'M1' then '{"presetId":"m-soft-casual","skinToneId":"skin_03_medium_brown","frontFaceTransform":{"x":200,"y":92,"scale":1,"rotation":0},"backHairTransform":{"x":200,"y":92,"scale":1,"rotation":0}}'::jsonb
      when 'M2' then '{"presetId":"m-classic-straight","skinToneId":"skin_03_medium_brown","frontFaceTransform":{"x":200,"y":92,"scale":1,"rotation":0},"backHairTransform":{"x":200,"y":92,"scale":1,"rotation":0}}'::jsonb
      when 'M3' then '{"presetId":"m-upright-confident","skinToneId":"skin_03_medium_brown","frontFaceTransform":{"x":200,"y":92,"scale":1,"rotation":0},"backHairTransform":{"x":200,"y":92,"scale":1,"rotation":0}}'::jsonb
      when 'F1' then '{"presetId":"f-confident-upright","skinToneId":"skin_03_medium_brown","frontFaceTransform":{"x":200,"y":92,"scale":1,"rotation":0},"backHairTransform":{"x":200,"y":92,"scale":1,"rotation":0}}'::jsonb
      when 'F2' then '{"presetId":"f-soft-side-lean","skinToneId":"skin_03_medium_brown","frontFaceTransform":{"x":200,"y":92,"scale":1,"rotation":0},"backHairTransform":{"x":200,"y":92,"scale":1,"rotation":0}}'::jsonb
      when 'F3' then '{"presetId":"f-relaxed-casual","skinToneId":"skin_03_medium_brown","frontFaceTransform":{"x":200,"y":92,"scale":1,"rotation":0},"backHairTransform":{"x":200,"y":92,"scale":1,"rotation":0}}'::jsonb
      else null
    end;

    if preset is not null then
      update public.users
      set avatar_config = preset
      where id = rec.id;
    end if;
  end loop;
end $$;

-- ── 2. Yearbook grid stats materialised view ──────────────────
-- Replaces the N+1 scribble-count query (yearbook/page.tsx lines
-- 56–68) with a single MV scan. Covers the columns the yearbook
-- card needs: display_name, batch_id, scribble_count, etc.
--
-- Refreshed by cron or on-demand (see refresh function below).
-- The view filters out deleted/suspended users automatically.
create materialized view if not exists public.yearbook_grid_stats
as
select
  u.id,
  u.display_name,
  u.avatar_config,
  u.head_front_url,
  u.yearbook_quote,
  u.batch_id,
  u.onboarding_completed,
  bt.label as batch_label,
  bt.graduation_year,
  pr.name as program_name,
  (
    select count(*)
    from public.shirts sh
    join public.scribbles sc on sc.shirt_id = sh.id and sc.is_hidden = false
    where sh.owner_id = u.id and sh.shirt_number = 1
  ) as scribble_count
from public.users u
left join public.batches bt on bt.id = u.batch_id
left join public.programs pr on pr.id = u.program_id
where u.is_suspended = false and u.is_deleted = false
order by u.display_name asc
with no data;

-- Unique index on id so we can do a fast point-lookup per user
-- (used by the profile page to avoid re-scanning the whole MV).
create unique index if not exists yearbook_grid_stats_pk
  on public.yearbook_grid_stats (id);

-- Index on batch_id for filtered grid queries (the yearbook page
-- filters by batch >99 % of the time).
create index if not exists yearbook_grid_stats_batch_idx
  on public.yearbook_grid_stats (batch_id);

-- ── 3. Refresh helper ─────────────────────────────────────────
-- Call from a cron job or after any scribble insert/delete to
-- bring the MV up to date. Concurrently = zero-downtime (no lock
-- on the underlying tables), but requires a unique index (defined
-- above).
create or replace function public.refresh_yearbook_grid()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.yearbook_grid_stats;
end;
$$;

comment on function public.refresh_yearbook_grid() is
  'Concurrent refresh of yearbook_grid_stats. Call after scribble inserts/deletes.';
comment on materialized view public.yearbook_grid_stats is
  'Denormalised yearbook grid. Refreshed by refresh_yearbook_grid() cron or on-demand.';

-- ── 4. Grants ──────────────────────────────────────────────────
-- Yearbook grid is public-read (visible to all authenticated users
-- within the same institution). The MV sits in public schema.
grant select on public.yearbook_grid_stats to authenticated, service_role;
grant execute on function public.refresh_yearbook_grid() to service_role;

-- ── 5. Initial population ──────────────────────────────────────
-- Populate the MV immediately after creation so the first request
-- doesn't hit an empty view.
refresh materialized view public.yearbook_grid_stats;
