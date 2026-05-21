# 04 — Architecture

> How the app is built. Stack, routes, schema, auth, realtime, storage, jobs.
>
> **⚠ 2026-05-21 update**: sections superseded by [`08`](./08-information-architecture-access-and-implementation-plan.md), [`09`](./09-free-tier-fallback.md), [`10`](./10-scribble-to-yearbook-transition.md). Strikethroughs mark superseded passages; replacement docs are linked inline.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router, TypeScript) | Server components for data fetching, route groups for cohesion |
| Styling | Tailwind v3 + custom CSS tokens | Speed + design-system discipline |
| Canvas | Fabric.js 7.x | Mature drawing primitives, dynamically imported only on signing route |
| Backend | Supabase (Postgres + Auth + Realtime + Storage) | Free tier covers our scale, RLS for security |
| Server image work | Sharp (Node.js runtime) | Head crop, yearbook composites |
| Email | Resend | 100/day free, sufficient with staggered digest |
| Hosting | Vercel | Next.js native, Hobby tier covers single-cohort load |
| Compression | fflate | Pure-JS ZIP for yearbook export, no native deps |

## Route map

```
/                                  → redirects to /dashboard or /login
/login                             → Google OAuth + dev bypass link (env-gated)
/auth/callback                     → OAuth callback, domain check, sync user

/onboarding                        → 3-step new-user flow
/onboarding/avatar                 → Avatar step (face + pose)

/dashboard                         → Home for verified students
/profile/[userId]                  → Anyone's profile (public-ish) — legacy, kept for compatibility
/u/[slug]                          → Canonical public profile (NEW — doc 08)
/i/[code]                          → Invite/attribution link resolver (NEW — doc 08)
/guest                             → Guest home (NEW — doc 08 round 2)
/transition                        → Phase = transition maintenance page (NEW — doc 10)
/yearbook                          → Yearbook landing (NEW — doc 10)
/shirts/[shirtId]/scribble         → Signing studio
/explore                           → Find batchmates
/groups                            → Your group list
/groups/[groupId]                  → Group canvas + members
/groups/join/[token]               → Join-by-invite-link handler
/settings                          → Profile, privacy, multi-shirt, thank-you

/yearbook                          → Yearbook mode (post-deadline)

/admin                             → Admin dashboard
/admin/moderation                  → Flagged + reported queue
/admin/users                       → User management
/admin/groups                      → Group oversight
/admin/yearbook                    → Yearbook export tools
/admin/errors                      → Error log viewer

/dev/test-users                    → DEV ONLY, env-gated, multi-user testing
/dev/as/[slot]                     → DEV ONLY, switch active dev user

/api/auth/sync-user                → Bootstrap user row on first OAuth login
/api/avatar/config                 → GET/PATCH avatar JSON
/api/avatar/upload-head            → POST head image, Sharp resize → WebP
/api/scribble/place                → POST place scribble (sanitize, persist, notify)
/api/scribble/remove               → POST remove scribble (owner/admin)
/api/scribble/report               → POST flag scribble
/api/scribble/request              → POST request permission / PATCH approve|reject
/api/scribble/react                → POST emoji reaction
/api/scribble/voice                → POST attach voice note (or part of /place)
/api/shirt/lock                    → POST toggle shirt lock
/api/settings/update               → PATCH profile fields
/api/groups/create | join | leave  → group CRUD
/api/admin/users                   → PATCH suspend/promote
/api/admin/moderation              → PATCH hide/remove/dismiss
/api/admin/settings                → PATCH platform settings
/api/admin/errors                  → admin errors readout
/api/export-requests               → User asks for a group/batch export
/api/yearbook/export               → ZIP of cards by batch (admin only)
/api/email/digest                  → cron-triggered Resend dispatch
/api/errors/report                 → client-side error report endpoint
```

## Auth

- **Google OAuth** is the only sign-in method.
- The `auth/callback` route checks the user's email domain against `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` (comma-separated). Domains in the list → verified student. Out-of-list domains → guest user (limited).
- The root `proxy.ts` enforces:
  - Not signed in + not on a public route → redirect to `/login`
  - Signed in but `onboarding_completed = false` + not on `/onboarding` → redirect to `/onboarding`
  - ~~Guest user trying to hit `/dashboard` or anything other than `/shirts/[id]/scribble` → redirect to a "guest landing" page~~ **Superseded by doc 08 §"Guest Product Model" + Round 2 decision 1**: guest allowed list expanded to include `/guest`, `/explore`, `/activity`, `/u/[slug]`, `/i/[code]` plus existing scribble/profile routes.
