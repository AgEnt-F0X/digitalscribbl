-- ============================================================================
-- v2 — Retire the batch-scoped group model.
--
-- Cohort groups created no value and cost real dropoff: a CSE student had to
-- pick one of 52 sections to see anything, so a wrong or missing batch put them
-- in an empty room. Under the revised model, batch is a browsing filter and
-- friend groups are private, opt-in circles — neither needs seeded rows.
--
-- This migration therefore REMOVES the auto-seeded cohort groups. It does not
-- drop the group tables: free-form friend groups still exist, and `kind` is
-- kept for forward compatibility, but nothing seeds 'course' or 'batch' groups
-- anymore.
--
-- Safe to run once on a database created by 001 + 002. If 002 was never run,
-- the deletes are no-ops.
-- ============================================================================

-- ── Remove auto-seeded cohort groups ────────────────────────────────────────
-- Members are dropped with the group (ON DELETE CASCADE). No student has
-- joined a cohort group yet because the onboarding auto-join was never built.

delete from public.friend_groups where kind in ('course', 'batch');

-- ── Course-wide groups: opt-in, not automatic ──────────────────────────────
-- If a course (e.g. all BBA students) ever wants a shared space, an admin
-- creates it explicitly and students join it themselves. Nothing is created
-- for them automatically, so no student lands in a group they did not pick.

-- ── Report ─────────────────────────────────────────────────────────────────
-- Expected after running: zero rows in friend_groups with kind in
-- ('course','batch'), and no change to friend_group_members for groups the
-- students created by hand.
