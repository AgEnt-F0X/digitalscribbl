# 08 — Avatar & shirt SVGs (no drawing required)

> **Last creative task before the friend test.** The architecture is now locked: one `Avatar` component, one canonical white shirt, one canonical drawable polygon (Route 1 — see `docs/07-changelog.md`). Once you drop in **14 SVGs** (12 hero poses + 2 shirt-editor), scribbling works end-to-end and friends can react to the product instead of placeholder bodies. Nothing else in the app is waiting on you.

> You are not being asked to become an illustrator. You are being asked to drop **14 SVG files** into folders that already exist, with **five required layer IDs** each. The app, validator, onboarding flow, signing studio, and rendered avatar are already wired to these slots.

## What the app actually renders

```
┌─────────────────────────────┐
│  Uploaded head (WebP/PNG)   │  ← custom user head; no head bank in v1
│         on neck anchor      │
├─────────────────────────────┤
│  Avatar preset SVG          │  ← your job: body + shirt illustration
│  (skin-fill + shirt layers) │
├─────────────────────────────┤
│  Scribbles (SVG from DB)    │  ← users draw; clipped to shirt-drawable
└─────────────────────────────┘
```

Everything is **flat SVG** at `400×600`, on **ONE canonical white shirt; no color picker**. The shirt-colour picker was removed in Route 1 — every preset, every editor SVG, every dashboard render uses the same white fabric drawn against the same drawable polygon. Route 1 makes scribbles legible everywhere because the surface is consistent.

## Canonical drawable polygon

This is the single source of truth, exported from `lib/utils/shirtTemplate.ts`:

```
M82 206
L136 154
L168 190
C188 204 212 204 232 190
L264 154
L318 206
L340 558
C284 570 116 570 60 558
Z
```

Coordinate space: **400 × 600** (matches `viewBox="0 0 400 600"`).

This polygon is the **drawable region** — the area where users can place scribbles. The drawing editor clips strokes to this polygon, the rendered avatar masks scribbles to the same polygon, and `/api/scribble/place` rejects boxes that fall outside it. Every preset SVG's `id="shirt-drawable"` path **MUST** be this exact path string. If you change it in the SVG, scribbles will overlay incorrectly — bleeding off the shirt or floating above unrelated areas. When in doubt, copy-paste the path attribute from `f-confident-upright-front.svg`.

## Six hero poses (v1 launch)

These are the six launch-critical pose IDs. Onboarding step 3, the dashboard hero, the profile hero, and the signing studio thumbnails all surface these first. The other 14 presets remain as schematic placeholders and can be polished one evening at a time after the friend test.

| ID | Category |
|---|---|
| `m-classic-straight` | masculine |
| `m-soft-casual` | masculine |
| `m-upright-confident` | masculine |
| `f-confident-upright` | feminine |
| `f-soft-side-lean` | feminine |
| `f-relaxed-casual` | feminine |

For each ID, **front + back SVG required** at:

```
src/assets/scribbl/avatar-presets/{category}/{id}/{id}-front.svg
src/assets/scribbl/avatar-presets/{category}/{id}/{id}-back.svg
```

`{category}` is `masculine` or `feminine` per the table.

## The contract (what must be true)

Run after any asset change:

```bash
npm run validate:scribbl-assets
```

Each **avatar preset** file (`{id}-front.svg`, `{id}-back.svg`) must have:

| Requirement | Why |
|---|---|
| `viewBox="0 0 400 600"` | All layouts, clipping, and scribble coords assume this space |
| `id="skin-fill"` | Arms/neck; fill uses CSS `var(--skin-tone, #d9a06f)` |
| `id="shirt-base"` | Visible shirt fabric (collar, placket, folds) — drawn as the canonical white shirt |
| `id="shirt-drawable"` | Path matching the canonical polygon above (no fill needed) |
| `id="shirt-overlay"` | Seams, buttons, pocket lines (strokes only) |

Each **shirt-editor** file (`shirt-editor-front.svg`, `shirt-editor-back.svg`) needs:

`shirt-base`, `shirt-drawable`, `shirt-overlay` (no skin on editor-only assets).

**Copy structure from an existing file** — do not invent IDs:

`src/assets/scribbl/avatar-presets/feminine/f-confident-upright/f-confident-upright-front.svg`

## Minimum set to ship

| Tier | Files | When |
|---|---|---|
| **Launch (Route 1 lock)** | **12 hero SVGs** (6 poses × front+back) **+ 2 shirt-editor SVGs** = **14 files for launch** | Before the friend test |
| **Polish v1** | The other 14 preset slots replaced with the same hand-finished style | One pose per evening, post friend test |
| **Full library** | All 20 poses front + back at the same finish level | Only if you have time |

The other 14 preset slots already have schematic placeholders that pass validation, so they continue to render. They look deliberately understated next to the six heroes — that's fine for launch, because the dashboard, onboarding, and signing studio all surface the heroes first.

## The fastest path: finish 14, not 40

Do **not** open this task as "make the full avatar library." That is how it becomes a procrastination trap.

Open it as:

1. Replace **three masculine front/back pairs**: `m-classic-straight`, `m-soft-casual`, `m-upright-confident`.
2. Replace **three feminine front/back pairs**: `f-confident-upright`, `f-soft-side-lean`, `f-relaxed-casual`.
3. Replace the **two shirt-editor** files: `shirt-editor-front.svg`, `shirt-editor-back.svg`.
4. Run the validator.
5. Stop.

