# 02 — Design System

> ⚠ **Phase 1 design system superseded by [doc 18 — Sunlit Lawn theme spec](./18-sunlit-lawn-theme-spec.md).** This doc remains historical. Doc 18 owns: paper-100 token, Whiteboard component, micro-interactions catalog, school-element vocabulary, typography ladder utility classes, place layer, marginalia. When in doubt, doc 18 wins for design.

> The visual language is a **cream paper notebook with hand-drawn personality**. Think school stationery: soft paper texture, pencil borders, sticky-note accents, scribbled underlines under headings, and a warm low-saturation palette. Tech-bright SaaS aesthetic is the enemy.
>
> **⚠ 2026-05-21 update**: skin tone moved from 5 swatches to a curated slider. See **Skin tone** section below + [doc 08 §"Step 3 — Choose Template and Skin"](./08-information-architecture-access-and-implementation-plan.md).

## North-star visuals

The product target visual style is set by these three reference mocks (kept in `assets/`):
- `ChatGPT_Image_May_17__2026__03_49_24_AM-...png` — Signing page, back view, scribble layout
- `ChatGPT_Image_May_17__2026__03_49_32_AM-...png` — Signing page, front view, compose-mode UI
- `ChatGPT_Image_May_17__2026__03_49_12_AM-...png` — Dashboard, avatar centerpiece

What the mocks define:
- Cream paper background with subtle dotted grid
- Centered avatar with a soft purple vignette glow behind it
- The shirt itself is **illustrated**: collared half-sleeve, button placket, chest pocket, pencil-shaded fabric folds
- Floating sticker notes and reactions sit *outside* the shirt area
- Sticky-note tips with washi-tape corners
- Heading text uses a hand-drawn casual style (Caveat / Patrick Hand)
- Body text uses a clean readable sans (Inter)
- Brand accent is a single muted purple `#6f54df`

## Type

| Token | Family | Use |
|---|---|---|
| `font-display` | Caveat (Google) | Headings, hero copy, page titles, signature-style names, sticker notes |
| `font-hand` | Patrick Hand (Google) | Scribble previews, quote previews, secondary notes |
| `font-body` | Inter (Google) | Body text, controls, forms, tables, anything users read for >2 seconds |
| `font-mono` | JetBrains Mono | Code, IDs, debug, never user-facing copy |

Rules:
- **Never use hand-drawn fonts for dense UI or long paragraphs.** It will get unreadable on mobile.
- Hand-drawn fonts are for accents (1–8 words) and emotional moments (names, quotes, stickers, taglines).
- Body fonts always sit at 14–16px minimum on mobile.

## Color tokens

```css
/* Paper surfaces */
--paper-50:      #FFFDF7   /* lightest cream, app backdrop highlight */
--paper-100:     #FFF9E6   /* primary paper */
--paper-200:     #FFF0C2   /* sticker note yellow */
--paper-300:     #F4EAD8   /* deep paper, cards on cards */
--paper-edge:    rgba(45, 41, 35, 0.14)   /* paper border, default */
--paper-edge-soft: rgba(45, 41, 35, 0.08) /* paper border, low emphasis */

/* Ink */
--ink-900:       #1A1208   /* primary text */
--ink-700:       #3D2E14   /* secondary text */
--ink-500:       #6B4E1E   /* tertiary text, metadata */
--ink-300:       #A07040   /* muted, captions */
--ink-100:       #D6C3A3   /* dividers, faint */

/* Brand */
--brand:         #6f54df   /* singular accent, used sparingly */
--brand-soft:    #ece8fb   /* brand backgrounds */
--brand-hover:   #5b41c9

/* Scribble palette (the colors users draw with on shirts) */
--scribble-black:  #2D2923
--scribble-red:    #d83f6b
--scribble-blue:   #2563EB
--scribble-green:  #5f8b48
--scribble-purple: #7C3AED
--scribble-orange: #EA580C
--scribble-yellow: #D97706
--scribble-pink:   #d83f6b
--scribble-teal:   #0891b2

/* Status */
--success:  #5f8b48
--warning:  #D97706
--danger:   #d83f6b
--info:     #2563EB
```

## Spacing scale

Mobile-first. Standard Tailwind scale + a few semantic aliases:

| Token | Value | When |
|---|---|---|
| `space-card` | 16px (mobile) / 24px (≥md) | Inside cards, panels |
| `space-section` | 24px (mobile) / 40px (≥md) | Between page sections |
| `space-page` | 16px (mobile) / 48px (≥md) | Page outer padding |

## Components

### `sketch-panel`
Main card surface. Slightly imperfect border-radius (asymmetric corners give the "hand-drawn" feel), low-contrast border, soft shadow.

### `paper-note`
Yellow sticky-note variant. Used for tips, hints, and emotional copy. Always has a washi-tape corner if it sits over another panel.

