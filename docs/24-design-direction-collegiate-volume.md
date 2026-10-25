# 24 — Design Direction: "The Collegiate Volume"

> **Status:** Direction. Produced 2026-10-20 after the 2026-10-17 whole-app audit.
> **Supersedes** `docs/18-sunlit-lawn-theme-spec.md` (Sunlit Lawn) as the *target* visual system.
> Sunlit Lawn's tokens stay in the code until each phase below is migrated.
>
> **Artefacts**
> - Design system: `.superdesign/design-system.md`
> - Token + type + component stylesheet: `.superdesign/collegiate-volume.css`
> - Canvas (7 generated pages): `https://superdesign.dev/teams/87d45a2f-6fbc-4397-b672-d6599b831c27/projects/d46914b3-2b4e-47f1-9d20-c00ddff0847d`

---

## 1. Why the current UI feels wrong

The audit found the app is *correctly built* and *feels wrong*. The reason is not palette or
craft quality — it is **layering**.

Sunlit Lawn applies a handcrafted treatment to the product **chrome** (nav, buttons, cards, empty
states, error states, section dividers) as well as to the **content** (the marks on a shirt). Three
consequences:

1. **No visual silence.** Whiteboard, sketch panels, sticker notes, drifting doodles, hand-drawn
   radii, paper texture, Caveat headings — all at the same emotional pitch. There is no "rest" in
   the layout, so nothing reads as a heading, a label, or a resting place.
2. **The type ladder doesn't exist.** `.text-body` and `.text-meta` are specified in doc 18 §9 and
   **defined nowhere**; `text-meta` is used in production at `app/explore/page.tsx:196`. Every page
   therefore invents its own scale in raw Tailwind. Three handwritten families (Caveat, Patrick
   Hand, Permanent Marker) compete for the same job at the same weight.
3. **The product's own palette is spent on the UI.** The eight marker colours are *content* — what
   students draw with — and they are also used as toast tones, badges, approve/reject buttons and
   progress fills. The one thing that should feel special is everywhere.

**The fix is a demotion, not a repaint.** Handcraft moves *inside* the fabric. The chrome becomes
quiet and typographic, so the handcraft reads as handcraft.

---

## 2. The product already has two acts — give them two systems

Scribbl is a ritual that becomes an artifact. That structure was never expressed visually.

| | Act I — Scribble Day | Act II — The Yearbook |
|---|---|---|
| When | now → 30 Nov | from 30 Nov |
| What it is | a ritual you perform | an artifact you keep |
| Metaphor | the workbench | the bound volume |
| Handcraft | inside the fabric only | inside the fabric only |
| Chrome | quiet, typographic, one accent | printed: spreads, folios, index |
| Ground | `--paper-50` warm white | `--navy-900` cover, `--paper-100` cream stock |
| Navigation | bottom tab bar | a section index; reading order, not scroll order |

**The yearbook is not a page with a yearbook theme. It is a bound volume the user turns.** The
single most important change: *reading order replaces scroll order.*

---

## 3. The one idea worth owning

A US college yearbook's signature element is the **portrait grid** — hundreds of faces in
identical cells, the name below each, ordered so it reads as a *directory*, not a scrapbook.

Scribbl's version: **every cell is a signed T-shirt instead of a photograph.** An autograph page
where each entry is a friend's actual handwriting. That is the product's genuinely original idea
and it is the reason the yearbook phase should look like a yearbook rather than a feed.

The **Your Page** variant is where it becomes emotional: each name in the *Signed by* directory is
paired with a sample of that person's **actual handwriting**, in marker ink, stacked beneath the
name. Never drop those samples — they are the point.

---

## 4. The visual key (classic collegiate)

- **Ground:** deep ink navy `#121A2B` for the cover and section dividers; cream stock `#F4EFE3`
  for the book's interior; warm white `#FAF7F0` for the app.
- **Accent:** gold foil `#C9A227` — **rare by rule.** Cover title and year, section numbers, folios,
  index page references, and one seal. Nowhere else. Rarity is what makes foil read as foil.
- **Type:** three families, never four in chrome.
  - **Fraunces** (display) — cover, section titles, page titles, pull-quotes
  - **Inter** (UI/body) — everything else
  - **IBM Plex Mono** (caption/metadata) — eyebrows, folios, names in grids, labels
  - *Caveat / Patrick Hand / Permanent Marker* — **content only**: the fabric and a user's own
    signature. Retired from all chrome.
- **Structure:** a 6-column grid, 1px hairline rules instead of bordered cards, square corners,
  4/8/12/16/24/32/48/64/96 spacing, three shadows in the whole system.

---

## 5. Type ladder — the thing that does not exist today

Six roles. Implement them as real utility classes (`.t-display` … `.t-micro`); every page then
stops inventing its own scale.

| Class | Family | Mobile | Desktop | Use |
|---|---|---|---|---|
| `.t-display` | Fraunces | 44 | 64 | cover title, the year — one per screen |
| `.t-title` | Fraunces | 28 | 38 | page title, section title, card title |
| `.t-heading` | Inter | 17 | 19 | sub-heading, list group label |
| `.t-body` | Inter | 15 | 16 | paragraphs, form labels, list copy |
| `.t-caption` | IBM Plex Mono | 11 | 12 | captions, programme lines, grid names |
| `.t-micro` | IBM Plex Mono | 10 | 10 | eyebrows, folios, section IDs — uppercase |