That is **14 files**, not 40. If those 14 match the visual direction, the whole product starts feeling intentional because the dashboard, onboarding, and signing flows will all show the best poses first.

The goal is not "perfect illustration." The goal is: a friend opens the app and thinks, **"oh this has a real look."** That reaction is enough for v1.

## Quick motivation

You already did the hard product work: scope cuts, backend safety, mobile signing flow, dashboard compression, onboarding, rate limits, docs, review passes, and now the Route 1 architecture lock. The avatar SVGs are the last visual gate.

This is also the one task where perfection is actively dangerous. The app does not need 20 museum-quality poses. It needs six confident, consistent bodies that make the shirt feel alive. Once those exist, the friend test becomes real.

Set a timer. Pick one pose. Generate one reference. Trace one SVG. Validate it. Momentum will do more than planning here.

## How to get the ChatGPT mock look without drawing

### Step 1 — Generate the reference image (15 min)

Use the same tool that made your three dashboard/signing mocks. One image per pose.

**Shirt-only prompt (for shirt-editor):**

```
Single short-sleeve collared shirt, front view, hand-drawn pencil illustration on cream paper.
Button placket, one chest pocket, soft fabric folds, off-white fabric.
NO person, NO head, NO text, NO scribbles on the shirt — empty clean shirt surface.
Centered, 2:3 portrait aspect, soft purple vignette at edges optional.
```

Repeat with `back view, no buttons on placket`.

**Full upper-body prompt (for avatar preset):**

```
Upper body only, no head (crop above neck), wearing the same collared half-sleeve shirt.
[PASTE POSE: e.g. relaxed shoulder tilt, casual stance].
Hand-drawn pencil style, cream paper, soft shading, same style as a school yearbook illustration.
NO face, NO text, NO scribbles on shirt. 2:3 aspect.
```

Generate **one pose at a time** so style stays consistent. Save PNGs to a folder `asset-drafts/`. Keep the **shirt fabric the same off-white** in every reference — no coloured shirt variants. Route 1 ships ONE canonical white shirt.

### Step 2 — Turn PNG into SVG (20–40 min per file)

Pick one path:

| Tool | Effort | Quality |
|---|---|---|
| [vectorizer.ai](https://vectorizer.ai) or svgco.de | Upload PNG → download SVG | Fast; may need cleanup |
| Figma | Place PNG → trace with pen on top (you trace lines, not invent anatomy) | Best control; still not "drawing from scratch" |
| Inkscape | Path → Trace Bitmap | Free; more manual cleanup |

You are **tracing your own generated reference**, not illustrating from imagination.

### Step 3 — Fix the SVG in VS Code (10 min per file)

1. Open the downloaded SVG + copy `f-confident-upright-front.svg` side by side.
2. Ensure `viewBox="0 0 400 600"`.
3. Wrap paths into groups with the five required `id`s.
4. Set skin paths to `fill="var(--skin-tone,#d9a06f)"` inside `skin-fill`.
5. **Replace `shirt-drawable`'s `d` attribute with the canonical polygon string from the section above.** This is the single biggest source of "scribbles look wrong" bugs — copy-paste it, do not eyeball it.
6. Run `npm run validate:scribbl-assets`.

### Step 4 — Drop in place

Avatar preset paths (already wired in `avatarPresets.ts`):

```
src/assets/scribbl/avatar-presets/{masculine|feminine}/{preset-id}/{preset-id}-front.svg
src/assets/scribbl/avatar-presets/{masculine|feminine}/{preset-id}/{preset-id}-back.svg
```

Shirt editor:

```
src/assets/scribbl/shirt-editor/shirt-editor-front.svg
src/assets/scribbl/shirt-editor/shirt-editor-back.svg
```

No TypeScript changes needed if IDs and `viewBox` are correct.

## If anxiety spikes: the honest truth

- **Functional blocker:** NO. Validation already passes; users can onboard, pick presets, and sign shirts today.
- **Emotional blocker:** YES. The mocks look 8/10; current presets look schematic 5/10.
- **Product-designer job:** Pick 6 poses, generate references, trace, validate — that is **art direction + QA**, not illustration skill.

Ship with schematic SVGs → run your 2-day friend test → swap hero poses one file per evening. Each swap is independent; you never redo all 14 at once.

## Separate: custom head upload friction

Onboarding still uses ChatGPT/custom head upload. That is separate from body SVGs. Do **not** solve head generation while doing body SVGs, and do **not** reintroduce a head bank. The product identity is a customised head on a consistent shirt-body system.

## Checklist before you call assets "done"

- [ ] `npm run validate:scribbl-assets` passes
- [ ] All 12 hero SVGs (6 poses × front+back) are in place at `src/assets/scribbl/avatar-presets/{category}/{id}/{id}-{front,back}.svg`
- [ ] Both shirt-editor SVGs are in place at `src/assets/scribbl/shirt-editor/shirt-editor-{front,back}.svg`
- [ ] Every `shirt-drawable` path matches the canonical polygon from this doc, byte-for-byte
- [ ] Every shirt fabric is the same off-white — no colour variants snuck in
- [ ] Open `/onboarding/avatar` — pick each hero pose, front + back look correct
- [ ] Open `/dashboard` — your shirt centerpiece matches mock **enough** (not pixel-perfect)
- [ ] Open `/shirts/[id]/scribble` — drawable region feels like the shirt fabric, not a random rectangle
- [ ] Scribble once on front and back — ink stays inside the canonical drawable polygon

When those checks pass, **stop** and test with friends.
