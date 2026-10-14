# 21 — Yearbook (Phase 2): Figma Make Build & Data-Binding Spec

> **What this doc is.** The single source of truth for building the **yearbook phase** in Figma Make and wiring it to the *existing* Scribbl database without breaking anything. It maps every element a user produces during the scribble phase to exactly where it appears in the yearbook, and gives Figma Make concrete, paste-ready build prompts plus a data contract so the generated design drops onto real Supabase data cleanly.
>
> **Companion to:** [`10-scribble-to-yearbook-transition.md`](./10-scribble-to-yearbook-transition.md) (the phase machine and route map — read it first), [`18-sunlit-lawn-theme-spec.md`](./18-sunlit-lawn-theme-spec.md) §20 (Phase 2 hand-off), and the live schema in `supabase/migrations/`.
>
> **Status:** spec — 2026-06-09. The schema this depends on already shipped (migrations 009 + 010). No new tables are required to build the yearbook; only UI + wiring + one render job.

---

## 0 · The core promise: nothing new in the database

The most important fact for "I don't want anything broken":

**Every field the yearbook needs already exists in the database today.** Phase 1 (scribble) was deliberately built to fill the yearbook tables as it runs. Migration `010_role_access_lifecycle.sql` added the yearbook columns and the `yearbook_renders` table back in May; they sit there populated-or-nullable while the scribble phase runs.

So the yearbook is **not a data migration**. It is:
1. A **read-only UI** over data already in `users`, `shirts`, `scribbles`, `scribble_reactions`, `profile_slugs`, `friend_groups`.
2. One **batch image job** that flattens each shirt into a PNG (`yearbook_renders`).
3. A **phase flip** (`platform_settings.phase = 'yearbook'`) that swaps routes and freezes writes.

Figma Make's job is **only #1's visual layer**. This doc gives it the exact data shape so the handoff to real data is mechanical.

---

## 1 · The two surfaces

| Surface | Route | Purpose | Analogy |
|---|---|---|---|
| **Yearbook landing / grid** | `/yearbook` | The whole cohort as a browsable, searchable grid of profile cards. Filter by batch/program. | The class photo pages — every face, in a grid. |
| **Individual profile** | `/u/[slug]` | One person's permanent page: their final avatar + sealed shirt + featured scribbles + stats + the notes friends left. | The full-page senior profile you flip to. |

The grid card is a **summary** of the profile. Clicking a card opens the full profile. Both are public-by-default but gated by `users.yearbook_visibility` (see §7).

> These routes are already reserved in doc 10's route map. The current `/profile/[userId]` route 301-redirects to `/u/[slug]` once the phase flips.

---

## 2 · The golden rule for everything below

> **Yearbook = read. Never write.** No scribbling, no reactions, no requests, no locks. The only writes allowed in yearbook phase are the owner editing three of *their own* fields (legacy line, featured scribbles, visibility) and account deletion. Everything else is frozen forever.

If a Figma Make screen implies an action that writes shirt/scribble data, it's wrong for this phase. Buttons that "sign", "react", "request" must not exist on these surfaces.

---

## 3 · Data source inventory (what's already there)

Everything below is live in the schema today. Column names are exact — use them verbatim as prop/field names so wiring is copy-paste.

