# 25 — Style Research & Direction Comparison

> **Status:** Direction discussion. 2026-10-20.
> **Supersedes** `docs/24-design-direction-collegiate-volume.md` (the navy + gold foil "Collegiate
> Volume" direction). Research below independently confirms that direction was wrong:
> *"Navy/gold foil is a print-cover convention; at screen scale it reads as costume."*
>
> **The short version:** two fully-designed, critic-scoring-12/12 directions already exist in this
> repo and **were never shipped.** The answer is not to design a third from scratch.

---

## 1. The headline finding

`design/` contains two complete, internally-consistent directions, each taken through four critic
rounds and a mechanical scan, both ending at "12 of 12 rubric lines at 5":

| | **C — House Colours** | **M — The Mixtape** |
|---|---|---|
| Where | `design/shots/r4/` (8 frames) | `design/shots/concepts2/` (3 frames) |
| Grammar | field/light/condensed/warm/colour-material | media/dark/mono+hand/orange/shape |
| Ground | the student's fabric colour (#E29A2E marigold) | near-black |
| Display type | Big Shoulders Display 800, uppercase | 28px mono display beat |
| Handwriting | Caveat — **only** for a friend's own words | Caveat — **only** for a friend's own words |
| Depth | hard offset `drop-shadow(9px 10px 0 rgba(25,20,16,.16))` | hard offset, same language |
| Signature | **"the shirt fills"** — the field deepens one step per mark | **"24 tracks, 17 friends"** — each scribble is a track |

**House Colours is the BounceBee × Softly combination the founder asked for.** BounceBee supplies
the hand-drawn-but-systemic craft (one device, hard offset shadows, Caveat for annotations only);
Softly supplies the warm ground, the grain and the air. It was already built, scored, and never
implemented — the shipped app is still Sunlit Lawn.

---

## 2. What the category actually does

Full research with sources in `docs/25-research-appendix.md` (to follow). The load-bearing findings:

### 2.1 The category is effectively **unoccupied**

- **No Indian college yearbook app exists.** Every "class yearbook" query returns US high-school
  print tooling or generic alumni-directory templates.
- **No consumer app exists where many people draw on one shared object and it persists as a
  keepsake.** The two nearest convergences are the *digital guestbook* (many contributors → one
  designed PDF) and *Excalidraw/FigJam* (many contributors, shared canvas). Scribbl sits in the gap
  between them.
- **Classmates** (470,000+ yearbooks online) is the closest shipped model: browse-first, no login,
  search by school + graduation year, nostalgia monetised through the *physical reprint*. The app
  is the doorway; the book is the product.

**There are no category conventions to inherit — only adjacent-category ones.** That is why
"generic" is such a risk here: generic is what you get when you copy a category that has no
category.

### 2.2 The lessons that actually apply

| # | Lesson | Source |
|---|---|---|
| 1 | **"The secret is not making everything too perfect."** Let images overlap slightly, turn one a few degrees, layer textures behind, add tape, stitching, ink marks, handwriting. | CraftGossip, *Digital Scrapbooking Is Back*, Aug 2026 |
| 2 | **Real material beats generic embellishment.** Scanned fabric, real handwriting, a faded ticket — always more interesting than a matched set of digital stickers. | same |
| 3 | **Handwriting is the warmth carrier.** "Your handwriting remains part of the finished page, which gives the layout the warmth that highly polished templates lack." | same (on Goodnotes) |
| 4 | **A repeated "theme carrier" device makes a 300-page object feel like one book** — a rule, a colour, a motif or a running head recurring at every section boundary. | Touchwall, *Yearbook Page Layouts* |
| 5 | **Design spreads, not pages.** The eye enters top-left and needs a clear path out. Balance is optical, not mathematical. | Touchwall |
| 6 | **Six-column grid, folio line, baseline grid.** The print discipline worth stealing. | Jostens School Annual |
| 7 | **Density is a section-level decision.** Dense rosters and generous feature spreads are both correct and must not share one spacing scale. | Touchwall |
| 8 | **Serial display + neutral grotesque is the proven "editorial but warm" pairing.** | The Yearbook (Cormorant Garamond + Karla) |
| 9 | **A global theme control is the signature moment** — one control that re-skins the whole book. | Dear Scrapbook ("Open Theme to restyle every page at once") |
| 10 | **Low-friction contribution beats an app download.** Scan, contribute in 20 seconds, no wifi, no install. | digital guestbook apps |
| 11 | **The physical object is the product; digital is the overlay.** | Jostens Yearbook+ |

### 2.3 What to avoid — and one of these is us

| Avoid | Why |
|---|---|
| **Navy + gold foil** | A print-cover convention. At screen scale it reads as costume. *(= the rejected doc 24 direction.)* |
| **Digitising print typography literally** | The transferable parts are grid, folio, theme-carrier and section template — not metallic gradients. |
| **Directory-as-yearbook** | The alumni-app norm (search → filter → profile card → message button) is what a class roster *feels like* when it isn't designed as an object. **This is the risk on `/explore` today.** |
| **High-saturation + heavy display type scrapbook** (Dear Scrapbook's `#d6295c` + Archivo Black) | The cheap reading of "handmade". Dates the product to a Pinterest-era aesthetic. |
| **Matching sets of generic embellishment** | Matching kits produce pages that feel computer-generated. |
| **2020-era neomorphism** (soft plastic) | Now "Neomorphism 2.0" — the original wave is the dated version. |
| **Sketchy-paper as a full-surface treatment** | Signals "handmade" without saying anything specific. *This is the current Sunlit Lawn.* |

### 2.4 The 2026 trend read, precisely

The current wave is **textural and material, not sketchy and cartoonish**. The differentiating
detail is *rotation, overlap, tape, grain, real handwriting* — not doodled borders and hand-drawn
icons on every control. Shortcut's 2025 UX/UI trends put it as: warm neutrals, organic shapes,
bento containers, physical dials and buttons returning, "encouraging users to linger."

**Scribbl's own version of this is the shirt.** A real fabric object, marked by real hands, in
real ink. That is more "material" than any of it.

---

## 3. Sunlit Lawn, diagnosed

Not a bug list — a design diagnosis. (Full table in the prior draft; the load-bearing items:)

| Element | Why it hurts | Fix |
|---|---|---|
| **Three handwritten display families** (Caveat, Patrick Hand, Permanent Marker) | They compete for the same job — *being a heading* — at the same weight and size. Nothing reads as a heading. | One display face, one body face. **Handwriting = content only.** |
| **No type ladder** (`.text-body` / `.text-meta` specified in doc 18 §9, defined nowhere) | Every page invents its own scale → incoherent page-to-page. | Six real utility classes. |
| **Two sources of truth for colour** (Tailwind config + globals.css, ~19 duplicated hex; doc 18 §219 instructs you to update both) | Drift is designed in. | One file. |
| **Two accent systems** — cream+violet in the app, `bg-amber-600` on landing/onboarding | Visitors meet a different brand at the door than returning users meet inside. | One accent. |
| **Four sketch radii + standard radii + pills + circles** | Shape carries no information. | One radius. |
| **Soft blurry shadows** | Everything floats. Nothing feels *made*. | **Hard offset shadows that press.** |
| **Doodles drifting in every page's corners** | Decoration with no job. The single most "cheap" signal in the app. | One theme-carrier device doing structural work. |
| **Sticker notes floating around the avatar** | Fake intimacy. The *real* notes are the content. | Real messages, rendered as handwriting on the fabric. |
| **The whiteboard used as an announcement board in chrome** | Carries handwriting into the chrome, where it does least good. | Whiteboard = the **signing surface**; elsewhere a hard-shadowed card. |
| **No signature device** | Nothing says "this is Scribbl". | **The field** (see below) + one stroke. |
| **Emoji as UI icons**, 10–11px meta, ~20px tap targets | Reads cheap at a glance, even when you can't say why. | lucide at 1.5px, 12px floor, 44px targets. |
| **Three loading idioms, three empty-state idioms** (`EmptyState` has **zero importers**) | Incoherent. | One skeleton, one empty state. |

**The pattern: the app has craft everywhere and hierarchy nowhere. Every element is handmade, so
handmade means nothing.** Research §2.2 lesson 4 names the missing piece exactly: a *theme carrier*.

---

## 4. The unifying idea

> **Each student picks a fabric colour. That colour becomes their ground — the field of every
> screen. It is the app's global theme, and it is a physical object (their shirt), not a skin.
> Every mark published deepens the field one step. When the class does it together, the whole app
> visibly fills with the class's colour.**

This is three proven things at once:

- **Dear Scrapbook's global theme control** (their "signature moment") — but earned, because the
  theme *is the data*, not a preset you pick from a menu.
- **The yearbook's theme carrier** (Touchwall) — the repeated device that makes a big object feel
  like one book. Here it is the field itself, plus one hand-drawn stroke.
- **"The shirt fills"** (House Colours) — the signature moment already designed, with its storyboard
  and its reduced-motion spec.

And it is the thing the category has no answer to. Dear Scrapbook sells you a theme; Scribbl
*earns* one from a ritual.

---

## 5. Candidates

All four keep the assets in §1 of the prior draft (whiteboard, illustrated shirt, marker palette,
place art, violet, handwriting register, the white-shirt premise).

### A. **House Colours + Softly's air** *(recommended)*
Warm field, Big Shoulders display, mono meta, Caveat only for a friend's words, hard offset
shadows, one radius, one theme-carrier stroke, grain, more air, lower-velocity motion. Tokens
written: `.superdesign/house-colours.css`.
*Borrowed:* BounceBee's craft discipline + Softly's warmth. *Proven:* 12/12 critic rounds.
*Cost:* the field is saturated; needs the Softly pass to stop shouting.

### B. **The Mixtape**
Dark, mono, orange, cassette reels, each scribble indexed as a track. A media object, not a
fabric one. *Proven:* 12/12, and it is the more premium-feeling of the two.
*Borrowed:* a different metaphor — the shirt is a tape, a scribble is a track.
*Cost:* loses the fabric, and the "last night of college outdoors" warmth; it reads more
nostalgic-media than ritual.

### C. **The Tactile Object**
Skeuomorphic controls: rockers, knurled dials, debossed meters, eggshell plastic on a warm putty
wall. The most *crafted* option and the most explicitly "you want to touch it."
*Cost:* high build cost, skeuomorphism dates, and it fights the fabric metaphor.

### D. **The Printed Annual**
Editorial serif on cream with a strict six-column grid, folios and running heads — the print
tradition done properly on screen. *Borrowed:* the research's grid/folio/section-template rules.
*Cost:* risks repeating the rejected direction in a warmer coat, and reads as "a magazine about
our college" rather than "an app my friends use".

---

## 6. Recommendation

**App (Act I): A — House Colours, with the Softly pass and the theme-carrier stroke.**
**Yearbook (Act II): A's system, at the volume of a loud nostalgic American yearbook.**

Act II is where the research is most actionable, because the print tradition's *transferable* parts
are exactly what the loud register needs:

| Print convention | How it becomes the digital yearbook |
|---|---|
| Six-column grid | The class grid, always 6 columns, never varying |
| Folio line + running head | Page number + section identifier in the outer corner |
| **Theme carrier** | The field colour, carried across every page |
| Section templates (candid / club / sports / portrait / recognition) | Our sections: *The Class · The Shirts · The Words · The Clubs · In Memoriam* |
| Portrait/class pages | **The signed-shirt grid** — one uniform cell per student, name below |
| Superlatives, most-likely-to pages | "Most likely to sign your shirt before 2am" |
| Closing spread + index | The index, in the field's colour |

**Never the literal print aesthetic** (no navy, no foil, no metallic gradients) — only its
*structure*.

---

## 7. Open decisions

1. **A, B, C or D for the app?** My read: A. B is the more premium and the more distinctive, and
   the two are not mutually exclusive at the token level — the field system and the mono/orange
   system can coexist if the field is a *dye* rather than a flat colour.
2. **Does the violet survive?** House Colours has no violet. It could become one of the available
   fields, or stay the brand colour for the logo and auth only.
3. **How many fields?** Marigold, cobalt, forest, oxblood, night are designed. Is the field
   user-chosen (like a T-shirt colour) or class-assigned?
4. **Does the field deepening survive the yearbook?** "The shirt fills" is a live, present-tense
   mechanic. In a locked, printed yearbook, does the field still deepen with the total marks?
5. **Is the doodle library retired outright** in favour of the theme-carrier stroke?
6. **Act II's loudness** — is it the *class-yearbook* kind (two colours, a banner, superlatives, a
   mascot) or the *festival-poster* kind (a fully decorated page per section)?

---

## 8. Next research step

The category pass recovered the **rules** of yearbook page design but not the **visual** reference.
Before building Act II, capture actual 2020s yearbook spread images (Jostens Look Book, Touchwall
template gallery, Walsworth/Herff Jones showcases) so the spread composition is copied from real
pages rather than from a description of them.
