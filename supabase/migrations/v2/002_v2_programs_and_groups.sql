-- ============================================================================
-- v2 — Program catalog and cohort groups.
--
-- Seeds the real 2026 graduating programs taken from the convocation roster,
-- plus their cohort groups. This is the one place batches are created, so a
-- program's batch range can be corrected with an UPDATE instead of shipping
-- new dummy rows later.
--
-- Only B.Tech CSE is batch-enabled at launch (sections 1..52). Every other
-- program is a single course-wide cohort. To enable batches for another
-- course, set batches_enabled + batch_count on its row and run the batch
-- group generation below — nothing else changes.
-- ============================================================================

-- Institution
insert into public.academic_groups (name)
values ('Bennett University')
on conflict (name) do nothing;

-- ── Programs ───────────────────────────────────────────────────────────────
-- level values are taken from the roster's UG/PG/Diploma/Ph.D. column.
-- key values are stable identifiers used by app code.

insert into public.programs
  (academic_group_id, name, key, level, graduation_year, batches_enabled, batch_count)
select g.id, v.name, v.key, v.level, 2026, v.batches_enabled, v.batch_count
from public.academic_groups g
cross join (values
  -- ── Batch-enabled at launch ──
  ('Bachelor of Technology (Computer Science and Engineering)', 'btech-cse',   'UG',      true,  52),
  -- ── Course-wide at launch: set batches_enabled/batch_count to turn on ──
  ('Bachelor of Business Administration',                        'bba',         'UG',      false, null),
  ('Master of Business Administration',                         'mba',         'PG',      false, null),
  ('Bachelor of Computer Applications',                         'bca',         'UG',      false, null),
  ('Bachelor of Arts (Journalism & Mass Communication)',         'ba-jmc',      'UG',      false, null),
  ('Master of Computer Applications',                           'mca',         'PG',      false, null),
  ('B.A., LL.B. (Hons.)',                                        'ba-llb',      'UG',      false, null),
  ('B.B.A., LL.B. (Hons.)',                                      'bba-llb',     'UG',      false, null),
  ('Master of Laws',                                             'llm',         'PG',      false, null),
  ('Bachelor of Technology (Biotechnology)',                    'btech-biotech','UG',     false, null),
  ('Bachelor of Technology (Electronics and Communication Engineering)',
                                                                'btech-ece',   'UG',      false, null),
  ('Bachelor of Technology (Mechanical Engineering)',            'btech-mech',  'UG',      false, null),
  ('Master of Technology (Computer Science and Engineering)',    'mtech-cse',   'PG',      false, null),
  ('Bachelor of Arts (Liberal Arts)',                            'ba-liberal',  'UG',      false, null),
  ('Bachelor of Arts (Film, Television & Web)',                 'ba-ftv',      'UG',      false, null),
  ('Master of Arts (Mass Communication)',                        'ma-mc',       'PG',      false, null),
  ('Post Graduate Diploma in Television and Digital Journalism', 'pgd-tv',      'DIPLOMA', false, null),
  ('Bachelor of Science (Computing)',                            'bsc-cs',      'UG',      false, null),
  ('Doctor of Philosophy (Biotechnology)',                      'phd-biotech', 'PHD',     false, null),
  ('Doctor of Philosophy (Computer Science and Engineering)',    'phd-cse',     'PHD',     false, null),
  ('Doctor of Philosophy (Electronics and Communication Engineering)',
                                                                'phd-ece',     'PHD',     false, null),
  ('Doctor of Philosophy (Law)',                                 'phd-law',     'PHD',     false, null),
  ('Doctor of Philosophy (Management)',                          'phd-mgmt',    'PHD',     false, null),
  ('Doctor of Philosophy (Media)',                               'phd-media',   'PHD',     false, null),
  ('Doctor of Philosophy (Mechanical Engineering)',              'phd-mech',    'PHD',     false, null),
  ('Doctor of Philosophy (Physics)',                             'phd-physics', 'PHD',     false, null),
  ('LL.B (Hons.)',                                               'llb-hons',    'PG',      false, null),
  ('Bachelor of Science (Honours) Physics',                      'bsc-physics', 'UG',      false, null),
  ('Bachelor of Technology (Engineering Physics)',               'btech-ephys', 'UG',      false, null)
) as v(name, key, level, batches_enabled, batch_count)
where g.name = 'Bennett University'
on conflict (key) do update
  set name = excluded.name,
      level = excluded.level,
      graduation_year = excluded.graduation_year;

-- ── Batches: one row per enabled section ──────────────────────────────────
-- Generated from each program's own config, so enabling batches for a new
-- course is a data change, not a code change.

insert into public.batches (program_id, graduation_year, batch_number)
select p.id, p.graduation_year, generate_series(1, p.batch_count)
from public.programs p
where p.batches_enabled
  and p.batch_count is not null
on conflict (program_id, graduation_year, batch_number) do nothing;

-- ── Cohort groups: intentionally NOT seeded ───────────────────────────────
-- Earlier drafts created one 'course' group per program and one 'batch' group
-- per section, and put every student in one automatically. That was a
-- dropoff: a student who picked the wrong section (or none) landed in an empty
-- room and saw nothing. Batch is now a browsing filter, and private circles are
-- created per shirt, so there is nothing to seed here.
--
-- If you already ran an earlier 002 that seeded these, migration 004 removes
-- them.

