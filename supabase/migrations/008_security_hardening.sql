-- ============================================================
-- Security hardening for exposed public tables.
-- Keeps normal app reads working, but moves privileged mutations
-- through server/API routes that use the service role.
-- ============================================================

begin;

-- Existing RLS policies call this helper. Make the security definer
-- function search-path safe so it cannot resolve attacker-controlled
-- objects if new schemas are introduced later.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select is_admin from public.users where id = auth.uid()),
    false
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ── users ───────────────────────────────────────────────────
-- RLS is row-based, not column-based. Restrict normal authenticated
-- clients to public/profile columns and user-editable fields only.
-- Sensitive fields such as email, is_admin, is_suspended mutation,
-- and verification status changes remain service-role only.
revoke select, insert, update, delete on table public.users from anon, authenticated;

grant select (
  id,
  display_name,
  academic_group_id,
  program_id,
  batch_id,
  body_style,
  shirt_color,
  head_front_url,
  head_back_url,
  yearbook_quote,
  shirt_permission,
  is_suspended,
  is_university_verified,
  last_seen,
  onboarding_completed,
  created_at,
  updated_at,
  avatar_config
) on table public.users to authenticated;

grant update (
  display_name,
  enrollment_number,
  academic_group_id,
  program_id,
  batch_id,
  body_style,
  shirt_color,
  head_front_url,
  head_back_url,
  yearbook_quote,
  shirt_permission,
  last_seen,
  onboarding_completed,
  updated_at,
  avatar_config
) on table public.users to authenticated;

grant select, insert, update, delete on table public.users to service_role;

-- ── shirts ──────────────────────────────────────────────────
-- Normal clients may read shirts, but system fields and lock state are
-- changed through API routes only.
drop policy if exists "shirts_owner_update" on public.shirts;
drop policy if exists "shirts_insert_own" on public.shirts;

revoke insert, update, delete on table public.shirts from anon, authenticated;
grant select on table public.shirts to authenticated;
grant select, insert, update, delete on table public.shirts to service_role;

-- ── scribbles ────────────────────────────────────────────────
-- Inserts, hides, deletes, collision checks, SVG sanitization, and rate
-- limiting must pass through /api/scribble/* server routes.
drop policy if exists "scribbles_insert_authenticated" on public.scribbles;
drop policy if exists "scribbles_delete_by_owner_or_scribbler" on public.scribbles;
drop policy if exists "scribbles_hide_by_owner" on public.scribbles;
drop policy if exists "scribbles_admin_update" on public.scribbles;

revoke insert, update, delete on table public.scribbles from anon, authenticated;
grant select on table public.scribbles to authenticated;
grant select, insert, update, delete on table public.scribbles to service_role;

-- ── shirt social notes ───────────────────────────────────────
-- External social notes are separate from shirt scribbles. Users can add
-- their own notes/reactions; hiding/moderation is server-side.
revoke update, delete on table public.shirt_social_notes from anon, authenticated;
grant select on table public.shirt_social_notes to authenticated;
grant insert on table public.shirt_social_notes to authenticated;
grant select, insert, update, delete on table public.shirt_social_notes to service_role;

commit;