---

## 6. What the canvas contains (7 pages)

| Page | Device | What it proves |
|---|---|---|
| **Yearbook — Cover** | mobile | Navy + gold foil collegiate identity. Foil wordmark and foil year. |
| **Yearbook — The Spread** | desktop | The signature idea: a 2×3 portrait grid where every cell is a signed shirt, names below, uniform cells, plus a feature page with a pull-quote. |
| **Yearbook — Section Landing** | desktop | Navy divider, gold `§ 02`, mono navigation row. |
| **Yearbook — Your Own Page** | desktop | The autograph page: your shirt, your name, your signature, and *Signed by* with each person's handwriting. |
| **App — Profile (quiet chrome)** | mobile | Act I: flat paper ground, hairline-ruled sections, mono section heads, one ink CTA, the shirt as the only elevated object. No sticker notes, no doodles, no whiteboard, no illustrated campus. |
| **App — The Gallery** *(branch)* | mobile | Structure B: full-bleed hero, no cards at all, every section a ruled row. |
| **App — The Record** *(branch)* | mobile | Structure C: an archival register. Running head, ruled key-value rows, a compact right-aligned CTA, the shirt as a specimen with its key-values beside it. **Currently the strongest of the three.** |

---

## 7. What gets retired

`rounded-sketch-*` · `.sketch-panel` · `.sketch-panel-flat` · `.pencil-button` · `.paper-note` ·
`.sticker-note` · `.paper-note-tape` · `DriftingDoodles` · `HeroStickerNotes` · `AvatarHalo` ·
`HandDrawnArrow` · `AsteriskDivider` · `PlaceBackground` illustrations · `InkUnderline` ·
`InkCheckbox` · `PencilLoader` · `StampSuccess` (restyle as a gold seal, keep the idea) ·
`text-display` / `text-eyebrow-display` / `text-handwritten-note` / `text-nostalgia` in chrome ·
emoji as a UI icon · `bg-amber-600` CTAs · `bg-green-500` / `bg-red-50` approve-reject buttons ·
stock green/red/amber/blue toast tones · `text-ink-800` (undefined token, 8 call sites) ·
`text-meta` / `text-body` (undefined) · `--ink-300` as a caption colour on white.

**Kept:** the `Whiteboard` — but as the *signing surface* in the studio, not as an announcement
board in the chrome. The whiteboard's information (e.g. "scribbled by 17 friends") becomes a plain
mono line in the new chrome.

---

## 8. Migration plan

**Phase 1 — Tokens (1–2 days).** Add the `:root` block from `.superdesign/collegiate-volume.css`
alongside the legacy one. Point `tailwind.config.ts` colors at `var(--paper-100)` etc. so the two
sources of truth collapse into one. Register Fraunces + IBM Plex Mono in `app/layout.tsx`. Add the
six `.t-*` classes. **This alone kills the undefined-token and duplicate-source problems from the
audit.**

**Phase 2 — Chrome (3–5 days).** Rebuild the shared shell: mount `AppShell` (it is currently
mounted by **zero** pages) and retire the eight hand-rolled headers. Restyle `BottomNav` to the
flat 64px bar. Replace `EmptyState` usage (it has **zero** importers today) across all four
hand-rolled empty states. Swap `InkUnderline` / `InkCheckbox` for quiet 1px-rule fields. Remove
emoji icons; use lucide at 1.5px.

**Phase 3 — Surfaces (1 week).** `/profile/[userId]`, `/dashboard`, `/explore`, `/groups`,
`/settings`, `/activity` — same content, new structure. Pick **The Record** or **The Gallery**
structure for the profile page; the audit's other findings (orphaned `/yearbook`, mobile-invisible
`/groups`, silent join failures) should be fixed in this pass, not after.

**Phase 4 — The book (2 weeks, can start now).** The yearbook phase is *new surface area*, not a
redesign, so it does not depend on the chrome migration. Build it on the new tokens directly:
cover → section landing → spread → your page → index → colophon. The `/api/yearbook/grid` and
`/api/yearbook/export` endpoints already exist.

**Phase 5 — The transition (1 day).** On 30 Nov the app becomes the book: the background deepens
from `--paper-50` to `--paper-100`, the tab bar becomes a section index, the countdown chip becomes
the gold seal. The yearbook grid becomes the portrait grid — the same cells, restyled.

---

## 9. Decisions still open

1. **Which app-chrome structure wins?** The Record (archival register) reads the most premium and
   fits the product's "keep it forever" promise; The Gallery reads the most modern/app-like. The
   Record currently wins on craft, The Gallery on familiarity.
2. **Does the yearbook ever show a photograph?** The design system specifies duotone navy portraits
   for real photos. The signed-shirt grid needs none. A student may have a face photo but no
   shirt — decide whether a face-only cell belongs in the grid.
3. **Dark mode.** The new system has a natural dark ground (`--navy-900`). Today there is no dark
   mode at all. The yearbook cover is already dark — is it a full theme, or one dark page in a
   light book?
4. **The `VOL. I` marker and the "official yearbook" framing** — is Scribbl positioned as *the*
   class yearbook (institutional, permanent) or as *a* digital yearbook (a keepsake)? The cover
   copy answers this, and it changes how formal the whole book should be.
