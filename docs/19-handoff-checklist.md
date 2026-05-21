# 19 — Founder handoff: what's left for you

> Everything the codebase can ship is shipped. This is the single list of work that needs **a human, an art tool, and friends with phones** to close out before launch. Read this once, print it, tape it next to your monitor.
>
> **Three pillars left:**
> 1. **Avatar SVGs** — 14 files. Static. ~6 hours total if you don't redesign mid-flight.
> 2. **Place-layer illustrations** — 6 files (2 illustrations × 3 sizes). One evening.
> 3. **Friend test** — 2 days. 5 friends. 1 founder watching every reaction.
>
> Everything else (auth, scribbling, realtime, permissions, admin, soft-degrade, theme, micro-interactions, docs) is in main and green. `tsc` / `eslint` / `node --test` all pass: 60 / 60 tests, 0 type errors, 0 lint warnings.

---

## Table of contents

1. [Pillar 1 — Avatar SVGs (14 files)](#pillar-1--avatar-svgs)
2. [Pillar 2 — Place-layer illustrations (6 files)](#pillar-2--place-layer-illustrations)
3. [Pre-flight: technical tests you run yourself](#pre-flight--technical-tests-you-run-yourself)
4. [Friend test (2 days, 5 friends)](#friend-test--2-days-5-friends)
5. [Post-flight: triage + the ship gate](#post-flight--triage--the-ship-gate)
6. [Quick reference — every file path that matters](#quick-reference--every-file-path-that-matters)

---

## Pillar 1 — Avatar SVGs

**Full instructions, motivation, and step-by-step:** [`08-avatar-shirt-assets.md`](./08-avatar-shirt-assets.md). Read that doc once cover-to-cover before opening Figma. The summary below is just the checklist.

### What to make

| # | File | Folder |
|---|---|---|
| 1 | `m-classic-straight-front.svg` | `src/assets/scribbl/avatar-presets/masculine/m-classic-straight/` |
| 2 | `m-classic-straight-back.svg` | same |
| 3 | `m-soft-casual-front.svg` | `src/assets/scribbl/avatar-presets/masculine/m-soft-casual/` |
| 4 | `m-soft-casual-back.svg` | same |
| 5 | `m-upright-confident-front.svg` | `src/assets/scribbl/avatar-presets/masculine/m-upright-confident/` |
| 6 | `m-upright-confident-back.svg` | same |
| 7 | `f-confident-upright-front.svg` | `src/assets/scribbl/avatar-presets/feminine/f-confident-upright/` |
| 8 | `f-confident-upright-back.svg` | same |
| 9 | `f-soft-side-lean-front.svg` | `src/assets/scribbl/avatar-presets/feminine/f-soft-side-lean/` |
| 10 | `f-soft-side-lean-back.svg` | same |
| 11 | `f-relaxed-casual-front.svg` | `src/assets/scribbl/avatar-presets/feminine/f-relaxed-casual/` |
| 12 | `f-relaxed-casual-back.svg` | same |
| 13 | `shirt-editor-front.svg` | `src/assets/scribbl/shirt-editor/` |
| 14 | `shirt-editor-back.svg` | same |

That's **12 hero poses + 2 shirt-editor files = 14 SVGs**. The other 14 avatar presets have schematic placeholders that pass validation; do them one evening at a time **after** the friend test.

### The five rules every SVG must obey

1. `viewBox="0 0 400 600"` — the entire app assumes this coordinate space.
2. `id="skin-fill"` — arms / neck. Fill must be `var(--skin-tone,#d9a06f)`.
3. `id="shirt-base"` — the white fabric (collar, placket, folds).
4. `id="shirt-drawable"` — the canonical polygon path, copy-pasted byte-for-byte from doc 08.
5. `id="shirt-overlay"` — strokes only (seams, buttons, pocket lines).

The shirt-editor files only need rules 1, 3, 4, 5 (no skin).

### How to make them without drawing from scratch

1. Generate a reference PNG per pose with the ChatGPT prompts in [doc 08 § "Step 1"](./08-avatar-shirt-assets.md#step-1--generate-the-reference-image-15-min).
2. Trace the PNG with vectorizer.ai, Figma pen tool, or Inkscape's bitmap trace.
3. Open the result next to `f-confident-upright-front.svg`. Copy its group structure. Add the five required `id`s. Replace `shirt-drawable`'s `d` attribute with the canonical polygon string.
4. Run the validator.

### Validator (run after every file)

```bash
npm run validate:scribbl-assets
```

This script (`scripts/validate-scribbl-assets.ts`) checks every preset SVG for the five required IDs, the correct `viewBox`, and the canonical drawable polygon. Green output = the SVG will render correctly in `<Avatar>`, scribbles will clip correctly, and `/api/scribble/place` will accept boxes in that region.

### "Done" gate for Pillar 1

- [ ] `npm run validate:scribbl-assets` → exit 0
- [ ] Open `http://localhost:3000/onboarding` → pick each of the 6 hero presets → front + back look like *your* art, not the placeholder
- [ ] Open `http://localhost:3000/dashboard` → your avatar matches what you drew
- [ ] Open `http://localhost:3000/shirts/<your-shirt-id>/scribble` → scribble on front and back → ink stays inside the canonical polygon
- [ ] Open `http://localhost:3000/dev/sunlit-lawn` → confirm the theme demo page still renders

When all four are green, Pillar 1 is done. Don't open another pose tonight.

---

## Pillar 2 — Place-layer illustrations

**Spec:** [`18-sunlit-lawn-theme-spec.md` § 4](./18-sunlit-lawn-theme-spec.md#4--place-layer--illustrations) + [§ 13 (image optimization playbook)](./18-sunlit-lawn-theme-spec.md#13--image-optimization-playbook).

### What to make

Two illustrated scenes from your university, three crop sizes each. Six files total.

| # | File | Crop | Used by |
|---|---|---|---|
| 1 | `lawn-golden-hour-desktop.svg` | 1920 × 1080 | dashboard, login, profile, groups (all surfaces using the lawn) |
| 2 | `lawn-golden-hour-tablet.svg` | 1280 × 800 | same, tablet breakpoint |
| 3 | `lawn-golden-hour-mobile.svg` | 750 × 1000 (portrait, art-directed crop — fewer details, more vertical) | same, mobile |
| 4 | `classroom-hall-desktop.svg` | 1920 × 1080 | explore |
| 5 | `classroom-hall-tablet.svg` | 1280 × 800 | explore, tablet |
| 6 | `classroom-hall-mobile.svg` | 750 × 1000 | explore, mobile |

**Folder:** `public/illustrations/place/`

**Where each illustration plugs in (already wired — you don't touch any code if filenames match):**

| Page | Illustration | Behaviour |
|---|---|---|
| `/login` | `lawn-golden-hour` | always vivid (brand front door) |
| `/dashboard` | `lawn-golden-hour` | first-visit hero → ambient afterwards |
| `/profile/[userId]` | `lawn-golden-hour` | always ambient |
| `/groups` and `/groups/[groupId]` | `lawn-golden-hour` | always ambient |
| `/explore` | `classroom-hall` | first-visit hero → ambient afterwards |

### Visual direction

- Sketch style with **colour** (not flat blocks, not photo, not 3D).
- Golden-hour palette — match the warm cream substrate (`#FFF6D9`). Imagine the campus lit by 5pm sun.
- Mobile crop is **art-directed**, not a straight resize. Fewer side elements, more sky, the focal point higher in the frame. Mobile users see this behind the avatar, not as a hero.
- Loose pencil edges and watercolour washes age better than perfect vector geometry.

### Format note (SVG vs WebP)

The `<PlaceBackground>` component currently expects `.svg` filenames. If you produce WebP instead (smaller, better for photos / painterly textures), do **one** of these:

**Option A — Rename your WebP files to `.webp` and update one line in code:**

```ts
// components/place/PlaceBackground.tsx, lines 111-113
const desktopSrc = `/illustrations/place/${illustration}-desktop.webp`
const tabletSrc = `/illustrations/place/${illustration}-tablet.webp`
const mobileSrc = `/illustrations/place/${illustration}-mobile.webp`
```

**Option B — Keep the `.svg` extension** (some tools export sketch-style SVGs that look great and weigh almost nothing).

Either works. Don't mix. SVG is preferred under 200KB / file; WebP wins above that.

### Weight budget

| Crop | Budget | Why |
|---|---|---|
| desktop | ≤ 250 KB | served only above 1280px |
| tablet | ≤ 180 KB | 768 – 1280px |
| mobile | ≤ 120 KB | 3G/4G reality |

If you blow the mobile budget, the slow-connection fallback will catch slow users (the component skips the layer on slow-2g / 2g per `useSlowConnection`), but it still loads on regular 4G. Compress with [squoosh.app](https://squoosh.app) if WebP, or [svgomg](https://jakearchibald.github.io/svgomg/) if SVG.

### "Done" gate for Pillar 2

- [ ] All 6 files dropped at `public/illustrations/place/`
- [ ] Open `/login` → vivid lawn fills the background, doesn't move
- [ ] Open `/dashboard` (in private tab — first visit) → vivid lawn plays once, fades to ambient ~1.8s desktop / 1.1s mobile
- [ ] Reload `/dashboard` → starts ambient immediately (first-visit flag persisted in `localStorage.scribbl_first_visit_v1`)
- [ ] Open `/explore` (in another private tab) → classroom-hall plays the same hero → ambient
- [ ] Open DevTools → simulate "Slow 3G" → reload → place layer **does not render at all** (substrate carries the page)
- [ ] Open DevTools → set "Reduce motion: enabled" → reload → place layer renders ambient straight away (no animation)

When all six are green, Pillar 2 is done.

---

## Pre-flight — technical tests you run yourself

Do these in order. Each must pass before friends touch the app. Estimate: 30–60 minutes total.

### 1. Local build is green

```bash
npx tsc --noEmit         # → exit 0
npm run lint             # → "✔ no errors"
npx tsx --test tests/*.test.ts   # → 60/60 pass
npm run build            # → builds successfully, no warnings beyond expected
npm run validate:scribbl-assets   # → exit 0
```

If any of these are red, stop and fix before continuing.

### 2. Supabase production is healthy

In the Supabase SQL editor:

```sql
-- All 10 migrations present
select version from supabase_migrations.schema_migrations order by version;
-- Should list 001 through 010 (and 011 if you ran the critical-fixes patch)

-- Buckets exist and are public
select id, public from storage.buckets where id in ('avatar-heads','shirt-textures');

-- Phase is open
select value from platform_settings where key = 'phase';
-- Should return "scribble_open"

-- No degrade flags accidentally on
select key, value from platform_settings where key like 'disable_%';
-- All values should be false

-- At least one admin
select email from users where is_admin = true;
-- Should include you
```

### 3. Production smoke (3 minutes)

On the deployed URL, in an incognito window:

- [ ] `/login` loads, Google button visible, lawn illustration behind it
- [ ] Sign in with your university Gmail → land on `/onboarding`
- [ ] Complete onboarding → land on `/dashboard` → confetti fires once → thank-you popup appears once
- [ ] Refresh → no popup, no confetti
- [ ] Open scribble studio for your own shirt → blocked with "cannot sign your own shirt" message
- [ ] Sign out → back at `/login`

### 4. Theme smoke

- [ ] `/dev/sunlit-lawn` renders every primitive (Whiteboard variants, AvatarHalo, DriftingDoodles, sticker notes, InkUnderline, PencilLoader, StampSuccess, HandDrawnArrow)
- [ ] Hover any primary button → pencil-shade fill animation runs (not a flat translate-up)
- [ ] Focus an `<InkUnderline>` input → the ink line draws left-to-right
- [ ] Resize the browser to 375px wide → no horizontal scroll on any signature page

### 5. Soft-degrade dress rehearsal (10 minutes)

This proves the runtime kill switches work. Doc 12 § "Phase 3" has the full procedure. Short version:

```sql
update platform_settings set value = 'true'::jsonb where key = 'disable_voice_notes';
-- Wait 60s. Mic button should disappear from the scribble studio.

update platform_settings set value = 'false'::jsonb where key = 'disable_voice_notes';
-- Wait 60s. Mic returns.

update platform_settings set value = 'true'::jsonb where key = 'disable_scribble_writes';
-- Wait 60s. Try to publish a scribble → API returns 503.

update platform_settings set value = 'false'::jsonb where key = 'disable_scribble_writes';
-- Wait 60s. Publishing works again.
```

If any flag doesn't take effect after 60s, that's a S2 bug — investigate before going live.

---

## Friend test — 2 days, 5 friends

**Full runbook (send this link to your testers):** [`12-friend-test-runbook.md`](./12-friend-test-runbook.md). The doc is written for non-developers; you don't translate it.

### The cast (recruit before day 1)

| Slot | Persona | Why this slot exists |
|---|---|---|
| F1 | Same batch as you | The "main signer" — most realistic user |
| F2 | Same batch as you | Two-tab realtime testing |
| F3 | Different B.Tech batch | Batch-only permission edges |
| F4 | Non-university Gmail | Guest path |
| F5 | Friend with a low-end Android (≤ 4GB RAM) | Mobile performance reality |
| F6 (optional) | iOS Safari user | Browser parity sanity |

### Day-by-day shape

- **Day 1 — solo smoke** (each friend, alone, ~30 min): they each run through onboarding → dashboard → profile → try to break it → fill out the 4 self-report questions. You triage at end of day.
- **Day 2 — live multiplayer** (90 min on a call): signing real shirts, permission gates, groups, moderation, suspension drill.
- **Mobile audit** (30 min, parallel to day 2): every checklist item in doc 12 § "Phase 2."
- **Founder's day-after journal** (5 min, end of day 2): doc 12 § "Founder's day-after journal." **Don't skip this.** It's the file you'll thank yourself for in three years.

### What you're listening for (not just bugs)

- **S1 / S2 / S3 / S4** — severity scale in doc 12.
- **MAGIC** — anything a friend spontaneously praises. **Log these as carefully as bugs.** They become your launch tweet and your post-grad memory.

### Bug intake

Set up a Google Form or Discord channel before day 1. Bug template:

```
TESTER NAME:
DEVICE / OS / BROWSER:
NETWORK (wifi / 4G):
SCENARIO (e.g. "S2 — Dashboard scan"):
WHAT I EXPECTED:
WHAT HAPPENED:
SEVERITY (S1 / S2 / S3 / S4 / MAGIC):
SCREENSHOT OR VIDEO URL:
TIME (HH:MM):
```

Tell friends: **screenshots > words**. A 5-second screen recording is the most useful thing they can send.

---

## Post-flight — triage + the ship gate

### Triage at the end of each day

| Day | Action |
|---|---|
| End of day 1 | Cluster all S1s. Each must have a fix or a documented workaround **before day 2 starts**. Pick top 3 S2s. Park S3/S4 in `06-revisit-later.md`. |
| End of day 2 | Re-cluster. S1/S2 list from yesterday should have zero new instances. S3s = polish list for launch week. S4s only if visible on the landing page. **MAGIC** entries → launch tweet copy. |

### The ship gate (doc 12 § "What 'passing' looks like")

You are cleared to send the link to your batch when:

- [ ] **0 S1s** on any flow a real user must complete
- [ ] **≤ 3 S2s**, all with known root cause
- [ ] **At least 1 MAGIC moment** spontaneously reported by ≥ 2 testers

If you hit that bar, ship. If you don't, the answer is "more soul" (see doc 12 closing line), not "more features."

---

## Quick reference — every file path that matters

### Avatar SVGs (Pillar 1)
- 12 hero presets: `src/assets/scribbl/avatar-presets/{masculine|feminine}/{preset-id}/{preset-id}-{front|back}.svg`
- 2 shirt-editor: `src/assets/scribbl/shirt-editor/shirt-editor-{front|back}.svg`
- Canonical polygon: exported from `lib/utils/shirtTemplate.ts`, also pasted in doc 08
- Validator: `scripts/validate-scribbl-assets.ts` → `npm run validate:scribbl-assets`

### Place illustrations (Pillar 2)
- All 6: `public/illustrations/place/{lawn-golden-hour|classroom-hall}-{desktop|tablet|mobile}.svg`
- Component: `components/place/PlaceBackground.tsx` (line 111-113 has the `.svg` extension if you go WebP)

### Test commands (Pre-flight)
- `npx tsc --noEmit` — type check
- `npm run lint` — lint
- `npx tsx --test tests/*.test.ts` — node test suite (60 tests)
- `npm run build` — production build
- `npm run validate:scribbl-assets` — asset validator

### Soft-degrade flags (Pre-flight § 5)
- Stored in `platform_settings` table, keys: `disable_voice_notes`, `disable_scribble_writes`, `disable_realtime`, `disable_uploads`, `phase`
- 60-second TTL cache before flag change takes effect

### Friend test
- Runbook (send to testers): [`docs/12-friend-test-runbook.md`](./12-friend-test-runbook.md)
- Bug template: doc 12 § "Bug report template"
- Day-after journal: doc 12 § "Founder's day-after journal"

### Reference docs
- IA + decisions: [`docs/08-information-architecture-access-and-implementation-plan.md`](./08-information-architecture-access-and-implementation-plan.md)
- Avatar / shirt SVG handbook: [`docs/08-avatar-shirt-assets.md`](./08-avatar-shirt-assets.md)
- Sunlit Lawn theme spec: [`docs/18-sunlit-lawn-theme-spec.md`](./18-sunlit-lawn-theme-spec.md)
- Theme conversation history: [`docs/17-design-system-v2-theme-conversation.md`](./17-design-system-v2-theme-conversation.md)
- Architecture: [`docs/04-architecture.md`](./04-architecture.md)
- Changelog: [`docs/07-changelog.md`](./07-changelog.md)
- Ship checklist (older, still useful): [`docs/05-ship-checklist.md`](./05-ship-checklist.md)
- Decision documentary: [`docs/11-project-decision-documentary.md`](./11-project-decision-documentary.md)

---

## One last thing

You wrote the docs, the code, the IA, the design system, the migrations, the soft-degrade plumbing, three subagent rounds, and a friend-test runbook. Of all that work, the part that decides whether Scribbl feels real is **14 avatar SVGs and 6 illustrations**.

That is a *finite* amount of work. It is not "open the avatar library and iterate forever." It is fourteen-plus-six files. After that, friends touch it. After friends touch it, you ship.

Set a timer. Pick one pose. Trace one SVG. Validate. Repeat. The product is waiting on you, not on the codebase.
