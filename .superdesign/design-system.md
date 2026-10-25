# Scribbl — Design System v3 "The Collegiate Volume"

> **Status:** NEW. Replaces the Sunlit Lawn theme (`docs/18-sunlit-lawn-theme-spec.md`) as the
> design source of truth for all new work. Sunlit Lawn's tokens remain in the code until the
> migration lands; do not mix the two systems in one surface.
>
> **Token source of truth:** `.superdesign/collegiate-volume.css` — a complete, copy-pasteable
> `:root` token block + type ladder + component styles implementing this document. **It
> supersedes `app/globals.css`** for this direction. Do not mix the two token sets in one
> surface; where the legacy file still defines `--paper-*`, `--ink-*` or `--brand`, the legacy
> values win in shipped code until the migration lands, but no new design work may use them.
>
> **Decision record:** the previous theme applied a handcrafted treatment to the product *chrome*
> (nav, buttons, cards, empty states, error states) as well as to the *content* (the signed
> shirt). Because handcraft was everywhere it had no contrast, every heading competed with
> every other heading, and the app had no visual silence. This system splits the two.

---

## 1. Product context

**Scribbl** is a digital yearbook for Indian colleges that have no yearbook tradition. Students
get a virtual T-shirt; classmates sign and scribble on it during a one-month ritual
("Scribble Day"); on 30 November the shirts are locked and the app becomes the yearbook
itself.

**The two acts (one product, two visual systems):**

| | Act I — Scribble Day | Act II — The Yearbook |
|---|---|---|
| When | now → 30 Nov | from 30 Nov |
| What it is | a ritual you perform | an artifact you keep |
| Metaphor | the workbench | the bound volume |
| Surface | app chrome + signing studio | the book (cover → spreads → index) |
| Handcraft | inside the fabric only | inside the fabric only |

**Key pages:** `/` landing · `/onboarding` · `/dashboard` (my shirt) · `/explore` (directory of
shirts) · `/profile/[userId]` (a friend's signed shirt) · `/shirts/[shirtId]/scribble` (the
signing studio) · `/groups` · `/settings` · `/yearbook` (the book) · `/activity` · `/admin/*`

**Key features:** virtual shirt + avatar · Fabric.js signing canvas (draw / shape / sticker /
handwriting / highlight) · approval queue · shirt visibility (open / circle / approval) · safety
block & report · friend groups with invite tokens · realtime scribble presence · yearbook grid +
high-res export · admin platform settings (scribbling kill-switch, deadlines)

**JTBD:** *"When my class graduates, I want my friends' handwriting on something I keep
forever, so the goodbye feels like a real goodbye and not a group chat that scrolls away."*
Secondary: *"I want my yearbook to look like the yearbook I never got."*

---

## 2. Design principles

1. **Handcraft is content, never chrome.** Marker strokes, handwriting, doodles, stickers and
   wobbly outlines exist **only on the fabric and inside a signed shirt**. Navigation, buttons,
   forms, empty states, error states and lists are quiet, precise, and typographic.
2. **Three type roles, large contrast.** A high-contrast serif for display, a neutral grotesque
   for UI/body, a mono for captions and metadata. Never more than three families in chrome.
3. **A printed page, not a scrolled feed.** The yearbook reads in spreads and has page numbers,
   section identifiers and an index. Reading order replaces scroll order.
4. **Rarity carries value.** Gold appears on the cover title, section numbers, page numbers,
   index references and one seal — nowhere else. The accent is scarce because it is foil.
5. **The grid is the ornament.** Regularity is what makes a yearbook feel expensive. One
   6-column grid, one gutter, one hairline rule, uniform portrait cells.
6. **Names live below portraits, never inside them.** Every cell in a grid is the same size and
   the name sits in a fixed position under it, so a hundred faces read as a directory, not a
   scrapbook.

---

## 3. Color

### 3.1 Core tokens (single source of truth — use these, and only these)

