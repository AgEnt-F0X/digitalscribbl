-- 013: Bennett University Academic Hierarchy & Program Requests
-- Seeds default Bennett University schools, programs, and 2026 batches,
-- and creates the program_requests table for unlisted course submissions.

-- ── 1. Program Requests Table ─────────────────────────────────
create table if not exists public.program_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  school_name  text not null,
  program_name text not null,
  batch_label  text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

-- RLS for program_requests
alter table public.program_requests enable row level security;

create policy "Users can insert program requests"
  on public.program_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own requests"
  on public.program_requests for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all requests"
  on public.program_requests for select
  to service_role
  using (true);

-- ── 2. Bennett University Academic Hierarchy Seed Function ─────
create or replace function public.seed_bennett_academic_hierarchy()
returns void
language plpgsql
security definer
as $$
declare
  g_cs uuid;
  g_eng uuid;
  g_mgmt uuid;
  g_law uuid;
  g_media uuid;
  
  p_btech_cs uuid;
  p_bca uuid;
  p_btech_biotech uuid;
  p_bba uuid;
  p_ballb uuid;
  p_bajmc uuid;
begin
  -- Schools (Academic Groups)
  insert into public.academic_groups (name)
  values ('School of Computer Science & Engineering')
  on conflict (name) do update set name = excluded.name
  returning id into g_cs;

  insert into public.academic_groups (name)
  values ('School of Engineering & Applied Sciences')
  on conflict (name) do update set name = excluded.name
  returning id into g_eng;

  insert into public.academic_groups (name)
  values ('School of Management')
  on conflict (name) do update set name = excluded.name
  returning id into g_mgmt;

  insert into public.academic_groups (name)
  values ('School of Law')
  on conflict (name) do update set name = excluded.name
  returning id into g_law;

  insert into public.academic_groups (name)
  values ('School of Media & Liberal Arts')
  on conflict (name) do update set name = excluded.name
  returning id into g_media;

  -- Programs under School of CS
  insert into public.programs (academic_group_id, name)
  values (g_cs, 'B.Tech Computer Science')
  on conflict (academic_group_id, name) do update set name = excluded.name
  returning id into p_btech_cs;

  insert into public.programs (academic_group_id, name)
  values (g_cs, 'BCA (Bachelor of Computer Applications)')
  on conflict (academic_group_id, name) do update set name = excluded.name
  returning id into p_bca;

  -- Programs under School of Engineering
  insert into public.programs (academic_group_id, name)
  values (g_eng, 'B.Tech Biotechnology')
  on conflict (academic_group_id, name) do update set name = excluded.name
  returning id into p_btech_biotech;

  -- Programs under School of Management
  insert into public.programs (academic_group_id, name)
  values (g_mgmt, 'BBA (Bachelor of Business Administration)')
  on conflict (academic_group_id, name) do update set name = excluded.name
  returning id into p_bba;

  -- Programs under School of Law
  insert into public.programs (academic_group_id, name)
  values (g_law, 'BA LLB (Hons)')
  on conflict (academic_group_id, name) do update set name = excluded.name
  returning id into p_ballb;

  -- Programs under School of Media
  insert into public.programs (academic_group_id, name)
  values (g_media, 'BA Journalism & Mass Comm (BA JMC)')
  on conflict (academic_group_id, name) do update set name = excluded.name
  returning id into p_bajmc;

  -- Batches (Class of 2026 default for each program)
  if p_btech_cs is not null then
    insert into public.batches (program_id, graduation_year, label)
    values (p_btech_cs, 2026, 'Class of 2026')
    on conflict (program_id, graduation_year) do nothing;
  end if;

  if p_bca is not null then
    insert into public.batches (program_id, graduation_year, label)
    values (p_bca, 2026, 'Class of 2026')
    on conflict (program_id, graduation_year) do nothing;
  end if;

  if p_btech_biotech is not null then
    insert into public.batches (program_id, graduation_year, label)
    values (p_btech_biotech, 2026, 'Class of 2026')
    on conflict (program_id, graduation_year) do nothing;
  end if;

  if p_bba is not null then
    insert into public.batches (program_id, graduation_year, label)
    values (p_bba, 2026, 'Class of 2026')
    on conflict (program_id, graduation_year) do nothing;
  end if;

  if p_ballb is not null then
    insert into public.batches (program_id, graduation_year, label)
    values (p_ballb, 2026, 'Class of 2026')
    on conflict (program_id, graduation_year) do nothing;
  end if;

  if p_bajmc is not null then
    insert into public.batches (program_id, graduation_year, label)
    values (p_bajmc, 2026, 'Class of 2026')
    on conflict (program_id, graduation_year) do nothing;
  end if;
end;
$$;

-- Execute the seed
select public.seed_bennett_academic_hierarchy();
