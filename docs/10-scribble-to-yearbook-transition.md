# 10 — Scribble → Yearbook phase transition

> The product runs in two distinct phases. Scribble phase = live signing. Yearbook phase = permanent archive. This doc defines how we cut over, what survives, what the user experiences, and what the database / routes / jobs do at each step.
>
> Companion to doc 08 (IA) + doc 09 (free-tier ops). Locks the decisions from 2026-05-21 round 2.
>
> **⚠ v1 launch scope (2026-05-21 round 2.1 — afternoon)**: only the **schema + phase machine + lock-route plumbing** ship in v1. The transition page, ceremony animation, yearbook landing, and yearbook profile UI all ship in the **last week of the live month** as a "yearbook launch" milestone. Reason: yearbook quality depends on what the cohort actually produces, and the team's energy in launch week is better spent on scribble polish. The plumbing must still be scalable — once data is flowing in scribble phase, no schema change should be needed to flip phases later.

## v1 launch — what actually ships from this doc

| In v1 | Deferred to last-week launch |
|---|---|
| `platform_settings.phase` row (defaults to `'scribble_open'`) | `/transition` page polish |
| `platform_settings.scribble_ends_at` / `yearbook_opens_at` rows (nullable) | `/yearbook` landing |
| `lib/utils/phase.ts` helper (returns `'scribble_open'` until admin flips) | `/u/[slug]` ceremony animation |
| All scribble write APIs **read** the phase flag and refuse if not `scribble_open` | Sharp batch PNG render job |
| `users.yearbook_*` columns (nullable, unused) | Yearbook content prompts |
| `yearbook_renders` table (empty) | `users.yearbook_ceremony_seen_at` UI gate |
| `is_locked` already gated by phase | Admin "open yearbook" endpoint |

This way, when you flip on yearbook polish in the last week, the data is already in the right tables and no migration is needed. The only thing changing then is **UI components and one cron**.

## Why two phases, not one feature

Scribble phase and yearbook phase serve different user needs:

| | Scribble phase | Yearbook phase |
|---|---|---|
| Primary action | Sign + be signed | View + remember |
| Tone | Active, present, urgent | Reflective, permanent |
| Data model | Mutable scribbles + reactions + requests | Frozen scribbles + finalised profile cards |
| Hosting cost | High (realtime, voice, drawing) | Low (mostly static reads) |
| Audience | Cohort + close friends | Cohort + future-them + alumni searching |
| URL surface | `/dashboard`, `/shirts/[id]/scribble`, `/explore`, `/groups` | `/yearbook`, `/u/[slug]` |

Treating them as **one feature with a switch** is wrong. They are two products that share a database.

## State machine

```
                ┌───────────────┐                                ┌────────────┐
                │ scribble_open │ ── admin sets end timestamp ──▶│ countdown  │
                └───────────────┘                                └─────┬──────┘
                                                                       │ T-0
                                                                       ▼
        ┌──────────────┐  yearbook ready ◀─── admin clicks ──┐  ┌─────────────┐
        │  yearbook    │ ◀────────────────────────────────── │  │  transition │
        └──────────────┘                                     └──┤    (down)   │
                                                                 └─────────────┘
```

Stored in `platform_settings`:

```sql
insert into public.platform_settings (key, value) values
  ('phase',              '"scribble_open"'),  -- 'scribble_open' | 'countdown' | 'transition' | 'yearbook'
  ('scribble_ends_at',   'null'),             -- ISO timestamp string, set when admin starts countdown
  ('yearbook_opens_at',  'null'),             -- ISO timestamp string, set when admin opens yearbook
  ('transition_message', '"Scribble phase has ended. Yearbook is being prepared."')
on conflict (key) do nothing;
```

The current phase is read on every page render through `lib/utils/phase.ts` (new helper, cached for 30 s).

## What each phase allows

### Phase: `scribble_open` (current default)
Everything the app already does. No restrictions beyond the usual permission model.

### Phase: `countdown`
Same as `scribble_open` plus:
- Banner at the top of every page: "Scribble phase ends in X hours."
- Email reminders at T-72h, T-24h, T-1h (one batch each) via Resend.
- Dashboard prompts user to fill yearbook content fields (doc 08 §10).
- Modal at T-24h on first dashboard open of the day.

### Phase: `transition`
The whole user-facing site is replaced with a single maintenance page.