```
/* Ink — text and near-black surfaces */
--ink-900:  #16130F   /* primary text, buttons */
--ink-700:  #3D3730   /* secondary text */
--ink-500:  #6E655B   /* tertiary text, metadata */
--ink-300:  #A79E92   /* muted captions, disabled */

/* Navy — the book ground, deep surfaces, duotone */
--navy-900: #121A2B   /* yearbook cover, section pages, footer */
--navy-700: #1E2A42
--navy-500: #33415E
--navy-300: #5A6B8C

/* Paper — cream stock */
--paper-50:  #FAF7F0   /* app background */
--paper-100: #F4EFE3   /* cream stock, book interior */
--paper-200: #E8E0CE   /* deeper cream, rules on cream */
--paper-300: #D8CDB4

/* Gold — foil. RARE. See principle 4. */
--gold-600: #A8871B   /* foil on light ground */
--gold-500: #C9A227   /* foil on dark ground */
--gold-300: #E3C766   /* foil highlight / gradient top */

/* Rules — hairlines, not shadows */
--rule:        rgba(18, 26, 43, 0.12)
--rule-strong: rgba(18, 26, 43, 0.24)
--rule-on-dark: rgba(244, 239, 227, 0.20)

/* Status */
--success: #2F6B3C
--warning: #9A6510
--danger:  #B3261E
--info:    #1E3A5F
```

### 3.2 Canvas-only palette (never used in chrome)

These eight colors are the **product's content** — what students draw with and what a signed
shirt looks like. They appear on the fabric, on a shirt thumbnail, and on a scribble swatch.
They are **not** UI accents and must not be used for buttons, badges, toasts or links.

```
--marker-black:  #2D2923    --marker-red:    #E8453C
--marker-blue:   #2563EB    --marker-green:  #5F8B48
--marker-purple: #7C3AED    --marker-orange: #EA580C
--marker-yellow: #D97706    --marker-teal:   #0891B2
```

### 3.3 Usage rules

- **One accent per surface.** Gold *or* a status color, never both.
- **Status colors are semantic only** — never decorative.
- **No gradients on flat UI.** The only permitted gradient is the foil sheen on the cover
  title and the seal.
- Body text on `--paper-50` must be `--ink-900` (contrast ≥ 12:1). `--ink-500` is for metadata
  only (≥ 5.4:1). `--ink-300` is disabled/placeholder only — never a caption on white.
- Gold on `--paper-50` (`--gold-600`) is for rules and small caps only, never for text on white
  (it fails contrast). Gold text is for dark grounds only.

---

## 4. Typography

### 4.1 Families

| Role | Family | Source | Where |
|---|---|---|---|
| Display | **Fraunces** (variable, 9pt optical, `SOFT` 0, `WONK` 0) | `next/font/google` | cover title, section titles, page titles, the year |
| UI / Body | **Inter** (400/500/600) | `next/font/google` | everything else — UI, body copy, names, buttons |
| Caption / Metadata | **IBM Plex Mono** (400/500) | `next/font/google` | captions, page numbers, section labels, eyebrows, metadata, index |
| *(content only)* | Caveat · Patrick Hand · Permanent Marker | `next/font/google` | **the fabric only** — handwriting on a shirt, a signed name, a doodle. Never in chrome. |

### 4.2 The type ladder — implement these as real utility classes

The current app has no role-based type classes, so every page invents its own scale. These six
are the only sizes that exist.

| Class | Family | Mobile | Desktop | Weight | Tracking | Line-height | Use |
|---|---|---|---|---|---|---|---|
| `.t-display` | Fraunces | 44px | 64px | 500 | -0.02em | 1.0 | cover title, the year, one per screen |
| `.t-title` | Fraunces | 28px | 38px | 500 | -0.015em | 1.15 | page title, section title, card title |
| `.t-heading` | Inter | 17px | 19px | 600 | -0.01em | 1.3 | sub-heading, list group label |
| `.t-body` | Inter | 15px | 16px | 400 | 0 | 1.55 | paragraphs, form labels, list copy |
| `.t-caption` | IBM Plex Mono | 11px | 12px | 400 | 0.08em | 1.4 | captions under images, program lines, table cells |
| `.t-micro` | IBM Plex Mono | 10px | 10px | 500 | 0.14em | 1.2 | eyebrows, page numbers, section IDs, **always uppercase** |