| Table | Yearbook-relevant columns | Notes |
|---|---|---|
| `users` | `id`, `display_name`, `enrollment_number`*, `email`*, `batch_id`, `program_id`, `academic_group_id`, `body_style`, `shirt_color`, `head_front_url`, `head_back_url`, `avatar_config` (jsonb: `presetId`, `skinTone`, `headSource`), `yearbook_quote`, `yearbook_legacy_line`, `yearbook_next_step`, `yearbook_visibility` (`public`\|`batch`\|`hidden`), `yearbook_featured_scribble_ids` (uuid[]), `yearbook_ceremony_seen_at`, `is_suspended`, `is_deleted`, `onboarding_completed` | *`email` and `enrollment_number` are **never** rendered in the yearbook. They're DB-grant-restricted to service role already (migration 008). |
| `shirts` | `id`, `owner_id`, `group_id`, `shirt_number`, `front_occupancy`, `back_occupancy`, `sleeves_occupancy`, `is_locked`, `level_override`, `level_override_reason`, `avatar_config_override` | Each user has 1–3 shirts. The yearbook uses shirt #1 as the canonical "their shirt" unless you decide to show a gallery of all of them. |
| `scribbles` | `id`, `shirt_id`, `scribbler_id`, `panel` (`front`\|`back`\|`sleeves`), `x`,`y`,`w`,`h`, `canvas_svg`, `voice_url`, `voice_duration_ms`, `is_hidden`, `created_at` | The actual marks. `canvas_svg` is the renderable vector. Filter `is_hidden = false` always. |
| `scribble_reactions` | `scribble_id`, `user_id`, `emoji` (`❤️ 😂 🥹 🔥 ✨ 🫶`) | Used to rank "featured scribbles" when the user didn't pick (top-by-reactions). |
| `shirt_social_notes` | `shirt_id`, `author_id`, `note_type`, `body`, `emoji`, `x`, `y`, `rotation`, `is_hidden` | External "sticky notes" left around the shirt. Optional yearbook content. |
| `profile_slugs` | `slug`, `user_id`, `is_current` | Drives the `/u/[slug]` URL. One current slug per user; old ones keep resolving. |
| `yearbook_renders` | `user_id`, `shirt_id`, `front_png_url`, `back_png_url`, `generated_at`, `is_stale` | Pre-flattened shirt PNGs so the profile page never rasterizes at request time. Filled by the batch job (§6). |
| `friend_groups` + `friend_group_members` + `shirts.group_id` | group `name`, members, the group's shared canvas shirt | The group-canvas card on a profile (§5.7). |
| `batches` / `programs` / `academic_groups` | `label`, `graduation_year`, `name` | The "Batch 07 · B.Tech CS · 2026" footer + grid filters. |

**Derived/computed (not stored — compute at read time or in the render job):**

| Value | How it's computed | Source |
|---|---|---|
| Shirt level (0–5) + label + color | `calculateShirtLevel({ uniqueScribblerCount, visibleScribbleCount, adminLevelOverride })` | `lib/utils/shirtLevel.ts` — Blank canvas / First marks / Circle warmup / Social shirt / Campus favorite / Farewell icon |
| Total scribbles received | `count(scribbles where shirt_id in user's shirts and not is_hidden)` | `scribbles` |
| Unique signers | `count(distinct scribbler_id)` over same | `scribbles` |
| Days the shirt was open | `date(shirt locked/sealed) − date(shirt created)` | `shirts.created_at` → phase seal date |

---