- Dev-auth bypass exists for local testing (`isDevAuthBypassEnabled()`), env-flagged off in production.

## Schema (after migration 009)

Core tables (most existed before — see `001_schema.sql`):

```
users
  id (uuid, FK auth.users.id)
  email, display_name
  enrollment_number
  academic_group_id, program_id, batch_id
  body_style, shirt_color            -- LEGACY (Route 1); see "Avatar & shirt rendering"
  head_front_url, head_back_url
  avatar_config (jsonb)              -- Route 1 source of truth (avatar_config.presetId)
  yearbook_quote
  shirt_permission (open | batch_only | request_only | locked)
  thank_you_message text          (NEW in 009)
  is_admin, is_suspended, is_university_verified
  is_guest boolean default false  (NEW in 009)
  last_quest_completed_on date    (NEW in 009, missed in v1 of this doc)
  last_digest_sent_on date        (NEW in 009, missed in v1 of this doc)
  onboarding_completed
  last_seen
  created_at, updated_at

  -- Round 2 (migration 010 — pending):
  is_deleted boolean default false             — see doc 08 §7
  deleted_at timestamptz                       — see doc 08 §7
  delete_opted_out_shirt boolean default false — see doc 08 §7
  yearbook_legacy_line text                    — see doc 08 §10
  yearbook_next_step text                      — see doc 08 §10
  yearbook_visibility text default 'public'    — see doc 08 §10
  yearbook_featured_scribble_ids uuid[]        — see doc 08 §10
  yearbook_ceremony_seen_at timestamptz        — see doc 10

shirts
  id, owner_id, shirt_number (1..3)
  front_texture_url, back_texture_url, sleeves_texture_url (legacy, unused for SVG flow)
  front_occupancy, back_occupancy, sleeves_occupancy (0..100)
  is_locked
  avatar_config_override jsonb     (NEW in 009 — per-shirt avatar)
  level_override, level_override_reason
  created_at

  CONSTRAINT shirt_max_3 CHECK (shirt_number BETWEEN 1 AND 3)

scribbles
  id, shirt_id, scribbler_id
  panel (front | back | sleeves)
  x, y, w, h
  canvas_json (jsonb)
  canvas_svg (text — primary render)
  canvas_png_url (deprecated)
  placement_mode (box | direct | compose)
  template_id, coordinate_space
  ~~is_anonymous boolean default false  (NEW in 009)~~  — kept for history, **no longer used**; cut in doc 08 round 2 decision 2
  voice_url text                       (NEW in 009)
  voice_duration_ms int                (NEW in 009)
  is_flagged, flag_count, is_hidden
  created_at

scribble_reactions   (existed in 004)
scribble_reports     (existed)
shirt_social_notes   (existed in 007 — non-shirt-content layer)
scribble_requests    (existed)
friend_groups        (existed)
friend_group_members (existed)
notifications        (existed)
user_reports         (existed in 006)
export_requests      (existed in 005)
error_logs           (existed in 005)
platform_settings    (existed)
academic_groups, programs, batches  (existed)
```

## Avatar & shirt rendering (Route 1 — single system)

One avatar component, one canonical white shirt, one canonical drawable polygon. Locked 2026-05-21 (see `docs/07-changelog.md` "Route 1 architecture lock"). There is no longer a dual `AvatarDisplay` vs `AvatarRenderer` story — the CSS-rectangle implementation has been removed.

```
user row  ──►  resolveAvatar()  ──►  <Avatar>  ──►  <AvatarRenderer>
                     │                                     │
                     │ prefers avatar_config.presetId      ▼
                     │ falls back via LEGACY_BODY_STYLE_   preset SVG (front/back)
                     │ MAP from body_style                 ├── #skin-fill       (CSS var --skin-tone)
                     │ defaults to                         ├── #shirt-base      (canonical white)
                     │ DEFAULT_AVATAR_PRESET_ID            ├── #shirt-drawable  ◄── shirtTemplate.ts polygon
                                                           └── #shirt-overlay   (seams / buttons)
```