What works in transition mode:
- `/transition` page (the maintenance screen with copy, illustration, return ETA).
- `/admin/*` — admin can still operate.
- `/api/admin/*` — admin API works.
- `/api/auth/*` — sessions can be refreshed (so OAuth doesn't break across the gap).
- Everything else returns 503 with the same page.

What gets cleaned up at entry to transition:
- All `shirts.is_locked` flipped to `true` in one transaction.
- `texture_updated` and `stroke` realtime broadcasts cease (channel subscribers naturally disconnect).
- `/api/scribble/*`, `/api/shirt/lock`, `/api/shirt/social-notes` start returning 410 Gone.
- `notifications` insertion suspended (no more "X signed your shirt" rows).
- Email digest cron disabled.
- Voice recorder UI gone (component removed from route bundles).

### Phase: `yearbook`
The product flips to read-only with a different UX.

What works in yearbook mode:
- `/yearbook` — landing page (cohort grid + search + filter by program/batch).
- `/u/[slug]` — public permanent profile (the yearbook card).
- `/groups/[id]` — read-only group page with the frozen group canvas.
- `/settings` — limited to "edit yearbook quote" (until admin freezes editing fully) + "delete my account".
- Admin tools.

What does NOT work in yearbook mode:
- Any scribble write API (410 Gone).
- Realtime subscriptions (channels are not created).
- Drawing studio routes redirect to `/u/[slug]?from=scribble-attempt`.
- New requests, reactions, locks.

## The yearbook profile page — what it looks like

This is the **permanent artefact** every user gets. Lives forever at `/u/[slug]`.

Contents (top to bottom):

1. **Hero**
   - Final avatar (their face + body + shirt) at large size, *with all scribbles flattened in*.
   - Display name in Caveat. Batch label below.
   - "Where I'm headed" (one line, optional, from doc 08 §10).

2. **The legacy line**
   - "What I want to be remembered for" in handwritten font, 140 chars max (doc 08 §10).

3. **Shirt gallery**
   - Front + back tabs. Both flattened.
   - Download PNG button per side.

4. **Featured scribbles** (up to 3 chosen by user or auto-picked)
   - Each shown bigger, with author name + their slug link + a play button if it has a voice note.

5. **Stats strip**
   - Total scribbles received
   - Unique signers
   - Final shirt level
   - Days the shirt was open

6. **Group canvases the user was part of**
   - Card preview + link to `/g/[slug]`.

7. **Search-friendly footer**
   - Program · Academic group · Batch · Year of graduation
   - "Find more from this batch" link

What is NOT on the yearbook page:
- Email
- Enrollment number
- Phone, social handles
- Edit buttons (unless viewer is the owner)
- Notification bell

### Visibility
Driven by `users.yearbook_visibility` (doc 08 §10):
- `public` — anyone can view, including non-logged-in visitors.
- `batch` — only verified students in the same batch can view; others see "This yearbook is batch-only" page.
- `hidden` — only the owner can view it directly; no listings include it.

### Owner-only edit
Even in yearbook phase, the owner can:
- Edit the legacy line (until admin freezes editing fully, e.g. one month after yearbook opens).
- Swap featured scribbles.
- Change visibility.

Other identity (display name, head, body) is locked — too disruptive to allow changes once friends have linked to it.

## Cutover playbook

### T-7 days before scribble ends
- Admin sets `scribble_ends_at` in `/admin/settings`.
- Phase auto-flips to `countdown` once the timestamp is set.
- Banner appears site-wide.
- Yearbook content prompt appears on dashboard.

### T-24h
- Stronger banner + modal.
- Email reminder fires.
- Snapshot job runs: `select count(*) from shirts where front_occupancy + back_occupancy = 0` → admin sees how many users haven't been signed at all (could be reminded individually).

### T-0 (scribble ends)
A single admin action (or a Vercel Cron triggered by `scribble_ends_at`) calls `POST /api/admin/phase/transition`. It atomically:

1. `update platform_settings set value = '"transition"' where key = 'phase'`.
2. `update shirts set is_locked = true`.
3. Disables the email digest cron flag.
4. Returns success → admin dashboard reflects new state.

Users with the app open see the next route they navigate to return the transition page. Those mid-scribble see a 410 on submit with copy: *"Scribble phase just ended. Your draft is saved on this device — but the shirt is sealed now."*

### Transition window (admin-controlled duration)
- Admin builds + verifies the yearbook in a staging copy.
- Tasks before opening:
  - Generate every user's flattened shirt PNG (front + back) via a batch Sharp job (one row per user in `yearbook_renders`).
  - Auto-pick featured scribbles for users who didn't choose: top 3 by reactions count.
  - Build group canvas exports.
  - Compute final shirt level per user.
  - Generate `/u/[slug]` static pages where possible (ISR with infinite revalidate).

### Yearbook opens
Admin clicks "Open yearbook" → `POST /api/admin/phase/yearbook`:

1. Phase flips to `'yearbook'`.
2. `yearbook_opens_at` recorded.
3. Email broadcast fires: "Scribbl yearbook is live."
4. New routes activate.

### Ceremony animation
First time a user opens **their own** yearbook page (`/u/[my-slug]`), a one-time animation plays:

- Page loads with shirt blurred.
- Gold border draws around the shirt (1.2 s).
- Scribbles fade in one-by-one, oldest first (4 s max total).
- Pencil sound effect (single 1.5 s `.mp3`, <30 KB, can be muted).
- Copy: *"Your shirt is sealed. Forever."* (Caveat, fades in last).
- Confetti burst (existing `canvas-confetti` dep).
- Page unblurs into normal state.

Marker stored on user: `yearbook_ceremony_seen_at timestamptz` (added in migration 010). Once set, animation never plays again.

## Schema additions (migration 010)

```sql
-- Phase + ceremony tracking
alter table public.users
  add column if not exists yearbook_ceremony_seen_at timestamptz;

-- Pre-rendered yearbook PNGs to avoid Sharp at request time
create table public.yearbook_renders (
  user_id        uuid primary key references public.users(id) on delete cascade,
  shirt_id       uuid not null references public.shirts(id) on delete cascade,
  front_png_url  text,
  back_png_url   text,
  generated_at   timestamptz not null default now(),
  is_stale       boolean not null default false
);

create index if not exists yearbook_renders_stale_idx
  on public.yearbook_renders (is_stale)
  where is_stale = true;
```

## Route map by phase

| Route | scribble_open | countdown | transition | yearbook |
|---|---|---|---|---|
| `/` | redirects | redirects | → `/transition` | → `/yearbook` |
| `/login` | active | active | active (admin can sign in) | active |
| `/dashboard` | active | active + banner | → `/transition` | → `/yearbook` |
| `/profile/[id]` | active | active | → `/transition` | 301 → `/u/[slug]` |
| `/u/[slug]` | not built | not built | not active | active |
| `/shirts/[id]/scribble` | active | active | 410 | 410 → `/u/[slug]` |
| `/explore` | active | active | → `/transition` | → `/yearbook` (different surface) |
| `/groups`, `/groups/[id]` | active | active | → `/transition` | active (read-only) |
| `/activity` | active | active | → `/transition` | gone (no new activity) |
| `/settings` | active | active | → `/transition` | active (limited) |
| `/yearbook` | not built | not built | not active | active |
| `/admin/*` | active | active | active | active |
| `/api/scribble/*` | 200 | 200 | 410 | 410 |
| `/api/shirt/lock` | 200 | 200 | 410 | 410 |
| `/api/email/digest` | runs | runs | disabled | disabled |
| `/api/yearbook/export` | admin-only | admin-only | admin-only | active (auth) |

## Data migration: what survives, what changes

Everything stays in the same tables. Nothing is moved or renamed. The shift is **read-only enforcement + UI swap**, not a copy-into-new-database.

Concretely:
- `scribbles` rows stay; new inserts blocked at API layer + RLS (added in 010).
- `shirts` rows stay; all become `is_locked = true`.
- `users` rows stay; yearbook-specific fields populated.
- `notifications` rows kept for 30 days post-yearbook, then bulk-deleted.
- `scribble_requests` pending rows auto-resolved to `expired` at T-0.
- `share_links` keep working in yearbook phase (point at `/u/[slug]` instead of legacy profile).
- `error_logs`, `system_health_runs` keep going (admin still operates).

## Failure modes during cutover

| Failure | What happens | Recovery |
|---|---|---|
| Cron failed to flip phase at T-0 | Users can still scribble past deadline | Admin flips manually; banner shown for delay |
| Sharp PNG render job partially failed | Some users have no yearbook PNG | Admin retries from `yearbook_renders.generated_at IS NULL` queue; users see "rendering…" placeholder until done |
| User had local draft mid-submit at T-0 | API returns 410 | Client shows "Scribble phase ended" + saves draft to `localStorage` for future "look what I almost sent" page |
| Admin clicks "open yearbook" too early | Pages 500 because renders aren't done | Pre-flight check on the API: refuses to flip unless ≥98% of `yearbook_renders` are complete |
| Storage full during PNG render | Renders fail silently | Render job writes to `system_health_runs` with reason; admin sees alert |

## What we won't ship in v1 yearbook

Listed in `06-revisit-later.md` and **stays cut** even at yearbook time:

- Friendship graph (deferred to revisit doc; can ship in a yearbook-phase v1.1)
- Print-on-demand (still cut)
- "Looking back" newsletter (parked indefinitely)
- AR shirt try-on (parked)
- Photo album linking (parked)

## Pre-launch checklist (delta from doc 05)

- [ ] Migration 010 includes `phase` setting + `yearbook_renders` table + `yearbook_ceremony_seen_at`
- [ ] `lib/utils/phase.ts` helper that caches phase for 30s
- [ ] `/transition` page exists with admin-editable copy
- [ ] `/u/[slug]` page exists and renders even with placeholder yearbook data
- [ ] `/yearbook` landing page exists
- [ ] `/api/admin/phase/transition` and `/api/admin/phase/yearbook` admin endpoints exist
- [ ] Vercel Cron `phase-transition` registered with `vercel.json` (auto-flips at `scribble_ends_at`)
- [ ] All `/api/scribble/*` routes check phase and return 410 if `transition` or `yearbook`
- [ ] Ceremony animation component + sound effect committed (`public/sound/seal.mp3` ≤ 30 KB)
- [ ] PNG render batch job tested with a dummy batch of 50 users