### 4.3 Rules

- **A page has at most one `.t-display`.**
- Serif is for display and titles only. Never for body copy, form labels, or UI.
- Body copy never exceeds 68 characters per line; never centre a paragraph of more than 4 lines.
- Mono is always uppercase for labels and always tracked `0.08em` or wider.
- Do not use font-weight below 400 for any text under 16px.

---

## 5. Spacing, radius, elevation, grid

### 5.1 Spacing — 4px base, one scale

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`

No other values. No `p-5`, no `gap-7`, no `mt-11`. Section rhythm: 16 inside a component,
24 between components in a group, 48 between sections, 96 between acts.

### 5.2 Radius — uniform, 3 values

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 2px | buttons, inputs, chips, small controls |
| `--radius-md` | 4px | cards, panels, table cells |
| `--radius-pill` | 999px | pills, avatars, badges |

**Retired:** `rounded-sketch-sm/-/-lg/-xl` and the hand-drawn radii baked into `.sketch-panel`,
`.sketch-panel-flat`, `.pencil-button`, `.paper-note`. Wobbly outlines survive **only** on the
shirt silhouette and on strokes drawn by users.

### 5.3 Elevation — paper, not drop shadows

```
--shadow-card: 0 1px 2px rgba(18, 26, 43, 0.06)
--shadow-lift: 0 8px 24px rgba(18, 26, 43, 0.10)
--shadow-book: 0 2px 6px rgba(18, 26, 43, 0.08), 0 18px 40px rgba(18, 26, 43, 0.14)  /* the bound volume */
```

Only three shadows exist. `shadow-xl` / `shadow-2xl` are retired.

### 5.4 Grid

- 6 columns · 24px gutter · max content width **1200px** (`--page-max`)
- Page margins: 20px mobile, 32px tablet, 48px desktop
- **Hairline rules** (`--rule`, 1px) separate sections. Do not use bordered cards where a rule
  would do.
- A **portrait cell** is 3:4, with the name in a fixed 44px band beneath it.
- Page numbers and section identifiers sit in the **outer top corner**, 11px, mono, tracked.

---

## 6. Components

### 6.1 Buttons

```
.btn-primary    ink-900 ground, paper-100 text, radius 2, 44px min height, 600 weight
.btn-foil       gold gradient ground, navy-900 text, radius 2, 44px min height  (≤1 per view)
.btn-ghost      transparent, ink-700 text, 1px --rule border on hover
.btn-quiet      transparent, ink-500 text, no border
```

No hand-drawn outline. No pill shape on desktop. Min tap target 44×44. Hover changes ground by
one step, never a sketch border.

### 6.2 Forms

- Label above input, `.t-body`, `--ink-700`
- Input: 1px solid `--rule-strong`, radius 2, 44px high, `--paper-50` ground
- Focus: 2px `--ink-900` ring at 2px offset — **no colour shift, no glow**
- No wave underline, no animated pen stroke. `InkUnderline` is retired.
- Error: 1px `--danger` border + `.t-caption` in `--danger` below the field

### 6.3 Surfaces

- Card: `--paper-50` ground or white, 1px `--rule` border, radius 4, `--shadow-card`
- A section of a page is usually **not** a card. Use a hairline rule + heading + content.
- `EmptyState` renders **without** the paper-note treatment: centred, `.t-title`, 64px gap,
  optional 1 action, no doodle, no emoji.

### 6.4 Icons

lucide-react, 1.5px stroke, 20px in UI and 16px inline. **No emoji as UI icons.** Emoji belongs
on the fabric and in sticker content only.

### 6.5 Navigation

**Act I (app):** a single top bar — wordmark left, 4 links centre (on desktop), notification
bell + avatar right. On mobile, the existing 5-slot bottom bar stays, but restyled: 64px tall,
radius 0, 1px top rule, icon 22px, label `.t-micro`, active state = `--ink-900` icon + label,
inactive = `--ink-500`. The centre CTA is a **flat ink-900 circle**, no lift shadow.

**Act II (book):** navigation becomes the book's. A top band carries the section name and the
page number; a section index replaces the tab bar. Page-turn, not tab-switch.

### 6.6 The signing studio

- The shirt sits on a **flat `--paper-50` field** with one soft shadow — it is the only lit,
  the only elevated, the only saturated object on screen.
- The toolbar is a single flat white panel, 1px `--rule`, radius 4. No sketch panel.
- Marker swatches are the only place the 8 canvas colours appear.
- Permission state is a single `.t-caption` line in mono, not a speech bubble.

---

## 7. Act II — The Yearbook: page architecture

The yearbook is a **bound volume**. The user turns pages; they do not scroll a feed.

### 7.1 Page sequence

1. **Cover** — navy ground, gold foil title, the year in Fraunces, school name in mono caps, one
   hairline gold rule. The only full-bleed navy surface in the product.
2. **Section landing** — navy, section number in gold mono (`§ 02`), section title in Fraunces,
   one line of context. Announces a section, then moves on.
3. **Spread** — two facing pages on cream stock. Left = one dominant signed shirt (fills ~⅔ of
   the spread, allowed to cross the gutter). Right = the portrait grid.
4. **Your page** — your own shirt large on the left, your message on the right, then
   *Signed by* — a two-column directory of names, each with a sample of their actual
   handwriting in the content font.
5. **Index** — alphabetical, two columns, mono, page references in gold.
6. **Colophon** — a small mono page crediting the class, printed on cream.

### 7.2 The portrait grid — the signature element

Every cell is **a signed shirt**, not a photograph. This is the product's one genuinely
original idea: an autograph page where each entry is a friend's handwriting.

Cell spec:
- 3:4 aspect, uniform. 1px `--rule-strong` border, `--paper-100` mat, radius 0.
- The shirt fills the cell; the signed marks are visible at thumbnail size.
- **Name below the cell**, `.t-caption`, uppercase, tracked, `--ink-900`.
- Program line beneath the name, `.t-body` 12px, `--ink-500`.
- 4 columns × 3 rows per page on desktop; 2 columns on mobile.
- **All cells identical size.** A grid that varies reads as a scrapbook, not a directory.
- Cells are ordered by batch, then alphabetically — never by "most scribbled first".

### 7.3 Gold discipline in the book

Gold appears on: cover title, section numbers, page numbers, index references, and one seal on
the colophon. **Nothing else.** If gold appears on two elements in one spread, one of them is
wrong.

### 7.4 Portraits and duotone

Where a real photo is used (avatar in the grid, if the student uploaded one), render it in
**navy duotone** — the same two inks as the cover — so the whole book prints as one object.

---

## 8. Motion

| Kind | Duration | Easing | Example |
|---|---|---|---|
| State | 120ms | `cubic-bezier(0.2, 0, 0, 1)` | hover, focus, pressed |
| Enter | 240ms | `cubic-bezier(0.2, 0, 0, 1)` | panel, list item, sheet |
| Page turn | 320ms | `cubic-bezier(0.2, 0, 0, 1)` | yearbook page change |
| Draw | user-paced | — | the user's own marker stroke |

**Retired:** `badge-bounce`, `attention-wiggle`, `stamp-land` overshoot, `paper-shimmer`
skeleton pulse, the PencilLoader ink loop. No bounce, no wiggle, no wobble in chrome.

**Skeleton:** a 1px `--rule` shimmer sweep on a `--paper-200` block. It must not pulse opacity.

**Reduced motion:** `prefers-reduced-motion: reduce` collapses every duration to 0ms
globally, including the framer-motion countdown. This is a hard requirement — the current
`CountdownTimer` violates it.

---

## 9. The transition (30 November)

The changeover should read as *the same product opening a book*, not as a skin swap.

- Act I chrome fades to Act II chrome; the app background `--paper-50` deepens to `--paper-100`.
- The shirt grid on `/yearbook` becomes the portrait grid; the same cells, restyled.
- The bottom nav becomes a section index.
- The countdown chip becomes the gold seal.

---

## 10. Retired — do not reintroduce

`rounded-sketch-*` · `.sketch-panel` · `.sketch-panel-flat` · `.pencil-button` · `.paper-note` ·
`.sticker-note` · `.paper-note-tape` · `DriftingDoodles` · `HeroStickerNotes` · `AvatarHalo` ·
`HandDrawnArrow` · `AsteriskDivider` · `PlaceBackground` illustrations · `InkUnderline` ·
`InkCheckbox` · `PencilLoader` · `StampSuccess` (restyle as a gold seal, keep the idea) ·
`text-display` / `text-eyebrow-display` / `text-handwritten-note` / `text-nostalgia` in chrome ·
emoji as UI icon · `bg-amber-600` CTAs · `bg-green-500` / `bg-red-50` approve-reject buttons ·
stock green/red/amber/blue toast tones · `text-ink-800` (undefined token) · `text-meta` /
`text-body` (undefined — replace with `.t-body` / `.t-caption`) · `--ink-300` as a caption
colour on white.

---

## 11. Hard constraints for any generation

1. **Use ONLY the fonts, colours, spacing, radius, shadow and component styles defined in this
   document.** Do not introduce fonts, colours, gradients, radii, shadows or visual styles not
   defined here. In particular: no new font families, no purple/violet, no amber, no pink, no
   emoji as icons, no hand-drawn borders, no sketch radii.
2. The **only** gradients permitted are the foil sheen on the cover title and the seal.
3. The marker palette is **content only** — never a button, badge, toast, link or accent.
4. **Gold is rare.** At most one gold element per screen; on a spread, at most two per spread.
5. Body copy is never centred. Names are never inside a portrait crop.
6. Every grid cell is the same size. Every page has a page number in the outer top corner.
7. Handwriting fonts appear **only** on the fabric or on a user's actual signature.
8. Spacing is 4/8/12/16/24/32/48/64/96. Radius is 2/4/999. Shadows are the three listed.
9. Type roles are the six listed classes. A screen has at most one `.t-display`.
10. Every interactive element needs a visible focus ring (`2px --ink-900`, 2px offset) and a
    44×44 minimum target.

---

## 12. Refinements from the first build round (2026-10-20)

Added after generating the cover, the spread, the section landing, the personal page and the
profile page. These refine §3, §7 and §11 — they do not replace them.

- **Cover gold exception.** On the cover, **two** gold elements are correct: the foil wordmark and
  the foil year. A foil-stamped title plus a foil year is how a real collegiate cover is made.
  The one-gold rule still holds on every other page.
- **Pull-quote.** The spread's left page carries a pull-quote: a 1px ink hairline, one line in the
  display serif at 24px, max two lines, then a mono attribution. It is the **only** place the
  display serif appears on a spread.
- **Caption rows never wrap.** On a spread caption, the name (body sans, semibold, 14px) and the
  stats (tracked mono caps) each sit on one line in their own column.
- **The handwriting samples are load-bearing.** On the personal page, every entry in the *Signed by*
  directory pairs a name with a sample of that person's own actual handwriting, stacked beneath the
  name. Never drop them, and never let a name and its sample collide.
- **Portrait-grid names are single-line.** If a name will not fit on one line, reduce tracking and
  size before allowing a wrap.
- **Marks live on the fabric.** A signed T-shirt's marks are drawn on the white shirt shape,
  inside its outline, clipped to it — never on the mat or the card behind it. Draw order: shirt
  fill, then marks, then outline stroke last so the outline stays crisp.
- **No photographs, ever.** Every person in the product is a flat vector illustration. A stock
  photo, a real face, an emoji avatar, or an initials placeholder in place of an avatar is a
  defect, not a choice.
- **Avatar drawings must be consistent.** The hero, the top-bar avatar and the activity-row
  thumbnails are the same flat illustrated avatar in different crops.