## 4 · Surface 1 — The yearbook grid (`/yearbook`)

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│  [ Whiteboard wall-mounted: "Class of 2026 · 247 sealed" ]│   ← header band
│  [ search input ]   [ Program ▾ ] [ Batch ▾ ] [ Sort ▾ ]  │   ← filter bar (sticky)
├──────────────────────────────────────────────────────────┤
│   ╭────────╮  ╭────────╮  ╭────────╮  ╭────────╮          │
│   │ card   │  │ card   │  │ card   │  │ card   │          │   ← responsive grid
│   ╰────────╯  ╰────────╯  ╰────────╯  ╰────────╯          │     2-col mobile
│   ╭────────╮  ╭────────╮  ╭────────╮  ╭────────╮          │     3-col tablet
│   │ card   │  │ card   │  │ card   │  │ card   │          │     4–5-col desktop
└──────────────────────────────────────────────────────────┘
```

### 4.2 The grid card — data binding

One card = one user. **This is the "regular yearbook photo grid" the brief asks for.**

| Card element | Source | Type | Fallback when empty |
|---|---|---|---|
| Avatar thumbnail (head + body + sealed shirt, small) | `yearbook_renders.front_png_url` (preferred) → else compose `avatar_config` + `head_front_url` + scribbles live | url / composed | `😶` placeholder head on `shirt_color` panel (see export route placeholder) |
| Name | `users.display_name` | text | "Student" (never blank) |
| Batch chip | `batches.label` (e.g. "Batch 07") | text | hide chip |
| Level badge (tiny) | `calculateShirtLevel(...)` → `label` + `color` | enum | "Blank canvas" / grey |
| Scribble count | derived count | number | `0` |
| Link target | `/u/{profile_slugs.slug}` | url | `/u/{user.id}` if no slug yet |

**Card is a pure link.** No hover actions beyond a subtle lift (reuse `.sticker-note` lift-off hover from doc 18 §14).

### 4.3 Filters, search, sort

| Control | Binds to | Behavior |
|---|---|---|
| Search | `users.display_name` (and optionally `enrollment_number` server-side only, never displayed) | client-side filter over the loaded page, or server `ilike` |
| Program filter | `programs.id` via `users.program_id` | dropdown of programs that have ≥1 sealed profile |
| Batch filter | `batches.id` via `users.batch_id` | dropdown 01–52 |
| Sort | `display_name` (A–Z, default), `level` (Farewell icon → Blank), `created_at` (joined order) | client or server |

### 4.4 States Figma Make must design

- **Loading:** skeleton grid of card-shaped paper rectangles (reuse `components/ui/Skeleton.tsx` look).
- **Empty filter result:** `Whiteboard small` "no one here yet — try another batch".
- **Hidden/batch-only entries:** users with `yearbook_visibility = 'hidden'` are **omitted entirely**; `'batch'` users appear only when the viewer is a verified same-batch student, otherwise omitted (server enforces — Figma Make just renders whatever list it's handed).

---

## 5 · Surface 2 — The individual profile (`/u/[slug]`)

This is the **permanent artefact**. Brief requirement — *"everything that becomes part of someone's profile is displayed here."* The section order below is locked by doc 10; this doc adds the exact data binding and fallbacks for each.

> **Scroll order, top → bottom:** Hero → Legacy line → Shirt gallery → Featured scribbles → Stats strip → Group canvases → Search footer.

### 5.1 Hero

| Element | Source | Type | Fallback |
|---|---|---|---|
| Final avatar (head on body, large) | composed from `avatar_config.presetId` (body SVG in `src/assets/scribbl/avatar-presets/...`) + `head_front_url` + `avatar_config.skinTone` | composed image | preset body + `😶` placeholder if `head_front_url` null (`avatar_config.headSource === 'skipped'`) |
| Sealed shirt **with all scribbles flattened in** | `yearbook_renders.front_png_url` | url | live-composite fallback (slow) |
| Display name (Caveat, large) | `users.display_name` | text | "Student" |
| Batch label | `batches.label` · `programs.name` · `graduation_year` | text | hide line |
| "Where I'm headed" one-liner | `users.yearbook_next_step` | text ≤120 | hide line |

### 5.2 The legacy line

| Element | Source | Type | Fallback |
|---|---|---|---|
| "What I want to be remembered for" (handwritten, 140 char max) | `users.yearbook_legacy_line` | text | hide the whole block (don't show an empty quote frame) |
| Yearbook quote (secondary, italic) | `users.yearbook_quote` | text | hide |

Owner-editable in yearbook phase (see §7).

### 5.3 Shirt gallery

| Element | Source | Type | Fallback |
|---|---|---|---|
| Front shirt (flattened) | `yearbook_renders.front_png_url` | url | live composite |
| Back shirt (flattened) | `yearbook_renders.back_png_url` | url | live composite / "no back signatures" empty |
| Front/Back tab toggle | static UI | — | default to front |
| Download PNG per side | the render url | url | disabled if render missing |
| Occupancy ("78% full") | `shirts.front_occupancy` / `back_occupancy` | numeric | `0%` |

If a user has 2–3 shirts (`shirt_number` 1–3), decide: show only shirt #1 (simplest, matches doc 10) **or** a small "Shirt 1 / 2 / 3" switcher. Default = shirt #1 only for v1 yearbook; note the extra shirts exist so the design can grow.

### 5.4 Featured scribbles (up to 3)

The "best notes friends left," shown big.

| Element | Source | Type | Fallback |
|---|---|---|---|
| Which 3 | `users.yearbook_featured_scribble_ids` (uuid[]) | array | auto-pick: top 3 scribbles by `scribble_reactions` count (computed in render job) |
| The mark itself | `scribbles.canvas_svg` rendered as `background-image: url(data:image/svg+xml,...)` | svg string | skip if null |
| Author name | join `scribbles.scribbler_id` → `users.display_name` | text | "A friend" |
| Author profile link | `/u/{author slug}` | url | no link |
| Voice note play button | `scribbles.voice_url` + `voice_duration_ms` | url + ms | hide button if no voice |
| Reaction tally | `scribble_reactions` grouped by emoji | counts | hide |

> **Security note for Figma Make output:** scribble SVGs must be rendered as a CSS `background-image` data-URI or `<img src>` — **never** injected as inline HTML. This is how Phase 1 renders them (`components/shirt/ShirtView.tsx:484`) and it's what makes user-drawn SVG safe (CSS/`<img>` SVGs can't execute scripts). Keep that pattern.

### 5.5 Stats strip

| Stat | Source | Fallback |
|---|---|---|
| Total scribbles received | derived count | `0` |
| Unique signers | derived distinct count | `0` |
| Final shirt level + label | `calculateShirtLevel(...)` | "Blank canvas" |
| Days the shirt was open | `shirts.created_at` → seal date | `—` |

Render as four `text-meta` + `text-hero-name` pairs on substrate, no card chrome (doc 18 panel discipline).

### 5.6 Sticker / social notes (optional block)

The off-shirt notes friends left.

| Element | Source | Fallback |
|---|---|---|
| Each note (body + emoji, tilted) | `shirt_social_notes` where `is_hidden = false`, positioned by `rotation` | hide block if none |
| Author | `author_id` → `display_name` | "A friend" |

Render with `.sticker-note` + `text-handwritten-note` + `tilt-left/right` (doc 18).

### 5.7 Group canvases

| Element | Source | Fallback |
|---|---|---|
| Group card preview | `friend_groups` the user is a member of, where the group has a shared shirt (`shirts.group_id`) | hide block if none |
| Group name | `friend_groups.name` | — |
| Link | `/g/[group slug or id]` (read-only group page) | — |

### 5.8 Search-friendly footer

| Element | Source | Fallback |
|---|---|---|
| Program · Academic group · Batch · Grad year | joins via `program_id` / `academic_group_id` / `batch_id` | hide missing parts |
| "Find more from this batch" link | `/yearbook?batch={batch_id}` | — |

### 5.9 What is **never** on the profile

Hard exclusions (privacy + by design, from doc 10):
- `email`
- `enrollment_number`
- phone / social handles (not collected)
- notification bell, edit buttons (unless viewer is owner), any "sign/react/request" action

---

## 6 · Asset pipeline — how scribble content becomes yearbook images

This is the bridge that makes "connected to the assets and everything" true. There are three asset layers and one render job.

### 6.1 The three layers that compose a yearbook shirt

```
   ┌─────────────────────────────────────┐
   │ 3. Scribbles (vector)               │  scribbles.canvas_svg, positioned by x,y,w,h
   │    rendered over the shirt panel    │  (shirt coordinate space = SHIRT_W × SHIRT_H)
   ├─────────────────────────────────────┤
   │ 2. Shirt panel (solid colour)       │  users.shirt_color (#hex)
   ├─────────────────────────────────────┤
   │ 1. Avatar body + head               │  avatar_config.presetId body SVG + head_front_url
   └─────────────────────────────────────┘
```

Coordinate space: scribbles store `x,y,w,h` in the shirt's native canvas units (`SHIRT_W`, `SHIRT_H` in `lib/constants.ts`). To place a scribble on any rendered panel of width `W`, scale by `W / SHIRT_W` (same math as `app/api/yearbook/export/route.ts:36`).

### 6.2 The render job (already speced, needs building)

`yearbook_renders` is the cache. The flattening logic **already exists** in `app/api/yearbook/export/route.ts` (`generateCard()` — Sharp composites shirt colour + each `canvas_svg` at scaled position + circular head). The Phase 2 batch job is that code, run per user at transition, writing `front_png_url` / `back_png_url` instead of zipping.

Flow at the `transition → yearbook` flip (doc 10 cutover):
1. For each user's shirt #1, composite front + back PNG via Sharp.
2. Upload to the `shirt-textures` (or a new `yearbook` bucket) storage path.
3. Write `yearbook_renders.front_png_url / back_png_url`, set `is_stale = false`, `generated_at = now()`.
4. Profile page reads the PNG url — **no rasterizing at request time.**

**For Figma Make:** treat `front_png_url` / `back_png_url` as ready-made image URLs. The fallback (when `is_stale` / null) is a live client composite of the SVGs — design a "rendering…" placeholder for that window.

### 6.3 Avatar assets

Body presets are static SVGs in `src/assets/scribbl/avatar-presets/{masculine,feminine}/{preset}/{preset}-front.svg` and `-back.svg`. The head is the user's uploaded WebP (`head_front_url`, `head_back_url`) processed by `/api/avatar/upload-head` (resized 512², EXIF-stripped). `avatar_config.skinTone.hex` tints the body. The existing `<Avatar>` / `<AvatarRenderer>` components already do this composition — reuse, don't reinvent.

### 6.4 Storage buckets

| Bucket | Holds | Visibility |
|---|---|---|
| heads (`BUCKET_HEADS`) | uploaded face photos `heads/{user_id}/{side}.webp` | public-read (URLs in DB) |
| shirt-textures | voice notes, any shirt assets | public-read |
| yearbook renders | flattened shirt PNGs | public-read (CDN-cached) |

---

## 7 · Visibility & access model

Drives who can see a profile. Enforced **server-side** (Figma Make just renders the list/profile it's given).

| `users.yearbook_visibility` | Who can view `/u/[slug]` | In `/yearbook` grid? |
|---|---|---|
| `public` (default) | anyone, including logged-out visitors | yes, to everyone |
| `batch` | only verified students in the same `batch_id` | only to same-batch viewers |
| `hidden` | only the owner | never listed |

**Owner-only edits allowed in yearbook phase** (the only writes — see §2):
- `yearbook_legacy_line`
- `yearbook_featured_scribble_ids`
- `yearbook_visibility`

Identity (name, head, body, shirt, scribbles) is **locked** — friends have linked to it. Design the edit affordances as a subtle owner-only "edit" pencil on those three blocks; hide entirely for non-owners.

---

## 8 · The "nothing breaks" contract

The single thing that guarantees the Figma Make design wires onto real data without rework: **make the generated components consume one typed view-model**, with a defined fallback for every nullable field. Hand Figma Make these interfaces and tell it the components must accept exactly these props.

```ts
// The grid card consumes this — one per cohort member.
interface YearbookCardVM {
  slug: string                 // → /u/{slug}
  displayName: string          // never empty (fallback "Student")
  batchLabel: string | null    // "Batch 07"
  avatarImageUrl: string | null// yearbook_renders.front_png_url
  shirtColor: string           // #hex, panel bg fallback
  headUrl: string | null       // head_front_url (for live fallback)
  level: { label: string; color: string }  // calculateShirtLevel(...)
  scribbleCount: number
  hasFace: boolean             // avatar_config.headSource === 'upload'
}

// The profile page consumes this — one object.
interface YearbookProfileVM {
  slug: string
  displayName: string
  batchLabel: string | null
  programName: string | null
  graduationYear: number | null
  // hero
  avatarImageUrl: string | null      // composed/sealed avatar
  shirtColor: string
  headFrontUrl: string | null
  nextStep: string | null            // yearbook_next_step
  // legacy
  legacyLine: string | null          // yearbook_legacy_line
  quote: string | null               // yearbook_quote
  // shirt gallery
  shirtFrontPng: string | null       // yearbook_renders.front_png_url
  shirtBackPng: string | null        // yearbook_renders.back_png_url
  frontOccupancy: number
  backOccupancy: number
  // featured scribbles
  featured: Array<{
    id: string
    svg: string | null               // canvas_svg — render as data-URI bg/img ONLY
    authorName: string               // fallback "A friend"
    authorSlug: string | null
    voiceUrl: string | null
    voiceDurationMs: number | null
    reactions: Array<{ emoji: string; count: number }>
  }>
  // stats
  stats: {
    totalScribbles: number
    uniqueSigners: number
    levelLabel: string
    levelColor: string
    daysOpen: number | null
  }
  // social notes
  socialNotes: Array<{ body: string | null; emoji: string | null; rotation: number; authorName: string }>
  // groups
  groups: Array<{ name: string; href: string }>
  // viewer context
  isOwner: boolean                   // shows the 3 editable affordances
  visibility: 'public' | 'batch' | 'hidden'
}
```

**Rules baked into this contract:**
- Every `| null` field has a designed empty state (hide block, or placeholder). No element assumes data is present.
- `svg` fields render only as data-URI background / `<img>` — never inline HTML.
- The view-model is built **server-side** from the tables in §3; Figma Make output is a pure presentation layer over it. When you wire it, you write one `buildYearbookProfileVM(userId)` server function and the design doesn't change.

---

## 9 · Figma Make build prompts (paste-ready)

Use these as the actual Figma Make prompts. They're written so the generated layout matches the binding tables above. Generate the grid first, then the profile.

### 9.1 Grid prompt

```
Design a graduation yearbook landing page called "Class of 2026 · Scribbl".
Aesthetic: warm cream paper (#FFF6D9), dark ink text (#1A1208), one purple
accent (#6f54df), handwritten display font (Caveat) for names and headings,
clean sans (Inter) for UI. Slightly tactile / scrapbook, NOT a SaaS dashboard:
no flat material shadows, no gradient buttons. Think "golden-hour campus
keepsake."

Top: a sticky filter bar with a search field, a Program dropdown, a Batch
dropdown (01–52), and a Sort dropdown. Above it, a small aluminium-framed
whiteboard graphic reading "Class of 2026 · {N} sealed".

Body: a responsive grid of profile cards — 2 columns on mobile, 3 on tablet,
4–5 on desktop. Each card shows: a portrait image (a stylised head-and-
shoulders avatar wearing a signed t-shirt covered in colourful handwritten
scribbles), the person's name in Caveat below it, a small batch chip, a tiny
coloured "level" badge, and a faint scribble-count. Cards have a soft paper
edge and lift slightly on hover. The whole card is one link.

Design empty state ("no one here yet — try another batch") and a skeleton
loading grid. Mobile-first; tap targets ≥44px.
```

### 9.2 Profile prompt

```
Design a permanent yearbook profile page for one graduate. Same aesthetic as
the grid: cream paper, ink text, single purple accent, Caveat for display,
Inter for UI, scrapbook-tactile not SaaS.

Sections top to bottom:
1. HERO — large stylised avatar (head on an illustrated body wearing a t-shirt
   FULLY covered in friends' handwritten signatures and doodles), the person's
   name in big Caveat, a line "Batch 07 · B.Tech CS · 2026", and an optional
   one-liner "Where I'm headed: …".
2. LEGACY LINE — one handwritten sentence in a tasteful frame: "What I want to
   be remembered for". Plus an optional smaller italic quote.
3. SHIRT GALLERY — Front/Back tab toggle showing the flattened signed shirt
   image full-width, with a "Download PNG" button and a "% full" indicator.
4. FEATURED SCRIBBLES — up to 3 individual signatures shown enlarged, each with
   the author's name, an optional ▶ voice-note button, and small emoji reaction
   tallies.
5. STATS STRIP — four stats: scribbles received, unique signers, final shirt
   level (with its colour), days the shirt was open.
6. FRIENDS' STICKY NOTES — a few tilted handwritten sticky notes friends left.
7. GROUP CANVASES — small cards linking to shared group shirts.
8. FOOTER — Program · Academic group · Batch · Year, and a "Find more from this
   batch" link.

There must be NO sign/react/request buttons (this page is frozen forever). Show
small "edit" pencils only on the legacy line, featured scribbles, and a
visibility toggle — these appear only for the profile owner. Never show email
or ID number anywhere. Design a one-time "sealing ceremony" intro: shirt starts
blurred, a gold border draws in, scribbles fade in oldest-first, then "Your
shirt is sealed. Forever." in Caveat, then confetti.
```

### 9.3 After Figma Make generates

1. Export the React/Tailwind it produces.
2. Rename its props to match §8's `YearbookCardVM` / `YearbookProfileVM` (or wrap it).
3. Write `buildYearbookCardVMs(filter)` and `buildYearbookProfileVM(slug)` server functions that query the tables in §3 and return those exact shapes.
4. Drop them into `app/yearbook/page.tsx` and `app/u/[slug]/page.tsx`.
5. Because the view-models are pre-shaped, the design needs **zero data-driven rework**.

---

## 10 · Design direction (carry Sunlit Lawn → archival scrapbook)

Per doc 18 §20, Phase 2 *extends* Phase 1, it doesn't replace it. Keep the tokens, type ladder, and components; shift the mood from "live golden-hour lawn" to "preserved keepsake."

| Carry forward unchanged | Shift for yearbook |
|---|---|
| `--paper-*`, `--ink-*`, `--brand-*` tokens | Substrate cools slightly toward "archival cream" (a touch less golden than `#FFF6D9`) |
| Caveat / Patrick Hand / Inter type ladder | Bring back the deferred marginalia: **polaroid frames**, **date stamps**, **page numbers** |
| `<Whiteboard>`, `<AvatarHalo>`, `<DriftingDoodles>`, `<AsteriskDivider>` | New: `<PolaroidFrame>` for featured scribbles, a "sealed" gold-foil accent |
| `.sticker-note`, `text-handwritten-note`, tilt utilities | Place illustration becomes an auditorium/graduation-stage instead of the lawn |
| Micro-interactions catalog (doc 18 §14) | Add the one-time **sealing ceremony** animation (doc 10 §ceremony) |

This is the moment doc 18 reserved polaroids/date-stamps/page-numbers for — use them here so the yearbook feels distinct from the live app while staying the same family.

---

## 11 · Build order

Tie to the doc 10 phase machine. Phases 1–3 can be built **during** the scribble phase (data is already flowing); phase 4 is the flip.

1. **View-models first** — write `buildYearbookCardVM` + `buildYearbookProfileVM` against live scribble-phase data. Verify they return real shapes for real users today. (No UI yet.)
2. **Figma Make design** — generate grid + profile per §9, export, wire to the view-models.
3. **Render job** — port `generateCard()` into a batch writer for `yearbook_renders` (front + back PNG per user). Test on a dummy batch of 50 (doc 10 checklist).
4. **Phase flip plumbing** — `/api/admin/phase/transition` + `/api/admin/phase/yearbook`, route swaps, 410s on scribble writes, ceremony gate via `yearbook_ceremony_seen_at`.
5. **Ship** at the end of the live month (doc 10 launch milestone).

---

## 12 · Acceptance checklist (don't open the yearbook until all true)

- [ ] `buildYearbookProfileVM` returns a complete object for a user with **zero** scribbles, **no** uploaded face, and **no** yearbook text — every fallback renders, nothing throws.
- [ ] `buildYearbookProfileVM` returns complete for a "Farewell icon" user with 60+ signers, voice notes, and 3 featured scribbles.
- [ ] A `hidden` profile 404s for non-owners and renders for the owner.
- [ ] A `batch` profile renders for a same-batch verified viewer and is omitted from the grid for others.
- [ ] No scribble SVG is ever injected as inline HTML (data-URI / `<img>` only).
- [ ] Email and enrollment number appear **nowhere** in any yearbook response (view the page source, grep the JSON).
- [ ] `yearbook_renders` PNG missing → "rendering…" placeholder, not a broken image.
- [ ] No write actions reachable from `/yearbook` or `/u/[slug]` except the 3 owner edits.
- [ ] Grid + profile pass mobile Lighthouse (perf ≥90, a11y ≥95) per doc 18 §19.
- [ ] `/profile/[userId]` 301-redirects to `/u/[slug]` in yearbook phase.

---

## Appendix — element-to-yearbook map (the brief's core question)

> *"What elements from scribble will be connected to yearbook?"* — the complete list, with where each lands.

| Scribble-phase thing the user made/got | Where it lives | Where it shows in the yearbook |
|---|---|---|
| Their avatar (body preset + skin) | `users.avatar_config` | Grid card thumbnail · Profile hero |
| Their uploaded face | `users.head_front_url` / `head_back_url` | Grid card · Profile hero · sealed shirt render |
| Their shirt colour | `users.shirt_color` | Shirt panel background everywhere |
| Every scribble friends drew | `scribbles.canvas_svg` (+ x,y,w,h,panel) | Flattened into the sealed shirt (hero + gallery) |
| The 3 they loved most | `users.yearbook_featured_scribble_ids` | Featured scribbles block |
| Voice notes on scribbles | `scribbles.voice_url` | ▶ button on featured scribbles |
| Emoji reactions | `scribble_reactions` | Reaction tallies + auto-ranking of featured |
| Sticky notes left around the shirt | `shirt_social_notes` | Friends' sticky-notes block |
| How full / how social the shirt got | `shirts.*_occupancy` + computed level | Stats strip · level badge |
| Who signed, how many | derived from `scribbles` | Stats strip (total + unique) |
| Their batch / program | `batch_id` / `program_id` | Grid filters · footer · batch chip |
| Their groups | `friend_groups` + `shirts.group_id` | Group canvases block |
| Their farewell words | `yearbook_quote`, `yearbook_legacy_line`, `yearbook_next_step` | Legacy line + hero one-liner |
| Their public URL | `profile_slugs.slug` | `/u/[slug]` (shareable forever) |
| The sealed flattened shirt image | `yearbook_renders.front/back_png_url` | Shirt gallery + downloads |

Nothing the user produced in the scribble phase is orphaned — every column has a home on the profile.