- **Component layer**: `components/avatar/Avatar.tsx` is the only public entry point. It resolves preset + skin tone + head URLs from a user row (or accepts a pre-resolved config / bare `presetId`) and delegates to `AvatarRenderer`. The legacy `AvatarDisplay` is deleted.
- **Resolver**: `lib/utils/avatarResolve.ts` is the single place that interprets `avatar_config` + the legacy `users.body_style` column. Also exports `HERO_PRESET_IDS` / `HERO_PRESETS` for the six launch-critical poses surfaced in onboarding step 3.
- **Drawable polygon**: `lib/utils/shirtTemplate.ts` exports the canonical drawable region (`M82 206 L136 154 L168 190 C188 204 212 204 232 190 L264 154 L318 206 L340 558 C284 570 116 570 60 558 Z`, in 400×600 space). The signing studio clips strokes to this polygon, `/api/scribble/place` rejects boxes outside it, and the rendered avatar masks scribbles to the same polygon. Every preset SVG's `id="shirt-drawable"` path matches this exact string — see `docs/08-avatar-shirt-assets.md`.
- **Shirt colour**: dropped. One canonical white shirt across every render. `users.shirt_color` and `lib/constants.ts:SHIRT_COLORS` are kept as legacy back-compat reads but are not consumed by any render path. Onboarding no longer surfaces a colour picker.
- **Legacy `body_style` column**: no longer the source of truth. It is consulted only when `avatar_config.presetId` is absent (pre-Route-1 rows), where `LEGACY_BODY_STYLE_MAP` (`M1`–`F3` → hero preset id) gives those users a sensible fallback render. New writes set `avatar_config.presetId`; `body_style` is left untouched.
- **Per-shirt override**: `shirts.avatar_config_override` (migration 009) still flows through the same resolver — when set, it is merged on top of the user's resolved config.

## RLS strategy

Set by `002_rls.sql` + `008_security_hardening.sql`. Key principles:

- `users`: anyone can read public fields; users can update their own row; admins can update anyone
- `shirts`: anyone can read; only owner can update lock; admin can update level
- `scribbles`: anyone can read non-hidden; only authenticated can insert (with ownership check via API); only shirt-owner or admin can update `is_hidden`
- `notifications`: only the target user can read; only `service_role` can insert (we use the API to write)
- All sensitive mutations go through API routes that use the service-role client, so RLS is a defense-in-depth, not the only gate

## Realtime

- **One channel per shirt page**, opened by the viewer/signer of `/shirts/[shirtId]/scribble` and `/profile/[userId]`
- Presence tracks viewers (avatar dots)
- Broadcast events:
  - `texture_updated` — fires after a scribble is placed/removed so other open viewers refetch
  - `box_moved` — ghost-box position during active drawing (legacy, will be deprecated in compose-mode-only mobile)
  - `stroke` — live stroke broadcast (desktop direct mode only)
- The channel closes when the user leaves the page
- Free-tier ceiling: 200 concurrent connections; design budget = ~150 active shirt-page tabs at peak
- **Role-based subscription (doc 08 round 2 decision 1)**: guests can only subscribe to shirts where they have an approved request or active `share_link_visit`.
- **Soft-degrade switches (doc 09)**: `disable_realtime_presence` and `disable_realtime_broadcast` flags fall back to 30s polling if concurrent connections cross 150 / 180.

## Storage

Two buckets in Supabase Storage:

| Bucket | Visibility | Contents |
|---|---|---|
| `avatar-heads` | Public | User head images (`<user_id>/front.webp`, `back.webp`) — 512×512 max, Sharp-processed |
| `shirt-textures` | Public | Voice note clips (`voice/<shirt_id>/<scribble_id>.webm`) and deprecated per-scribble PNGs |

Storage budget calculation:
- Heads: 1,500 users × ~80KB each = 120 MB
- Voice notes: 5,000 voice notes × ~30KB = 150 MB
- Buffer for exports/backups: 200 MB
- **Total expected: ~470 MB, fits in 1 GB free tier**

## Asset directory