### `pencil-button`
Primary hand-drawn action button. Soft repeating-line texture, slight pencil-edge border. Hover lifts 1px.

### `sticker-note`
Floating speech-bubble used *outside* the shirt area for social context (e.g. "Keep going!", "You're legend!"). Never used for shirt content.

### `sticker-reaction`
Round emoji bubble used as a quick reaction *outside* the shirt area.

### `scribble-underline`
A single hand-drawn underline (brand purple) under headings. Used sparingly — never more than once per visible section.

### `bottom-nav` (mobile only)
Fixed bottom tab bar. 5 items: Home / Explore / + Sign / Activity / Profile. Center "+" is the primary CTA (opens "Find someone to sign").

## Mobile-first principles

1. **Touch targets ≥ 44px.** Every tappable element. No exceptions.
2. **Primary actions live in the bottom third.** Thumbs are short; reachability matters.
3. **Side panels collapse to bottom sheets on mobile.** No squeezing 3 columns onto 375px.
4. **The shirt is always the largest element on the screen.** Other UI bends around it.
5. **Safe-area insets respected** on iOS notch + bottom home indicator.
6. **No hover-only affordances.** Everything reachable via tap.
7. **Pinch-to-zoom is supported on the shirt** but the rest of the UI uses fixed zoom.

## Drawing surface rules

- The shirt has a **drawable region** (the fabric of the torso) — defined by `shirt-drawable` clip path in the SVG asset
- Users can only draw inside this region; the brush is clipped at the boundary
- **No bounding boxes are shown on existing scribbles** — placed scribbles are part of the shirt now
- During *active* drawing, a soft purple border shows the user's *own* scribble box so they know the size constraint
- Min scribble size: 40×40 px (logical), Max: 300×300 px
- Zoom scale: 0.5× to 2.5× on the shirt canvas

## Voice notes

- Recorder button is a small mic on the scribble toolbar
- Recording is hard-capped at 12 seconds (`MAX_VOICE_DURATION_MS = 12_000` in `app/api/scribble/voice/route.ts`; the client mirrors the same cap)
- Encoded as Opus (~24kbps) for ~30KB per clip
- Playback is inline: tap the small audio badge on a placed scribble to hear it
- Voice notes are *attached to a scribble*, not standalone — every voice clip belongs to a visual scribble
- **Playback access (doc 08 round 2 decision 3)**: only the shirt owner + the scribbler themselves see a play button; everyone else sees a mute "🎙" icon

## Skin tone (replaces 5-swatch picker)

> Added 2026-05-21 — doc 08 round 2 decision

- Curated **continuous slider** 0–100; no raw color picker.
- Six anchor stops, linear interpolation between them:
  - `0`  → `#F6D7BF` light warm
  - `20` → `#E8BD92` fair/wheat
  - `40` → `#C98F63` medium tan
  - `60` → `#9F6747` medium brown
  - `80` → `#72442F` deep brown
  - `100` → `#4A2A1F` very deep brown
- Stored as `{ mode: 'slider', value: number, hex: string }`.
- Rendered into avatar SVGs via CSS variable `--skin-tone`.
- Disallows pure black, pure white, neon, or saturated fantasy colors by construction.
- Old `skinToneId` swatch-based configs are migrated to the nearest slider value on first load (compatibility shim in `lib/utils/skinTone.ts`).

## Anonymous scribbles (removed)

- ~~A "Sign anonymously" toggle existed in earlier UI plans~~ **CUT** — see doc 06 + doc 08 round 2 decision 2.
- Do not add anonymity UI anywhere in the signing flow.

## Animation principles

- **No spinners.** Loading states are paper-skeleton shimmers with the same paper texture as the surface they replace.
- **Confetti only on milestones** (first scribble received, 10th, 50th, deadline reveal).
- **Page transitions are slow and soft** (200–300ms). Quick snappy transitions feel app-y; we want nostalgic.
- **The deadline ceremony** is the only "big moment" animation — saved for [revisit-later](./06-revisit-later.md).

## Empty states

Every list view has an empty state that:
- Uses paper-note styling
- Shows a single hand-drawn doodle (smiley, sparkle, paper plane)
- Has one line of warm copy in Caveat
- Has one clear next action as a `pencil-button`

Examples:
- Dashboard with no signers: *"Your shirt is fresh. Share your link to get the first scribble!"* + Share button
- Empty notifications: *"No notifications yet — your friends haven't found you here."* + Find classmates
- Empty groups: *"No groups yet. Make one for your hostel wing or class."* + Create group

## What we don't do

- No dark mode (would break the paper metaphor)
- No gradient buttons (paper doesn't gradient)
- No emoji-as-UI-icons (we use Lucide icons + handwriting for emotion)
- No drop shadows beyond `shadow-sm` (paper is flat)
- No animated GIFs (battery + bandwidth on phones)
