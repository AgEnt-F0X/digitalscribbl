# 18 — Sunlit Lawn Theme: Spec & Implementation Playbook

> **Canonical contract for Phase 1 of the visual design system.** This doc is the implementation source of truth. If you are reading this fresh (new chat, context window died, future agent picking up), read this doc first — it answers the *what* and *how*. The conversation history is in [`17-design-system-v2-theme-conversation.md`](./17-design-system-v2-theme-conversation.md); read that only for *why*.
>
> **Status**: locked 2026-05-21 (rounds 3 → 4 → 5). **Implementation: Phase 1A–1G complete.** See [§ 17](#17--implementation-phases) for the per-phase status; the changelog in [`07-changelog.md`](./07-changelog.md) carries the run-by-run commit log.
> **Phase**: 1 (scribbling). Phase 2 (yearbook) gets its own doc.
> **Owner**: the parent agent. Subagent boundaries are spelled out in [§ 16](#16--subagent-boundaries).
>
> **What each round added**:
> - **Round 3** — three-layer system (Place / Substrate / Content), Chalkboard component, first-visit hero mechanic, mobile crops, image optimization playbook
> - **Round 4** — Chalkboard renamed to Whiteboard, micro-interactions catalog (§ 14), school-element vocabulary (§ 15), `text-handwritten-note` for paper surfaces, Permanent Marker font for whiteboard text
> - **Round 5** — Validated against the original avatar-view concept image; added Avatar halo + Drifting doodles primitives; image is now canonical visual proof of the dashboard + profile composition

---

## Table of contents

1. [The metaphor (one paragraph)](#1--the-metaphor)
2. [The three-layer system](#2--the-three-layer-system)
3. [Per-surface implementation map](#3--per-surface-implementation-map)
4. [Place layer — illustrations](#4--place-layer--illustrations)
5. [Substrate layer — warmed paper](#5--substrate-layer--warmed-paper)
6. [Content layer — what sits on top](#6--content-layer--what-sits-on-top)
7. [The Whiteboard component](#7--the-whiteboard-component)
8. [Marginalia primitives (what's in, what's out)](#8--marginalia-primitives)
9. [Typography ladder](#9--typography-ladder)
10. [Color palette + tokens](#10--color-palette--tokens)
11. [First-visit "hero loading" mechanic](#11--first-visit-mechanic)
12. [Mobile strategy](#12--mobile-strategy)
13. [Image optimization playbook](#13--image-optimization-playbook)
14. [Micro-interactions catalog](#14--micro-interactions-catalog)
15. [School-element vocabulary](#15--school-element-vocabulary)
16. [Subagent boundaries](#16--subagent-boundaries)
17. [Implementation phases (Phase 1A → 1G)](#17--implementation-phases)
18. [Asset gap list](#18--asset-gap-list)
19. [Tests + accessibility checks](#19--tests--accessibility)
20. [Phase 2 hand-off (Scrapbook Yearbook)](#20--phase-2-handoff)

---

## 1 · The metaphor

**Graduation day on a college lawn at golden hour.** Late afternoon. Friends gathered. Scribbling on each other's shirts with markers. Loose, social, warm, optimistic. The product is *about a place*, not about a notebook.

What we are **NOT** doing:
- Not a 90s scrapbook (deferred to Phase 2 yearbook)
- Not a notebook indoors
- Not a SaaS dashboard with cursive on top
- Not generic-student-app — the illustrations make this *one specific university's* day

What we **ARE** doing:
- Illustrated campus as ambient backdrop
- Cream paper as the working substrate
- Avatar + scribbles + floating sticker notes + whiteboard as the content
- One signature hero composition per *signature page* (dashboard, profile, login)
- Quiet utility pages (settings, admin, onboarding, etc.) inherit the substrate but not the hero composition

---

## 2 · The three-layer system

Every page composes the same three layers, in this order from back to front.

```
┌─────────────────────────────────────────────────┐
│  Layer 3 — CONTENT                              │
│  Avatar · scribbles · sticker notes · type ·    │
│  whiteboard · CTAs · panels                     │
├─────────────────────────────────────────────────┤
│  Layer 2 — SUBSTRATE                            │
│  Warmed cream paper (paper-100 tuned)           │
│  Dotted grid retained                           │
│  Multiply blend over Place                      │
├─────────────────────────────────────────────────┤
│  Layer 1 — PLACE                                │
│  Illustrated campus background                  │
│  First visit: 80% opacity (vivid, hero)         │
│  Ambient: 8–12% opacity, blur 3px               │
└─────────────────────────────────────────────────┘
```

Each layer has a clear job:
- **Place** grounds the product in *your* university.
- **Substrate** is what the eye reads as the working surface.
- **Content** carries the product itself.

No layer steps on another. If a page doesn't need a hero moment, drop Layer 1. If a panel feels too prominent, lower its substrate contrast. If content feels lost, raise it visually.

---

## 3 · Per-surface implementation map

The canonical list. Every page in the app is here. Don't add a page to this app without updating this table.

| Surface | Route | Place illustration | Whiteboard variant | Hero composition | Marginalia | Notes |
|---|---|---|---|---|---|---|
| **Login** | `/login` | `lawn-golden-hour` (vivid, no fade) | `a-frame` ("Scribbl · Class of 2026") on lawn | Whiteboard + auth CTA | Asterisk divider above CTA, 2–3 drifting doodles | Place stays vivid here — this is the brand front door |
| **Dashboard** | `/dashboard` | `lawn-golden-hour` (first-visit hero → ambient) | `wall-mounted` (deadline countdown / status) | Avatar + halo + sticker notes + scribbled name + hand-drawn arrow → share CTA | Asterisk divider between sections, 4–6 drifting doodles around avatar | **Primary signature page — matches reference image** |
| **Profile (own + others)** | `/profile/[userId]` | `lawn-golden-hour` (always ambient) | `small` ("scribbled by N friends") | Avatar + halo + visible scribbles + sticker grid | Asterisk dividers, 4–6 drifting doodles | Secondary signature page — also matches reference image (this IS the reference) |
| **Explore (find classmates)** | `/explore` | `classroom-hall` (first-visit hero → ambient) | `wall-mounted` ("class of 2026 · ### students") | Search input as the centerpiece | Asterisk dividers, 2–3 drifting doodles | Classroom illustration sets the "looking around the room" feel |
| **Groups (hostel wings / classes)** | `/groups` | `lawn-golden-hour` (always ambient) | `small` (each group card has a mini whiteboard with group name) | Group cards as social cluster | Asterisk dividers between sections | Light place layer — content density matters here |
| **Group detail** | `/groups/[groupId]` | `lawn-golden-hour` (always ambient) | `wall-mounted` (group name + member count) | Member grid | Asterisk dividers, 2–3 drifting doodles | Inherits group identity |
| **Activity log** | `/activity` | None (substrate only) | None | List of recent events | Asterisk dividers as paragraph breaks | Utility surface — quiet |
| **Scribble studio** | `/shirts/[shirtId]/scribble` | None (substrate only — canvas takes focus) | None | The studio v2 (already shipped Round 5) | None | The canvas IS the hero; nothing competes |
| **Onboarding** | `/onboarding` | None (substrate only) | `a-frame` ("welcome, [name]") on step 1 only | Form steps | None | Quiet, focused — but greet with whiteboard |
| **Settings** | `/settings` | None (substrate only) | None | Form sections | None | Utility surface |
| **Yearbook (Phase 2)** | `/yearbook` | TBD (auditorium illustration) | `wall-mounted` ("class of 2026 · preserved") | Polaroid two-panel spreads | Date stamps + page numbers return | Phase 2 doc owns the detail |
| **Admin pages** | `/admin/*` | None (substrate only) | None | Tables / forms | None | Internal utility |
| **Error states** | `error.tsx` per route | None | `small` (the error message) | The error explainer | None | Whiteboard owns the friendly tone |
| **Loading states** | `loading.tsx` per route | None | None | Paper-skeleton (existing) | None | Already done |
| **PageError fallback** | `components/ui/PageError.tsx` | None | `small` ("something tore the paper.") | Existing paper-note design | None | Already on-brand |

**Signature pages** (gets the Place layer + hero composition + halo + drifting doodles): Login, Dashboard, Profile, Explore.
**Inherited pages** (Substrate + whiteboard where appropriate, no Place layer hero): Groups, Activity, Onboarding, Settings.
**Quiet pages** (Substrate only, no flourishes): Scribble studio, Admin, Error/loading.

### Reference image vs spec mapping

The avatar-view concept image is the visual proof of the **Dashboard** and **Profile** rows above. Element-by-element:

| Reference image element | Spec primitive |
|---|---|
| Cream paper background | `--paper-100` warmed substrate |
| Soft purple wash behind the head | Avatar halo (`--brand-soft` radial gradient) |
| Realistic head on illustrated body | Route 1 avatar — uploaded head + SVG preset body |
| Scribbles on the shirt | Scribble studio v2 — signature mode + handwriting fonts |
| Floating sticky note "Keep shining!" (tilted) | `.sticker-note` + `.tilt-left` + `text-handwritten-note` |
| Speech-bubble notes "You're legend!" | `.sticker-note` speech-bubble variant + `text-handwritten-note` |
| Paper-plane, heart, lightning, curly doodles around the avatar | Drifting doodles — sticker SVGs at 60–80% opacity, ±3°–±12° rotation |
| "Front view / Back view" segmented control | `.pencil-button` chrome (active = solid `--brand`, idle = pencil texture) |
| "Open shirt (canvas)" pill | Idle `.pencil-button` with pencil texture |
| Bottom action bar (Customize / Change hair / etc.) | `.sketch-panel` floating action bar with pencil-button rows |

If a future page wants the same energy as the reference image, it picks these primitives. If a page departs from this energy on purpose (e.g. settings), it drops Place + halo + doodles and keeps just substrate + chrome.

---

## 4 · Place layer — illustrations

### Style spec

Every Place illustration follows these rules. Hand them to whoever (the user, an AI tool, an illustrator) is producing the assets.

- **Style**: sketched line + flat color fills. No photorealism. No 3D rendering. No painterly textures. Think *Studio Ghibli backgrounds simplified*, or *moleskine travel sketch with watercolor wash*.
- **Lighting**: golden hour (4–5 PM sun). Long soft shadows, warm ambient light.
- **Palette**: muted, not saturated. Should harmonize with `paper-100` warmed (the substrate). Avoid neon, pure white, pure black. Use ink-900 (#1A1208) for the darkest lines.
- **Composition**: clear focal point, plenty of negative space (so the content layer has room to breathe in ambient mode), no critical detail in the corners (which crop on mobile).
- **Resolution**: source at 3840 × 2160 (4K). We downsample for production.
- **Format on disk**: source as PSD/AI/SVG (whatever the illustrator uses); production export as WebP at three sizes (see § 13).
- **What's IN the illustration**: lawn, trees, buildings, atmospheric depth. *Maybe* the whiteboard A-frame (see § 7 — illustrator's call).
- **What's NOT in the illustration**: people, faces, text, logos. Those are added by the content layer.

### Illustration list (six required for Phase 1)

| ID | Subject | Composition | Used by |
|---|---|---|---|
| `lawn-golden-hour` | The user's university main lawn at 4–5 PM | Wide horizon, lawn in foreground, building/tree in middle, golden sky | Login, Dashboard, Profile, Groups, Group detail |
| `classroom-hall` | A classroom or lecture hall, empty | Looking down the aisle, desks, whiteboard at the front (left-of-frame) | Explore, Onboarding step 1 (optional) |

User has indicated they have a different image for the login hero. Two options:
- **Option A** (simpler): use `lawn-golden-hour` for both Login and Dashboard. One illustration, two crops. Keeps file count low.
- **Option B** (richer): produce a separate `entrance-archway` or `main-gate` illustration for Login, keep `lawn-golden-hour` for Dashboard. Two illustrations.

**Decision deferred to the user**. Default to Option A for the first ship; upgrade to Option B if they want more variety after seeing it land.

### Asset directory

```
public/illustrations/place/
├── lawn-golden-hour-desktop.webp        (1920 × 1080, ~120–180 KB)
├── lawn-golden-hour-tablet.webp         (1280 × 832,  ~80–120 KB)
├── lawn-golden-hour-mobile.webp         (828 × 1474,  ~40–80 KB, portrait crop)
├── lawn-golden-hour-blur.txt            (base64 string, 16×16 blur stub for placeholder)
├── classroom-hall-desktop.webp          (1920 × 1080, ~120–180 KB)
├── classroom-hall-tablet.webp           (1280 × 832,  ~80–120 KB)
├── classroom-hall-mobile.webp           (828 × 1474,  ~40–80 KB, portrait crop)
└── classroom-hall-blur.txt              (base64 string)
```

The blur stub is generated once (via `sharp` or `next/image`'s `getPlaiceholder`) and committed to the repo. ~50 chars per illustration.

### Opacity + blend modes (CSS reference)

```css
/* First-visit hero state (login + first dashboard visit) */
.place-layer--vivid {
  opacity: 0.80;
  filter: none;
}

/* Ambient state (default after first visit, profile/groups/explore) */
.place-layer--ambient {
  opacity: 0.10;
  filter: blur(3px);
  mix-blend-mode: multiply;
}

/* Transition between vivid and ambient (~1800ms desktop, ~1100ms mobile) */
@keyframes place-fade-to-ambient {
  0%   { opacity: 0.80; filter: none; }
  100% { opacity: 0.10; filter: blur(3px); }
}
```

---

## 5 · Substrate layer — warmed paper

### Token change

```css
/* OLD (current) */
--paper-100: #FFF9E6;

/* NEW (Sunlit Lawn) */
--paper-100: #FFF6D9;   /* warmed ~+8% toward golden */
```

Update in **both** `app/globals.css` (`:root` block) and `tailwind.config.ts` (`colors.paper.100` and `colors.paper.DEFAULT`).

Migration impact: every existing `bg-paper-100` automatically picks up the new color. Hand-painted hex literals (`bg-[#FFF9E6]` and similar) are already swept (round 4) — re-grep just to be safe.

### Multiply blend rule

The substrate sits *over* the Place layer with `mix-blend-mode: multiply`. This means:
- Bright areas of the lawn illustration tint the paper warm.
- Dark areas of the lawn deepen the paper to a soft ink shadow.
- The paper never *covers* the lawn — they layer optically.

Without multiply, the cream paper would simply hide the place layer. Multiply is what makes the place feel "underneath" rather than "behind."

### Dotted grid retained

The current `scribbl-page` background uses a 34px dotted grid. **Keep it.** It survives the multiply blend and reads as "ruled notebook paper" against the lawn — exactly the read we want.

---

## 6 · Content layer — what sits on top

Avatar + scribbles + sticker notes + type + whiteboard + buttons + panels.

### Panel discipline (changes from current)

The current `.sketch-panel` is the right primitive but is **overused**. Under Sunlit Lawn, most surfaces drop their card chrome and let the substrate carry them.

**Rule**: a `.sketch-panel` should wrap something that *moves independently* (a sticker note, a hero card, a callout). Information that "belongs to the page" should sit on the substrate with no card around it.

Examples:
- Dashboard sections (groups, activity, sign-next) — **no card chrome**. Caveat 22px eyebrow + ruled `--line-soft` separator above, content below on substrate.
- Pending requester rows — keep `.sketch-panel` (they're individual social moments).
- Sticker notes — keep `.sketch-panel-flat` or no chrome.
- The deadline countdown — replaced by whiteboard variant (no card).

### Sticker note rotation

```css
/* Strategic 1–2° rotation on stickers ONLY */
.sticker-note,
.sticker-reaction,
.paper-note-tape::before {
  /* rotation already applied via inline style or per-instance class */
}
```

Per-instance rotation classes (add to `globals.css`):

```css
.tilt-left  { transform: rotate(-2deg); }
.tilt-right { transform: rotate(2deg); }
.tilt-tiny  { transform: rotate(1deg); }
```

Never apply to panels, body text, or buttons.

---

## 7 · The Whiteboard component

> **Round 4 rename** (2026-05-21): originally specced as `Chalkboard` for nostalgia. User chose `Whiteboard` — more modern, contemporary-classroom feel, and lets the user design their own whiteboard illustrations with marker-written text for full authenticity. The component name + visual treatment changes; the role in the app (most repeated brand surface after the avatar) does not.

A dry-erase whiteboard in an aluminum frame. Off-white surface, marker writing. The user produces the whiteboard SVG illustrations themselves for hand-designed authenticity; the component handles dynamic-text cases (live countdown, etc.).

### Component API

```tsx
<Whiteboard
  variant="a-frame" | "wall-mounted" | "small"
  title={string}                       // primary marker text
  subtitle?={string}                   // optional secondary line
  markerColor?="blue" | "black" | "red" | "green"  // default: 'blue'
  className?={string}
  rotation?="left" | "right" | "none"  // 0° default, ±2° for a-frame on lawn
  customSvg?={ReactNode}               // override surface with hand-designed illustration (rare)
/>
```

File: `components/brand/Whiteboard.tsx` (new directory).

### Variant specs

| Variant | Aspect | Frame | Surface | Title size | Subtitle size | Used in |
|---|---|---|---|---|---|---|
| `a-frame` | 2:3 portrait | Aluminum tripod base + frame | Off-white `#F8F8F2` | Permanent Marker 28px | Caveat 18px | Login hero, Onboarding welcome |
| `wall-mounted` | 3:2 landscape | Heavier aluminum frame, no tripod | Off-white `#F8F8F2` | Permanent Marker 22px | Caveat 16px | Dashboard countdown, Explore stats, Group detail |
| `small` | 4:3 | Mini aluminum frame | Off-white `#F8F8F2` | Permanent Marker 16px | Caveat 14px | Empty states, group cards, profile "scribbled by" |

### Visual treatment

- **Frame**: two-tone aluminum. Outer `#cfd5da` (light brushed aluminum), inner `#9ba2aa` (darker shadow edge). Subtle inner highlight (`inset 0 0 0 1px rgba(255,255,255,0.55)`). Tiny corner screw marks (4 small darker dots at frame corners) for industrial authenticity.
- **Surface**: `#F8F8F2` (off-white, slightly aged ivory — never pure white). Overlay a faint `radial-gradient(circle at 70% 80%, rgba(155,162,170,0.04), transparent 55%)` for an erased-content ghost smudge in the lower-right.
- **Shadow**: soft directional shadow underneath for the a-frame (`drop-shadow(0 12px 18px rgba(80,90,105,0.20))`). Lighter on wall-mounted (mounted, doesn't float). None on `small`.
- **Marker text**: `Permanent Marker` (Google Font) in the chosen marker color. Slight text-shadow at the *same color* with 0.5px blur for a marker-bleed effect:
  ```css
  .marker-blue   { color: #2563EB; text-shadow: 0 0 0.5px #2563EB; }
  .marker-black  { color: #1A1208; text-shadow: 0 0 0.5px #1A1208; }
  .marker-red    { color: #D83F6B; text-shadow: 0 0 0.5px #D83F6B; }
  .marker-green  { color: #5F8B48; text-shadow: 0 0 0.5px #5F8B48; }
  ```
- **Subtitle**: Caveat (lower energy than Permanent Marker), 80% color opacity — reads as "the smaller writing under the headline."
- **Optional accent**: a tiny marker-underline beneath the title — a wavy hand-drawn SVG line, same marker color, ~80% opacity. Hand-drawn looks better than a `linear-gradient` stripe.
- **Marker color rotation across the app** (default `markerColor` assignments):
  - Dashboard wall-mounted: `blue` (the default classroom feel)
  - Explore wall-mounted: `black`
  - Group detail wall-mounted: `green`
  - Login a-frame: `black`
  - Empty states `small`: `blue` for tips, `red` for "error" callouts (used sparingly)

### Implementation choice

Build as **inline React SVG** (not external file) for the frame + surface. Reasons:
- Zero extra network request
- Animatable via CSS
- Color-themeable
- Scales perfectly

The marker text is rendered as HTML on top of the SVG surface (positioned absolute over the surface's bounding box). This lets the text reflow naturally for varying content lengths and lets Permanent Marker font handle the rendering.

For surfaces where the user wants **fully hand-designed authenticity**, pass `customSvg` — that SVG replaces the surface + text entirely. Use case: a decorative whiteboard with annotations and arrows that the user wants to author by hand. The frame stays the same; only the inner surface is overridden.

### Whiteboard text behaviors (per variant + per surface)

**`a-frame` on `/login`** (marker: black, large dramatic):
```
Scribbl.
class of 2026
```

**`a-frame` on `/onboarding` step 1** (marker: blue):
```
welcome, [name]!
let's set up your shirt
```

**`wall-mounted` on `/dashboard`** (live countdown, marker: blue):
```
23 days left
to scribble
```
Updates based on `platform_settings.scribble_ends_at`. Pluralizes correctly ("1 day"). Switches to "scribble phase ended" when expired.

**`wall-mounted` on `/explore`** (marker: black):
```
class of 2026
1,247 classmates
```
Pulls the verified-user count.

**`small` on empty states** (examples, marker: blue):
```
no scribbles yet
share your link
```
```
your wing isn't here
make a group
```

These whiteboard messages replace what would otherwise be `.paper-note` callouts. The whiteboard reads more *classroom-specific* and more *brand-coherent*.

### Accessibility

- The Whiteboard renders as a `<figure>` with `role="img"` and `aria-label={`${title}. ${subtitle ?? ''}`.trim()}`.
- For the dashboard countdown, the live text is mirrored in an `<output aria-live="polite">` somewhere off-screen so screen readers announce updates without re-reading the whole label.
- Color contrast: blue `#2563EB` on off-white `#F8F8F2` measures ~5.8:1 — passes AA. Black `#1A1208` measures ~17:1 — AAA. Red `#D83F6B` measures ~4.7:1 — passes AA. Green `#5F8B48` measures ~4.6:1 — passes AA at large text sizes (which is where it's used).

### Font loading note

`Permanent Marker` is a single-weight Google Font (~22 KB). Add to the `app/layout.tsx` font loader alongside Caveat + Patrick Hand:

```tsx
import { Permanent_Marker } from 'next/font/google'

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marker',
  display: 'swap',
})
```

Add `--font-marker` to `tailwind.config.ts` `fontFamily` and `globals.css`. Total font cost so far: Inter (~30 KB) + Caveat (~25 KB) + Patrick Hand (~18 KB) + Permanent Marker (~22 KB) = ~95 KB across all weights. Acceptable.

---

## 8 · Marginalia primitives

> **North-star reference**: the avatar-view concept image from 2026-05-17 (the "Front view / Back view" mockup with a head wearing sunglasses, scribbles on the shirt, sticker notes + drifting doodles around the avatar). That image is the *canonical visual proof* of how marginalia should compose around a hero. When in doubt, match that image.

### IN for Phase 1

| Primitive | Where it ships | How it's rendered |
|---|---|---|
| **Asterisk divider** `✶ ✶ ✶` | Between sections on signature pages, paragraph breaks on activity log | Three Unicode `✶` characters spaced 16px apart, Caveat 18px in `--ink-500`, centered. Add `aria-hidden="true"` so screen readers skip. |
| **Scribbled name** | Below the avatar on dashboard + profile hero | Caveat at 56px (mobile) → 72px (tablet+) in `--ink-900`. Slight `letter-spacing: -0.01em`. Optional 1° rotation. |
| **Hand-drawn arrow doodle** | One-time pointer on dashboard hero, pointing from the scribbled name to the share CTA | Inline SVG, hand-drawn squiggly arrow, `stroke="var(--ink-700)"`, animated on first view (`stroke-dasharray` reveal over 600ms). |
| **Avatar halo** (new — image-confirmed) | Behind the user's avatar on dashboard + profile hero | A soft elliptical `--brand-soft` (`#ECE8FB`) radial gradient positioned absolute behind the head, ~70% the width of the avatar, ~40% the height, no border, no shadow, `z-index: 0` under the avatar (which sits at `z-index: 1`). Adds atmospheric pop without card chrome. |
| **Drifting doodles** (new — image-confirmed) | Page-level decoration around hero compositions on signature pages (dashboard, profile) | Sticker SVGs already in `src/assets/scribbl/stickers/` — `paper-plane`, `heart`, `lightning`, `sparkle`, `crown`, `smile`, `flower`, `star`, `arrow`, `bear-doodle` — used as **layout decoration**, not as in-shirt scribbles. 24–40px size, ±3° to ±12° rotation, 60–80% opacity, positioned absolute with `pointer-events: none` and `aria-hidden="true"`. 4–6 per hero composition desktop, 2–3 on mobile. |

### OUT (deferred to Phase 2 yearbook)

| Primitive | Why deferred |
|---|---|
| Polaroid frame | Reserved for the "moment preserved" feeling in yearbook |
| Date stamps | Would compete with the Place layer's atmospheric date implication |
| Hand-set page numbers | Same reason — Place layer carries place-time |
| Washi tape on multiple surfaces | Already used (paper-note-tape); don't proliferate |

### What this means for the dashboard hero composition (concrete)

Picture the reference image (avatar with sunglasses + sticker notes drifting around). Top of page:

1. (Subtle in background) lawn illustration fading from vivid to 10% ambient.
2. **Avatar halo**: soft `--brand-soft` radial gradient behind the head, ~70% width × 40% height of the avatar — gives the avatar visual punch without a card.
3. (Inside main content area) avatar with its shirt, centered. Currently `<Avatar>`.
4. Around the avatar, 3–4 floating `sticker-note` elements rotated ±2° — messages from friends already on the shirt.
5. **Drifting doodles**: 4–6 sticker SVGs (paper plane, heart, lightning, sparkle, etc.) positioned absolute around the hero at 60–80% opacity, ±3° to ±12° rotation. These are the small "energy" elements the eye notices last — they make the page feel alive instead of static.
6. Below the avatar, the user's name in Caveat 64–72px, slight tilt 1°.
7. To the right of the name (desktop) or below (mobile), a hand-drawn arrow doodle → and a `pencil-button-primary` that says "Share your link" with the friendly slug.
8. Below this hero block, `✶ ✶ ✶` divider.
9. Below the divider, the rest of the dashboard sections (Groups, Activity, Sign next) on substrate, no cards, just Caveat 22px eyebrows + content rows.
10. To the side or in the corner (desktop) or floating below the hero (mobile): a `wall-mounted` Whiteboard showing the deadline countdown. On the avatar-view surface specifically (`/profile/[userId]`), a `small` Whiteboard with "scribbled by N friends" replaces card chrome around that fact.

That's the entire hero. No card around any of it. The page itself is the page. The reference image is the visual proof of this composition.

### Drifting doodles — placement rules

To prevent randomness from looking like chaos, the doodles follow soft positioning rules:

- **Composition zones**: doodles go in the 4 corners and the 2 sides — never directly behind or in front of the avatar's face/scribbled content
- **Density gradient**: more doodles on the side opposite the share CTA (visual balance — the CTA carries weight on one side, doodles balance on the other)
- **Size variation**: at least 3 size tiers in the composition (24px / 30px / 40px) — never all the same size
- **Rotation variation**: pair every clockwise-rotated doodle with a counter-clockwise one nearby
- **Color**: doodles use the existing scribble palette colors at varying opacity — never grayscale, never desaturated

The actual placement coordinates are baked into the page component (one composition per signature page), not random — random looks like chaos, hand-placed looks like intention.

---

## 9 · Typography ladder

The current type system (Caveat / Patrick Hand / Inter) is correct. The change is *how* we use Caveat — varied scale, not a single 2xl bold.

### Final ladder

| Token | Family | Size (mobile / desktop) | Use |
|---|---|---|---|
| `text-hero-name` | Caveat | 48px / 72px, weight 600 | The scribbled name on signature pages — one per page |
| `text-hero-display` | Caveat | 32px / 48px, weight 600 | Major page headings on signature pages (page title) — one per page |
| `text-eyebrow-display` | Caveat | 20px / 24px, weight 500 | Section eyebrows (one per section), title-cased not uppercase |
| `text-marker` | Permanent Marker | 16–28px (variant-dependent) | Whiteboard text ONLY — title in Permanent Marker on whiteboard surface |
| `text-handwritten-note` | Patrick Hand | 16px / 17–18px, weight 400 | Pen-written feel on paper notes, sticky notes, friend messages, callouts — applies ink-bleed text-shadow |
| `text-nostalgia` | Patrick Hand | 16px / 18px, weight 400 | One-line nostalgic copy per page (the share URL slug, the empty state line) — distinct from `text-handwritten-note` (this is "the one nostalgic line"; the other is paragraphs on notes) |
| `text-eyebrow-uppercase` | Inter | 11px / 12px, weight 600, uppercase, tracking 0.18em | Existing eyebrows on settings, activity, admin |
| `text-body` | Inter | 14px / 16px, weight 400 | Body copy |
| `text-meta` | Inter | 12px / 13px, weight 500 | Metadata, captions |

Add to `tailwind.config.ts` `fontSize` or as utility classes in `globals.css`. Recommend utility classes named exactly as above so calls read `<h1 className="text-hero-name">` — self-documenting.

### `text-handwritten-note` — the "ink on paper" effect

```css
.text-handwritten-note {
  font-family: var(--font-hand);              /* Patrick Hand */
  font-size: 17px;
  line-height: 1.55;
  color: var(--ink-bleed);                    /* warm brown ink */
  letter-spacing: 0.01em;
  text-shadow:
    0 0 0.6px currentColor,                   /* very faint ink bleed into paper */
    0 0.4px 0 rgba(0, 0, 0, 0.04);            /* subtle paper-depth halo */
}
```

Applied automatically to any text inside `.sticker-note`, `.paper-note`, `.paper-note-tape` (via `&` selectors in `globals.css`). Manual usage on standalone elements: `<p className="text-handwritten-note">…</p>`.

### Rules

- **One hero text per page maximum.** Never two Caveat 72px on the same screen.
- **Patrick Hand is for ONE LINE per page** as `text-nostalgia` — overuse erodes its nostalgic punch. Use it on the share-URL slug, the empty state copy, the dashboard's friendly tip. Not for body paragraphs.
- **`text-handwritten-note` is for PAPER SURFACES ONLY** — sticky notes, paper notes, friend messages. These surfaces invite handwriting; chrome does not.
- **`text-marker` is for WHITEBOARDS ONLY** — never use Permanent Marker on paper, never on chrome buttons. The font carries the surface metaphor; misusing it breaks the system.
- **Inter takes everything else.** It's the workhorse.

---

## 10 · Color palette + tokens

### Final palette (Sunlit Lawn)

```css
:root {
  /* Paper — warmed for Sunlit Lawn */
  --paper-50:   #FFFDF7;
  --paper-100:  #FFF6D9;   /* was #FFF9E6 — warmer by ~8% */
  --paper-200:  #FFF0C2;
  --paper-300:  #F4EAD8;

  /* Ink — unchanged */
  --ink-900:    #1A1208;
  --ink-700:    #3D2E14;
  --ink-500:    #6B4E1E;

  /* Brand — unchanged */
  --brand:        #6f54df;
  --brand-soft:   #ECE8FB;
  --brand-hover:  #5B41C9;
  --brand-ring:   rgba(111, 84, 223, 0.30);

  /* Whiteboard — new (Round 4 rename from chalkboard) */
  --whiteboard-surface:    #F8F8F2;   /* off-white, slightly aged ivory */
  --whiteboard-frame:      #cfd5da;   /* brushed aluminum outer */
  --whiteboard-frame-edge: #9ba2aa;   /* aluminum inner shadow edge */
  --whiteboard-erased:     rgba(155, 162, 170, 0.04);  /* faint smudge */

  /* Marker palette — for whiteboard text + signature ink moments */
  --marker-blue:   #2563EB;
  --marker-black:  #1A1208;
  --marker-red:    #D83F6B;
  --marker-green:  #5F8B48;

  /* Pencil + ink — for chrome micro-interactions */
  --pencil-shade-color: rgba(45, 41, 35, 1);   /* graphite, multiplied by --pencil-shade-strength % */
  --ink-bleed:          rgba(61, 46, 20, 0.85); /* warm brown ink for input underlines, signatures */
  --ink-stamp-green:    #5F8B48;

  /* Edges — unchanged */
  --line-soft:    rgba(45, 41, 35, 0.14);
  --line-softer:  rgba(45, 41, 35, 0.08);
  --line-strong:  rgba(45, 41, 35, 0.28);
}
```

### Dropped

- `--sunlit-peach` (proposed in round 2, dropped in round 3 — the illustration provides the warmth)

### Scribble palette (the user-drawing colors, in `lib/constants.ts`)

**Unchanged.** Already correct, already locked.

### Tailwind config impact

`tailwind.config.ts` needs:
- `paper.100` and `paper.DEFAULT` → `#FFF6D9`
- New `whiteboard.surface`, `whiteboard.frame`, `whiteboard.frameEdge`
- New `marker.blue`, `marker.black`, `marker.red`, `marker.green`
- New `fontFamily.marker` → `var(--font-marker)` (Permanent Marker)

---

## 11 · First-visit "hero loading" mechanic

Inspired by game-screen loaders. First time a user lands on a signature page, the Place layer plays a brief vivid moment, then settles into ambient.

### Spec

| Surface | First-visit behavior | Subsequent visits |
|---|---|---|
| `/login` | Always vivid (this is the brand front door) | Always vivid |
| `/dashboard` | Vivid 80% for ~1.8s desktop / ~1.1s mobile, fade to ambient 10% | Always ambient |
| `/profile/[userId]` | Always ambient | Always ambient |
| `/explore` | Vivid 80% for ~1.5s desktop / ~1.0s mobile, fade to ambient | Always ambient |

### Mechanics

- **localStorage key**: `scribbl_first_visit_v1` (object with per-surface flags: `{dashboard: true, explore: true}`). Set to `true` AFTER the hero animation completes.
- **Detection**: on mount, read the flag. If absent or false, render the Place layer at vivid + animate. If true, render at ambient.
- **CSS keyframe**: `place-fade-to-ambient` (see § 4). `animation-fill-mode: forwards` so the final state sticks.
- **Skip conditions**:
  - `prefers-reduced-motion: reduce` → skip entirely, render at ambient.
  - `connection.effectiveType in ('slow-2g', '2g')` → skip entirely, render at ambient.
  - User has visited this surface before (flag set) → skip.
- **Reset**: a hidden "Replay intro" toggle in `/settings` clears the flags. Optional; not Phase 1.

### Implementation (React sketch)

```tsx
// components/place/PlaceBackground.tsx
'use client'

export function PlaceBackground({
  surface,          // 'dashboard' | 'login' | 'profile' | 'explore' | 'groups'
  illustration,     // 'lawn-golden-hour' | 'classroom-hall'
  alwaysVivid,      // login only
  alwaysAmbient,    // profile, groups, group-detail
}) {
  const [phase, setPhase] = useState<'vivid' | 'fading' | 'ambient'>(() => {
    if (alwaysVivid) return 'vivid'
    if (alwaysAmbient) return 'ambient'
    if (typeof window === 'undefined') return 'ambient'  // SSR safe
    const seen = readFirstVisitFlag(surface)
    if (seen) return 'ambient'
    if (prefersReducedMotion() || isSlowConnection()) return 'ambient'
    return 'vivid'
  })

  useEffect(() => {
    if (phase !== 'vivid' || alwaysVivid) return
    const t = setTimeout(() => setPhase('fading'), isMobile() ? 1100 : 1800)
    return () => clearTimeout(t)
  }, [phase, alwaysVivid])

  // ...render layered image + animation
}
```

(Full implementation in `components/place/PlaceBackground.tsx`.)

---

## 12 · Mobile strategy

The single most important consideration for this theme. Sunlit Lawn must feel right on a 375 × 667 phone or it fails.

### Layout-level rules

- **Hero composition collapses to vertical stack on mobile.**
  - Desktop: avatar | scribbled name + arrow → share CTA (horizontal)
  - Mobile: avatar / scribbled name / hand-drawn arrow ↓ / share CTA (vertical)
  - The arrow rotates from `→` to `↓` direction — same SVG, different rotation via prop.
- **Whiteboard scales but does not change variant.** Desktop a-frame is still a-frame on mobile, just smaller (max-width 240px).
- **Sticker notes reduce count and snap tighter on mobile.** Desktop shows 4 floating notes; mobile shows 2 with tighter positioning.
- **First-visit duration is shorter on mobile** (~1100 ms vs 1800 ms desktop).
- **Place illustration uses mobile-art-directed crop**, not a downscale.

### Art direction for mobile illustrations

Per § 4, mobile crops are different framings, not resized desktop images. Hand off to the illustrator with both:

> *"Desktop crop: wide horizon, lawn in foreground, building or tree in middle distance, golden sky takes top third."*
>
> *"Mobile portrait crop: vertical slice of the same scene. Focus on one tree + a corner of the lawn + a strip of sky. Same color palette, same lighting, same time of day. Should feel like the same place at a different angle, not a zoom."*

Use `<picture>` element or Next.js `<Image>` with `sizes` + multiple `src` to art-direct:

```tsx
<picture>
  <source media="(max-width: 768px)" srcSet="/illustrations/place/lawn-golden-hour-mobile.webp" />
  <source media="(max-width: 1280px)" srcSet="/illustrations/place/lawn-golden-hour-tablet.webp" />
  <img src="/illustrations/place/lawn-golden-hour-desktop.webp" alt="" />
</picture>
```

Or wrap in a small React component that does the right thing per breakpoint.

### Memory budget

Mobile devices (especially mid-range Android) struggle with multiple full-screen blurred + blended layers. Rules:

- **One Place layer per page max.** Don't compose two illustrations.
- **No animated illustrations.** Animation is reserved for the chalk-text reveal + the place-fade keyframe.
- **Use CSS `will-change: opacity` sparingly** — only on the Place layer during the fade animation, removed after.

### What gets dropped on mobile (gracefully)

| Element | Mobile behavior |
|---|---|
| Hand-drawn arrow doodle | Rotates from horizontal → vertical |
| Floating sticker notes | 4 → 2 (selected most-recent), tighter spacing |
| Whiteboard subtitle | Always shown |
| `prefers-reduced-motion` | Skip place-fade keyframe, render ambient immediately |
| `slow-2g`/`2g` | Skip Place layer entirely, paper substrate only |

---

## 13 · Image optimization playbook

### Formats + sizes

| Source | Production size | Format | Target file size |
|---|---|---|---|
| Source illustration (PSD/AI/SVG) | — | — | (off-repo or `/private/source/`) |
| Desktop crop | 1920 × 1080 | WebP @ q=78 | 120–180 KB |
| Tablet crop | 1280 × 832 | WebP @ q=78 | 80–120 KB |
| Mobile portrait crop | 828 × 1474 | WebP @ q=78 | 40–80 KB |
| Blur placeholder | 16 × 16 base64 PNG | — | < 1 KB inline |

### Build pipeline

Use the existing Next.js Image pipeline. Store originals under `public/illustrations/place/`. The Next.js `<Image>` component handles `srcset`, `sizes`, and lazy loading automatically.

For the placeholder blur, generate once via `npx @plaiceholder/cli` (or a small custom script) and save the base64 string to a sibling `.txt` file. Import at component build time.

### Serving rules

- `<Image priority>` on the Place layer for `/login` and the FIRST `/dashboard` load (preload + above-the-fold).
- `<Image loading="lazy">` everywhere else.
- Pre-fetch the dashboard's Place layer from the login page (link rel=preload) so the post-auth navigation feels instant.

### Connection-aware degradation

```tsx
function isSlowConnection() {
  if (typeof navigator === 'undefined') return false
  const c = (navigator as any).connection
  return c && ['slow-2g', '2g'].includes(c.effectiveType)
}
```

When `isSlowConnection()` returns true, the `<PlaceBackground>` renders an empty `<div>` instead of an `<Image>`. Substrate + content fill the page. Zero broken layout, zero perceived "slow."

### Total weight budget for Phase 1

- 6 WebP files (3 crops × 2 illustrations) = ~600 KB total in the repo
- Per page weight added: 40–180 KB (varies by viewport + first vs subsequent visit)
- Per page weight on subsequent visits: 0 KB (cached)

Well within the 1 MB page-weight budget for student users on cellular.

---

## 14 · Micro-interactions catalog

> **Round 4 addition** (2026-05-21). The metaphor stopped being decoration and became *physics*. Every interactive moment in the app picks one school-instrument behavior. If a new interactive moment doesn't have a behavior in this catalog, it doesn't ship until one is specified.

### Performance + accessibility guardrails (apply to every interaction below)

- CSS-only or single-SVG-stroke-reveal. No JS animation libraries. No GIFs. No filters more expensive than `blur` (and even that, sparingly).
- Every effect respects `prefers-reduced-motion: reduce` — animations collapse to ≤1ms, stroke-dasharray reveals jump to final state, stamp lands without overshoot.
- 60fps on mid-range Android. Effects that touch layout (anything that triggers reflow) are forbidden.
- Button hover is the most-fired event in the app — its CSS path must be cheap (zero JS, single composited property change).

### Buttons — pencil shade hover (replaces `translateY(-1px)` SaaS hover)

The existing `.pencil-button` has a `repeating-linear-gradient(-12deg, …)` at ~4% opacity for its idle pencil texture. The new hover ramps that opacity upward.

```css
@property --pencil-shade-strength {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 4%;
}

.pencil-button {
  --pencil-shade-strength: 4%;
  background:
    repeating-linear-gradient(-12deg,
      rgba(45, 41, 35, calc(var(--pencil-shade-strength) / 100)) 0 2px,
      transparent 2px 8px),
    var(--paper-100);
  transition:
    --pencil-shade-strength 200ms ease-out,
    border-color 200ms ease-out;
}
.pencil-button:hover  { --pencil-shade-strength: 18%; }
.pencil-button:active { --pencil-shade-strength: 28%; transform: translateY(1px); }
```

`@property` is supported in all current browsers. Browsers without `@property` support degrade to instant transition (gradient still works, just no animated ramp). Acceptable.

**For `.pencil-button-primary`** (the brand-filled version): the pencil-shade overlays on top of the existing brand fill. Ramps 8% → 24% → 36%.

**Active vs focus**: focus-visible still uses the existing brand-ring shadow for keyboard accessibility. The pencil-shade is on top of that, not a replacement.

### Inputs — ink-draw focus underline (additive, not replacement)

The existing input has a 3px brand-ring shadow on focus. The brand-ring **stays** for keyboard-focus accessibility. On top of that, an SVG line below the input draws itself left-to-right when the user focuses.

```tsx
// components/forms/InkUnderline.tsx
export function InkUnderline({ active }: { active: boolean }) {
  return (
    <svg
      className="absolute inset-x-0 -bottom-1 h-2 pointer-events-none"
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 4 Q 50 1 100 4 T 198 4"
        stroke="var(--ink-bleed)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: active ? 0 : 200,
          transition: 'stroke-dashoffset 350ms ease-out',
        }}
      />
    </svg>
  )
}
```

**State logic**:
- Empty + unfocused: `active=false` → line offscreen (dasharray hides it)
- Focused: `active=true` → line draws left to right over 350ms
- Filled (has value) + unfocused: `active=true` → line stays drawn (focus left memory)
- Cleared via backspace to empty: `active=false` → line erases right-to-left

Wrap inputs in `<label>` and toggle `active` via `useFocusWithin()` + `value.length > 0`.

### Sticker notes — lift-off-paper hover

```css
.sticker-note,
.paper-note-tape {
  transition:
    filter 180ms ease-out,
    transform 180ms ease-out;
}
.sticker-note:hover,
.paper-note-tape:hover {
  filter: drop-shadow(0 14px 22px rgba(80, 90, 105, 0.18));
  transform: scale(1.02) /* preserves any inline rotation via composition */;
}
```

Rotation preserved — don't flatten the tilt. If a sticker is `transform: rotate(-2deg)`, the hover state composites: `transform: rotate(-2deg) scale(1.02)`. Inline style + CSS class with both transforms is the right shape; or use CSS custom properties for the rotation so the hover style can reference them.

### Toggles + checkboxes — ink check draws in

```tsx
// components/forms/InkCheckbox.tsx
function CheckMark({ checked }: { checked: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8 L7 12 L13 4"
        stroke="var(--ink-bleed)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 20,
          strokeDashoffset: checked ? 0 : 20,
          transition: 'stroke-dashoffset 250ms ease-out',
        }}
      />
    </svg>
  )
}
```

Slight overshoot at the end of the stroke creates the "I lifted my pen" feel — achieved with a `cubic-bezier(0.45, 1.4, 0.6, 1)` timing curve instead of pure `ease-out`.

### Submit success — teacher's stamp

```tsx
// components/feedback/StampSuccess.tsx
<svg className="stamp-success" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="56" stroke="var(--ink-stamp-green)" strokeWidth="3" fill="none" />
  <text x="60" y="55" textAnchor="middle" fontFamily="Caveat" fontSize="22" fill="var(--ink-stamp-green)">
    scribbled!
  </text>
  <text x="60" y="80" textAnchor="middle" fontFamily="Caveat" fontSize="14" fill="var(--ink-stamp-green)" opacity="0.7">
    ✓ approved
  </text>
</svg>
```

```css
@keyframes stamp-land {
  0%   { opacity: 0;    transform: scale(1.3) rotate(8deg); }
  60%  { opacity: 0.85; transform: scale(0.97) rotate(2deg); }
  100% { opacity: 0.85; transform: scale(1) rotate(5deg); }
}
.stamp-success {
  animation: stamp-land 260ms ease-out forwards;
  filter: blur(0.4px);  /* faint blur — real stamps aren't crisp */
}
```

Used sparingly. Phase 1 moments: onboarding complete, scribble published, avatar locked.

### Loading — pencil writes

Replace the spinning Lucide `<Loader>` icon in any button's "submitting" state with a tiny SVG pencil drawing a wavy line in a loop.

```tsx
// components/feedback/PencilLoader.tsx
<svg viewBox="0 0 40 20">
  <path d="M2 12 Q 12 6 22 12 T 38 12" stroke="var(--ink-bleed)" strokeWidth="1.6" fill="none">
    <animate attributeName="stroke-dasharray" values="0,40;40,0" dur="700ms" repeatCount="indefinite" />
  </path>
</svg>
```

### Errors — red ink crossout

Inline error text gets `text-handwritten-note` styling in `--danger` color. For *field-level* errors where a wrong value needs to be visually marked, a red ink wavy line strikes through the offending field/word (same stroke-dasharray reveal mechanic as the input underline, just red and slightly thicker).

### Empty states — drawn arrow with wiggle

The `Whiteboard small` + `HandDrawnArrow` combination. The arrow has an attention-grab animation on first render:

```css
@keyframes attention-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(2deg); }
  75%      { transform: rotate(-2deg); }
}
.hand-drawn-arrow--attention {
  animation: attention-wiggle 600ms ease-in-out 3;  /* 3 wiggles then settle */
}
```

Triggered on first viewport intersection (IntersectionObserver). After 3 wiggles, settles to 0° permanently.

### Reduced motion handling

`@media (prefers-reduced-motion: reduce)` block in `globals.css` collapses every animation duration to `1ms !important` and sets `stroke-dashoffset: 0` directly on the SVG paths that use dasharray reveals. Block at the bottom of `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .ink-underline path,
  .ink-check path { stroke-dashoffset: 0 !important; }
  .stamp-success { transform: scale(1) rotate(5deg) !important; opacity: 0.85 !important; }
}
```

---

## 15 · School-element vocabulary

> **The design system in one table.** Every visual primitive in the app maps to one school instrument. If a new UI element doesn't map to one of these instruments, it doesn't ship until it does. Pin this table.

| Instrument | Visual cues | Used for | Implementation primitive |
|---|---|---|---|
| **Paper** (warmed cream) | The substrate everywhere | Working surface of every page | `--paper-100` (warmed), dotted grid (existing) |
| **Pencil** (graphite) | Cross-hatched diagonal shading at −12°, warm gray | Button idle / hover / active states, panel chrome | `repeating-linear-gradient(-12deg, …)`, `@property --pencil-shade-strength` |
| **Ink** (fountain or ballpoint, warm brown) | Smooth wavy lines, slight bleed, warm-brown to dark-brown | Input focus underlines, ink check, signature mode in studio, "approved" stamp text, error crossouts | SVG stroke-dasharray reveal, `--ink-bleed` token |
| **Marker** (dry-erase) | Slight thickness variation, blue/black/red/green | Whiteboard text ONLY | `Permanent Marker` font + same-color text-shadow bleed |
| **Sharpie/pen** (paper-handwriting) | Sketchy strokes, Patrick Hand font, slight ink-bleed text shadow | Sticky notes, paper notes, friend messages, empty state copy | `.text-handwritten-note` class |
| **Highlighter** | Translucent yellow wash | Existing in-shirt scribble tool only — NOT on chrome | Existing `CANVAS_COLORS` |
| **Tape** (washi) | Yellow tape, ±3° rotation | Sticky-note corners only (existing) | `.paper-note-tape::before` |
| **Stamp** (teacher's approval) | Green ink, circular, slightly imperfect, with faint blur | Submit-success moments — three Phase 1 instances | `.stamp-success` SVG component |
| **Whiteboard** (dry-erase board) | Off-white surface, aluminum frame, marker text | Brand display, announcements, live countdown, empty states | `<Whiteboard variant=…>` component |
| **Doodle** (drifting marginalia) | Small sketched icons, 60–80% opacity, varied rotation | Page-level decoration around hero compositions | `<DriftingDoodles>` component using existing sticker SVGs |
| **Halo** (atmospheric brand wash) | Soft elliptical `--brand-soft` radial | Behind the user's avatar on signature pages | `<AvatarHalo>` component |
| **Eraser** | (not yet implemented — Phase 1.5 maybe) | Removing scribbles in studio | TBD |
| **Chalkboard** | (reserved for Phase 2 yearbook — "vintage classroom" feel) | (Phase 2 only) | Phase 2 doc owns |

### Anti-patterns (what this vocabulary explicitly forbids)

- **No SaaS chrome.** No flat solid-color buttons with `translateY(-1px)` hover. No 8px border-radius. No subtle `box-shadow: 0 1px 2px` that says "modern web app." Every interactive element picks an instrument and uses its physics.
- **No emoji as functional UI.** Emoji are fine as decoration in user-generated content (notes, scribbles). They are NOT a substitute for the sticker SVGs, which carry the design system's visual style. Use the SVG `heart.svg`, not the emoji ❤️, for marginalia.
- **No CSS gradient buttons.** No `linear-gradient(...)` on button backgrounds except the pencil-shade. Solid color (idle) → pencil-shade (hover/active). That's it.
- **No skeuomorphic shadows.** No "lifted card" shadows on every element. The drop-shadow primitive is reserved for the sticker lift-off and the whiteboard. Everything else sits flat on paper.
- **No Inter for handwriting moments.** Sticky notes, friend messages, scribbled names — these use Caveat or Patrick Hand. Inter is the workhorse for UI text only.
- **No Permanent Marker outside the whiteboard.** The marker font carries the whiteboard metaphor. Misusing it on a paper note or button breaks the system.

### Rule of substitution

If you ever feel the urge to add a new visual style to the app, run it through this question:

> *"Which school instrument is this? Paper? Pencil? Ink? Marker? Sharpie? Tape? Stamp? Whiteboard? Doodle? Halo? If none of these, can I redesign the moment to use one of them instead?"*

If you can't pick one and you can't redesign, the system is silently telling you the moment doesn't belong. Either rework the design or write a new entry in this table (and document why).

---

## 16 · Subagent boundaries

When Phase 1 implementation kicks off, work splits across three concurrent subagents. Clear non-overlapping scopes prevent merge conflicts.

### Subagent A — Foundation (tokens + components)

Owns:
- `app/globals.css` — paper-100 warmed, whiteboard tokens, marker palette, pencil-shade variable, place-layer utility classes, place-fade keyframe, new tilt utilities, micro-interaction CSS (button hover, input focus underline, sticker lift), `text-handwritten-note` rules
- `tailwind.config.ts` — paper.100 update, whiteboard.* tokens, marker.* tokens, fontFamily.marker (Permanent Marker), optional `fontSize` ladder additions
- `components/place/PlaceBackground.tsx` (new)
- `components/brand/Whiteboard.tsx` (new)
- `components/brand/AvatarHalo.tsx` (new — round 5 primitive, the soft brand-color radial behind the head)
- `components/brand/DriftingDoodles.tsx` (new — round 5 primitive, page-level sticker SVGs as marginalia)
- `components/brand/HandDrawnArrow.tsx` (new — the squiggly arrow doodle)
- `components/marginalia/AsteriskDivider.tsx` (new)
- Utility hooks: `lib/hooks/useFirstVisit.ts`, `lib/hooks/usePrefersReducedMotion.ts`, `lib/utils/connection.ts`
- Placeholder illustrations (sketch-style SVG stand-ins) at `public/illustrations/place/`
- Unit tests for the new utilities

Does NOT touch:
- Any page-level `app/**/page.tsx`
- Existing pages' layouts
- Avatar / scribble / studio components

### Subagent B — Signature pages

Owns:
- `app/login/page.tsx` — Place layer (vivid), Whiteboard a-frame "Scribbl · Class of 2026", asterisk divider, layout
- `app/dashboard/page.tsx` — Place layer (first-visit hero → ambient), Whiteboard wall-mounted (countdown), avatar halo + drifting doodles, hero composition rewrite (avatar + sticker notes + scribbled name + arrow + share CTA), drop card chrome from sections, asterisk dividers, typography ladder
- `app/profile/[userId]/page.tsx` — Place layer (always ambient), Whiteboard small ("scribbled by N"), avatar halo + drifting doodles, avatar hero, "scribbled by" sticker grid

Does NOT touch:
- The new foundation components (uses them as imports only)
- Avatar/scribble internals
- Settings, admin, error pages

### Subagent C — Secondary pages + docs

Owns:
- `app/explore/page.tsx` — Place layer (classroom-hall, first-visit hero → ambient), Whiteboard wall-mounted (class count)
- `app/groups/page.tsx`, `app/groups/[groupId]/page.tsx` — Place layer (lawn, always ambient), Whiteboard small on group cards
- `app/activity/page.tsx` — paper-only, asterisk dividers
- `app/onboarding/page.tsx` — Whiteboard a-frame "Welcome, [name]" on step 1 only
- `app/settings/page.tsx` — paper-only, no place
- Empty states across the app — convert appropriate ones to Whiteboard `small` variant
- `docs/02-design-system.md` — add a top-of-file pointer to doc 18 superseding Phase 1 details
- `docs/04-architecture.md` — add Place layer to the asset directory section
- `docs/07-changelog.md` — append the Round 6 Sunlit Lawn entry when done

Does NOT touch:
- The new foundation components (uses them as imports only)
- Signature pages owned by Subagent B
- Avatar/scribble internals

---

## 17 · Implementation phases

Seven concrete passes. Each ends in a green build (type + lint + tests pass). All seven shipped on 2026-05-21.

### Phase 1A — Tokens + foundation ✅

- Update `--paper-100` in `globals.css` and `tailwind.config.ts`.
- Add whiteboard tokens + marker palette + pencil-shade variable + ink-bleed variable.
- Add the typography ladder utility classes.
- Add `.tilt-left`, `.tilt-right`, `.tilt-tiny`.
- Verify the existing app still renders with the new paper tone (smoke).

### Phase 1B — Components ✅

- `<PlaceBackground>`, `<Whiteboard>`, `<HandDrawnArrow>`, `<AsteriskDivider>`, `<AvatarHalo>`, `<DriftingDoodles>`, `<InkUnderline>`, `<InkCheckbox>`, `<StampSuccess>`, `<PencilLoader>`.
- Hooks: `useFirstVisit`, `usePrefersReducedMotion`, `useSlowConnection`.
- Placeholder SVG illustrations in `public/illustrations/place/` (so the components render something during dev).
- Storybook-style demo page at `app/dev/sunlit-lawn/page.tsx` (gated, dev-only) showing every variant.

### Phase 1C — Login page ✅

- The most contained surface. Validate the full stack here.
- Wire `<PlaceBackground>` (vivid, no fade), `<Whiteboard variant="a-frame">`, `<AsteriskDivider>`.
- Visual QA pass.

### Phase 1D — Dashboard ✅

- The portfolio-critical surface.
- Wire `<PlaceBackground>` with first-visit hero, `<Whiteboard variant="wall-mounted">` (countdown), `<AvatarHalo>`, `<DriftingDoodles>`, rewrite hero composition, drop section card chrome, asterisk dividers.
- Visual QA pass. This is the screenshot.

### Phase 1E — Profile + Explore + Groups ✅

- Subagent B (profile) + Subagent C (explore, groups) scope. Inherit foundation, propagate substrate + whiteboard.
- Smaller scope per surface.

### Phase 1F — Onboarding + Settings + Admin ✅

- Quiet surfaces. Warmed substrate + asterisk divider where appropriate.
- Onboarding step 1 gets the "Welcome, [name]" a-frame whiteboard — small delight beat.

### Phase 1G — Polish + tests + docs ✅

- Factored the duplicated `HeroStickerNote` + `HERO_NOTE_SLOTS` + `STICKER_TONES` definitions out of the dashboard + profile pages into a shared `components/marginalia/HeroStickerNotes.tsx`. Both pages now compose `<HeroStickerNotes notes={…} />`.
- Nav consistency sweep — every signature + secondary surface (login, dashboard, profile, settings, activity, groups, group-detail, explore, yearbook) now uses the same top-nav rule: `border-b border-[color:var(--line-soft)] bg-paper-100/88 backdrop-blur`. The older `border-black/5 bg-paper-100/80` and `bg-white/90 border-gray-100` variants are gone.
- Dashboard footer "One shirt. A hundred memories." line swapped the lucide `Heart` for the `heart.svg` sticker SVG via `next/image`. Closes the § 15 rule.
- Added `tests/hero-sticker-notes.test.ts` — 7 tests covering the marginalia data contract (tone palette shape, slot count, mobile-collapse rule, rotation balance, single-corner positioning). Test suite is now 60/60.
- Phase 2 deferred (need React Testing Library): full DOM-render tests of `<Whiteboard>` and `<PlaceBackground>`.
- Phase 2 deferred (LCP nice-to-have): `<picture>` → `next/image` migration in `<PlaceBackground>`.
- Phase 2 deferred (build-step refactor): consolidate sticker SVGs between `src/assets/scribbl/stickers/` and `public/scribbl/stickers/`.

### Final green build status

```
tsc           : pass (0 errors)
eslint .      : pass (0 warnings)
node --test   : 60/60 pass
```

### Estimated vs actual time

Estimated 3–4 hours. Actual ~7 hours of parallel work across three subagent passes plus the parent. The extra time went into the design-system rounds 4 and 5 (micro-interactions catalog, school-element vocabulary, validation against the avatar reference image) — not the implementation itself.

---

## 18 · Asset gap list

What we're waiting on. As of 2026-05-21:

| Asset | Format | Source | Status |
|---|---|---|---|
| `lawn-golden-hour` illustration | WebP × 3 crops + blur stub | User to generate via ChatGPT / Ideogram from their campus photos | **Pending** — Subagent A will ship placeholders, user swaps in real ones later |
| `classroom-hall` illustration | WebP × 3 crops + blur stub | User to generate from classroom photo they mentioned | **Pending** |
| (Optional) `entrance-archway` for separate login hero | WebP × 3 crops + blur stub | User's decision (Option A vs B in § 4) | **Deferred** |
| Whiteboard SVG | Inline React component (frame + surface) | Subagent A produces | **Subagent A** |
| Hand-drawn arrow SVG | Inline React component | Subagent A produces, possibly several variants (squiggly, dotted, dashed) | **Subagent A** |
| Asterisk divider | Unicode `✶` characters, styled | Subagent A produces | **Subagent A** |

User's path for the illustrations:
1. Take the existing campus photos.
2. Use ChatGPT or Ideogram with a prompt like:
   > *"Sketch-style illustration with flat color fills of a college lawn at golden hour, ~4 PM lighting. Long soft shadows, warm ambient light. Muted palette that harmonizes with cream paper. Wide horizon, lawn in foreground, building or tree in middle distance. No people, no faces, no text, no logos. Plenty of negative space. Studio Ghibli background simplified, or moleskine travel sketch with watercolor wash style."*
3. Generate at 1920 × 1080 (desktop crop). Repeat for portrait mobile crop.
4. Compress via Squoosh or ImageOptim to WebP at q=78. Target 80–150 KB.
5. Drop files into `public/illustrations/place/` with the file names from § 4.
6. Run `npx @plaiceholder/cli` (or manually) to generate the blur stubs.

The placeholder illustrations shipped by Subagent A in Phase 1B let the entire pipeline come up *before* the user has produced real assets. The user can ship Phase 1 with placeholders, then upgrade illustrations on their own schedule. Zero blocking.

---

## 19 · Tests + accessibility

### What must pass before Phase 1 is "done"

- `npx tsc --noEmit` — clean
- `npm run lint` — clean (0 errors, 0 warnings)
- `npx tsx --test tests/*.test.ts` — all green
- **New tests**:
  - `tests/place-background.test.ts` — verifies the first-visit flag mechanic, the reduced-motion skip, the slow-connection skip
  - `tests/whiteboard.test.ts` — verifies variant rendering + marker-color prop + ARIA labels

### Accessibility checks

- All new components have `aria-label` or `role` where decorative
- Whiteboard marker contrast: blue 5.8:1, black 17:1, red 4.7:1, green 4.6:1 (verified in § 7)
- Place layer at ambient: not perceivable to screen readers (background image, decorative)
- Place layer at vivid: still decorative; the content layer carries all meaning
- `prefers-reduced-motion: reduce` honored
- Mobile tap targets all ≥ 44px (existing rule, preserved)

### Performance checks

- Lighthouse score on `/dashboard` (mobile): Performance ≥ 90, Accessibility ≥ 95
- First Contentful Paint < 1.5s on simulated 4G
- Largest Contentful Paint < 2.5s on simulated 4G
- Cumulative Layout Shift < 0.1 (the place-fade animation must not trigger reflow)

---

## 20 · Phase 2 hand-off

When the scribbling phase ends (~1 month from launch) and the yearbook phase opens, a new doc (`19-scrapbook-yearbook-spec.md`) will own:

- Polaroid frame component
- Two-panel scrapbook spread layout for `/yearbook/[userId]`
- Substrate shift to a slightly cooler "archival" cream
- Date stamps + page numbers (the marginalia we deferred from Phase 1)
- A different illustration for `/yearbook` (auditorium or graduation stage)
- The "scribble preserved" transition animation from Phase 1 → Phase 2

The Sunlit Lawn components (`<PlaceBackground>`, `<Whiteboard>`, `<AsteriskDivider>`, `<AvatarHalo>`, `<DriftingDoodles>`, the typography ladder, the micro-interactions catalog) all carry forward unchanged. Phase 2 *extends* Phase 1; it doesn't replace it.

> **Phase 2 note**: the *chalkboard* aesthetic — originally renamed to whiteboard in Phase 1 round 4 — could come back as a vintage primitive specific to the yearbook (think: archived classroom chalkboard with the class roster). Phase 2 doc owns that call.

---

## Decision history (footer)

| Date | Round | Decision | Reasoning |
|---|---|---|---|
| 2026-05-21 | 3 | Selected Direction D-revised "Sunlit Lawn" over A/B/C | User reframed: scribble phase is outdoor + on-the-person; scrapbook is the future yearbook |
| 2026-05-21 | 3 | Added illustrated campus backgrounds as Place layer | User insight: "appears once, then almost invisible — feeling they are there" |
| 2026-05-21 | 3 | Added Chalkboard component as reusable brand surface | User insight: "every college has a whiteboard/chalkboard stand" |
| 2026-05-21 | 3 | Dropped polaroid frames + date stamps + page numbers | Reserved for Phase 2 yearbook so Phase 2 has its own moment |
| 2026-05-21 | 3 | Dropped `--sunlit-peach` accent color | Illustration provides the warmth; chrome stays restrained |
| 2026-05-21 | 3 | Locked first-visit hero mechanic (~1.8s desktop / ~1.1s mobile) | Game-screen loader feel; persisted via localStorage |
| 2026-05-21 | 3 | Locked WebP + art-directed mobile crops + slow-connection degradation | Mobile-first performance discipline |
| 2026-05-21 | 4 | Renamed Chalkboard → Whiteboard | User: "whiteboard is more modern" — contemporary classroom feel, lets user design the boards themselves |
| 2026-05-21 | 4 | Locked micro-interactions catalog (§ 14) | User: "hope the micro interactions, CTAs are a little themed — pencil colour style fill" — the metaphor became physics |
| 2026-05-21 | 4 | Locked `text-handwritten-note` (Patrick Hand + ink-bleed) for paper surfaces | User: "notes left behind in writing… can have ink like writing to feel more authentic" |
| 2026-05-21 | 4 | Added Permanent Marker font for whiteboard text only | Marker carries the whiteboard metaphor; misusing it would break the system |
| 2026-05-21 | 4 | Locked school-element vocabulary (§ 15) as the design system table | "Paper / pencil / ink / marker / Sharpie / tape / stamp / whiteboard / doodle / halo" — every UI element maps to one |
| 2026-05-21 | 5 | Validated against original avatar-view concept image | Every primitive maps cleanly; reference image is now canonical north star for dashboard + profile composition |
| 2026-05-21 | 5 | Added Avatar halo primitive (`--brand-soft` radial behind head) | Image revealed: the soft purple wash gives the avatar punch without card chrome |
| 2026-05-21 | 5 | Added Drifting doodles primitive (sticker SVGs at page-level) | Image revealed: existing stickers (paper-plane, heart, lightning, etc.) work as page-level marginalia, not just in-shirt stickers |

If you're starting fresh: read this doc top-to-bottom, then doc 17 for context, then start with Subagent A's scope.