Static visual assets live under `public/` and ship with the build (no Supabase Storage round-trip). The Sunlit Lawn theme (doc 18) adds two surfaces:

- `public/illustrations/place/` — sketch-style university backgrounds (Sunlit Lawn Place layer). Replaceable WebP, 3 crops each (desktop/tablet/mobile). See [doc 18 § 4](./18-sunlit-lawn-theme-spec.md#4--place-layer--illustrations).
- `public/scribbl/stickers/` — 12 sticker SVGs (paper-plane, heart, lightning, etc.) used both as in-shirt scribble additions and as page-level marginalia via `<DriftingDoodles>`. See [doc 18 § 8](./18-sunlit-lawn-theme-spec.md#8--marginalia-primitives).

## Component directory (Sunlit Lawn)

The Phase 1 theme primitives live under these folders:

- `components/place/` — `<PlaceBackground>` only (the illustrated layer).
- `components/brand/` — `<Whiteboard>`, `<AvatarHalo>`, `<DriftingDoodles>` (brand-owned surfaces).
- `components/marginalia/` — `<AsteriskDivider>`, `<HandDrawnArrow>`, `<HeroStickerNotes>` (the four-slot hero composition shared by dashboard + profile).
- `components/forms/` — `<InkUnderline>`, `<InkCheckbox>` (form micro-interactions).
- `components/feedback/` — `<StampSuccess>`, `<PencilLoader>` (success + loading micro-interactions).
- `lib/hooks/` — `useFirstVisit`, `usePrefersReducedMotion`, `useSlowConnection` (the three hooks that drive the first-visit hero mechanic + accessibility skips).

## Realtime patterns (concrete)

```ts
// useShirtChannel.ts
const channel = supabase.channel(`shirt:${shirtId}`)
  .on('broadcast', { event: 'texture_updated' }, payload => refetch())
  .on('presence', { event: 'sync' }, () => setViewerCount(channel.presenceState()))
  .subscribe()
```

After a successful `/api/scribble/place`, the API also broadcasts on the channel (server-side broadcast via Supabase REST channel send).

## Email

- **Resend** sends transactional emails (thank-you nudges, weekly digest, request-received notifications when offline)
- 100/day free is tight for 1,500 users; we batch and stagger:
  - Weekly digest: split user base across 7 days (~215 emails/day, will need paid Resend tier OR a fallback to a per-user "Send manually" flow)
  - Critical transactional emails (request-received) fire immediately
- **Plan B if Resend free runs out:** Brevo (300/day free) as a secondary provider, or fall back to in-app notifications only

## Jobs / cron

- `box-expiry` Supabase Edge Function: deletes stale `box_claims` after 10 min (existing)
- ~~`daily-digest` Vercel Cron (or Supabase Edge Function): hits `/api/email/digest` once per day at user's local timezone-adjacent slot~~ **Superseded by doc 08 §"Email Reminder Architecture"**: weekly digest, staggered by `hash(user_id) % 7`. Daily cron now runs but only sends to that day's slot.
- ~~`deadline-lock`: at deadline, sets all shirts `is_locked = true`~~ **Superseded by doc 10**: a single `phase-transition` cron checks `platform_settings.scribble_ends_at` and flips phase + locks shirts.
- **NEW (doc 09)**: `system-health` daily cron reads free-tier usage, auto-flips soft-degrade switches, and emails admin.

## Performance budget

| Surface | Target |
|---|---|
| LCP on dashboard (mobile, 3G) | <3.5s |
| First scribble placement save | <800ms |
| Texture refresh on broadcast | <500ms |
| Cold start serverless function | <1.5s |

## Known limits

- Vercel Hobby serverless timeout: 10s — yearbook ZIP export above 200 students may timeout
- Supabase free Realtime: 200 concurrent — soft cap at ~150 active shirt-page tabs
- Supabase free Storage: 1 GB — see budget above
- Supabase free DB: 500 MB — text+JSONB is small, should be safe

## When we'd outgrow free tier

If we hit any of:
- 200+ concurrent realtime tabs (farewell day evening at scale)
- Voice notes exceeding ~5,000 clips (storage)
- Yearbook export needing >10s server time

The minimum upgrade is Supabase Pro ($25/mo) + Vercel Pro ($20/mo). We'd evaluate week 3 of the launch window.
