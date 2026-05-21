-- ============================================================
-- Shirt canvas system metadata
-- Separates clipped shirt scribbles from external social notes and
-- stores avatar/template metadata without flattening layers.
-- ============================================================

alter table public.scribbles
  add column if not exists placement_mode text not null default 'box'
    check (placement_mode in ('box', 'direct', 'compose')),
  add column if not exists template_id text not null default 'farewell-half-sleeve-v1',
  add column if not exists coordinate_space text not null default 'shirt-v1-400x600';

alter table public.users
  add column if not exists avatar_config jsonb not null default '{
    "bodyTemplate": "farewell-half-sleeve-v1",
    "frontTransform": { "x": 200, "y": 72, "scale": 1, "rotation": 0 },
    "backTransform": { "x": 200, "y": 72, "scale": 1, "rotation": 0 }
  }'::jsonb;

alter table public.shirts
  add column if not exists level_override integer check (level_override between 0 and 5),
  add column if not exists level_override_reason text;

create table if not exists public.shirt_social_notes (
  id               uuid primary key default gen_random_uuid(),
  shirt_id         uuid not null references public.shirts(id) on delete cascade,
  author_id        uuid not null references public.users(id) on delete cascade,
  note_type        text not null check (note_type in ('note', 'reaction', 'sticker')),
  body             text,
  emoji            text,
  x                numeric not null check (x between 0 and 1),
  y                numeric not null check (y between 0 and 1),
  rotation         numeric not null default 0 check (rotation between -30 and 30),
  is_hidden        boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists shirt_social_notes_shirt_idx
  on public.shirt_social_notes(shirt_id, created_at desc)
  where not is_hidden;

alter table public.shirt_social_notes enable row level security;

create policy "shirt_social_notes_public_read" on public.shirt_social_notes
  for select using (not is_hidden);

create policy "shirt_social_notes_insert_author" on public.shirt_social_notes
  for insert with check (auth.uid() = author_id);
