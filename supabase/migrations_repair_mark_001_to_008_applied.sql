-- Run this once in the Supabase SQL editor if migrations 001-008 were
-- applied manually before the Supabase CLI/GitHub migration flow was linked.
--
-- Purpose:
-- Mark the existing migration files as already applied so future GitHub/CLI
-- deployments do not try to replay them.
--
-- Keep the actual files in supabase/migrations. Do not gitignore or delete
-- them; migration files are the source-controlled schema history.

begin;

alter table supabase_migrations.schema_migrations
  add column if not exists name text,
  add column if not exists statements text[];

insert into supabase_migrations.schema_migrations(version, name, statements)
values
  ('001', 'schema', array[]::text[]),
  ('002', 'rls', array[]::text[]),
  ('003', 'direct_scribbles', array[]::text[]),
  ('004', 'scribble_reactions', array[]::text[]),
  ('005', 'export_requests_and_error_logs', array[]::text[]),
  ('006', 'safety_and_external_accounts', array[]::text[]),
  ('007', 'shirt_canvas_system', array[]::text[]),
  ('008', 'security_hardening', array[]::text[])
on conflict (version) do update
set
  name = coalesce(supabase_migrations.schema_migrations.name, excluded.name),
  statements = coalesce(supabase_migrations.schema_migrations.statements, excluded.statements);

commit;

select version, name
from supabase_migrations.schema_migrations
where version in ('001', '002', '003', '004', '005', '006', '007', '008')
order by version;
