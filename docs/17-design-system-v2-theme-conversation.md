# 17 — Design System v2: Theme Lock-In Conversation

> Triggered 2026-05-21 by the user: *"I need this UI to be portfolio-grade. Scaler AI Product Designer Intern role. Asked PD and his Design Manager to discuss, lock the theme."*
>
> This doc is the conversation. The bottom of the page has the decision request.

## Stakes (so we're honest with ourselves)

- **Audience for the portfolio piece**: an AI Product Designer Intern hire. The reviewer is a working designer who has seen 200 Notion clones this week. They can tell the difference between *taste* and *templates* in three seconds.
- **What "good" looks like**: one screenshot they screenshot and send to their manager. One sentence they remember a week later. A design language with enough conviction that it doesn't look like "what AI builds for free."
- **What "bad" looks like**: pleasant cream-paper SaaS dashboard with a cursive headline. Reviewer recognises it as "AI handdrawn theme #4," moves on.

The current Scribbl ships somewhere between those two. The foundation is real, the execution doesn't yet carry the conviction. This doc is about closing that gap.

## Audit: is Scribbl actually hand-drawn?

Yes in the *primitives*. No in the *layout language*. Here's the precise read:

### What's working

- **Typography pairing.** Caveat (display) + Patrick Hand (hand) + Inter (body) is a defensible, characterful pairing. Loaded via `next/font/google` in `app/layout.tsx`, no font swap flicker.
- **`sketch-panel`.** `border-radius: 18px 16px 20px 15px` reads as torn paper. Soft inset highlight + low shadow. Quietly correct.
- **`paper-note-tape::before`.** 14 lines of CSS for a yellow washi-tape pseudo-element rotated −3°. This is the strongest piece of craft in the system.
- **`pencil-button`.** Repeating diagonal `repeating-linear-gradient` at −12° gives the "soft pencil shading" texture. Hovers lift 1px. Most apps would have shipped a flat button here.
- **`.scribble-underline`.** A single purple gradient stripe under headings. Sparing, on-brand.
- **`avatar-glow`.** Soft radial purple vignette under the avatar. The closest the app gets to a true "hero moment."
- **`page-skeleton-as-paper`.** Shimmer using paper-300 instead of grey. Tiny win, very on-brand.
- **The 12 sticker SVGs** in `src/assets/scribbl/stickers/` (hand-drawn arrow, bear-doodle, crown, fire, flower, heart, lightning, paper-plane, smile, sparkle, speech-bubble, star). These are real assets. Underused.

### What's drifting or missing

- **Composition is a SaaS dashboard.** `app/dashboard/page.tsx` is rectangular cards in a grid, ordered top-to-bottom. The avatar (the brand hero) lives below the fold on a 1440 display. The PD review (`docs/14 §3`) called this out: *"Reads as a SaaS dashboard with a shirt embedded, not a shirt with a frame."*
- **Hand-drawn elements stop at the chrome.** Buttons, borders, underlines have texture. *Inside* the panels: standard SaaS text + Lucide icons + 1px dividers. No marginalia, no doodled arrows between sections, no hand-set page numbers, no torn-paper edges, no asterisk dividers, no paper-clip ornaments.
- **One Caveat size, used everywhere.** `font-display text-2xl font-bold` for every section H2 (PD review §4 counted seven on the dashboard). When everything shouts in cursive, nothing sounds like cursive.
- **No editorial typography moments.** Patrick Hand barely appears outside scribble previews. Caveat is never used at hero-scale (60–96px). There's no body-set-in-display tension that makes typography sing.
- **Color is paper + ink + one purple.** This is *correct* for a restrained product, but for a portfolio piece it's also the safest possible move. The yearbook scrapbook the product is supposed to feel like has *photos, tape, postcards, ticket stubs, washi colors, polaroids* — none of which are in the visual language right now.
- **No layered surfaces.** Every panel is `bg-white/85` on `paper-100`. A real notebook has graph paper sometimes, ruled paper sometimes, kraft paper sometimes, polaroid backing sometimes. We have one paper.
- **Imperfection is implied, not executed.** The asymmetric border-radius does this work alone. There's no strategic 1–3° rotation on cards/stickers, no slight margin offsets, no pencil-smudge selected states, no real "hand-placed" feel.
- **The avatar centerpiece is undersold.** It's an SVG on a `.sketch-panel`. It should be the *moment*: torn-polaroid frame, washi tape on two corners, scribbled name in Caveat 64px below it, hand-drawn arrow pointing at the share CTA. That's the screenshot.

**One-line verdict**: Scribbl has the primitives of a hand-drawn product. It does not yet have the *layout grammar* of one. The portfolio piece is in the gap.

## Senior Product Designer (Maya Patel) speaks

> Tone: practical, ships-oriented, knows what's drift vs intent. Voice from `docs/14`.

I scored coherence at 6/10 in the original review and I stand by it. The foundation is correct. What's missing is conviction.

Look at where Scribbl earns its identity right now: the wordmark, the paper-note-tape, the sticker-reaction triad. Three small assets carry the entire feel. Every other surface is generic. The cream paper background is doing the work of "hand-drawn aesthetic" because nothing inside the panels is. Strip the cream and Caveat away and the dashboard is a Vercel template.

What I'd protect: the asymmetric corners, the washi tape, the scribble-underline. These are subtle and right. Don't let "make it more crafted" turn them into chaos.

What I'd push: the *one screenshot that ships the brand*. Right now there is no such screenshot. The avatar deserves to be that moment. Treat it like the cover of a yearbook page, not a card on a dashboard. Tape, frame, scribbled name, arrow to the CTA. Three or four genuine details around it.

I'd also push on typography. Caveat at 2xl is just "cursive headline." Caveat at 72px set off-grid against a smaller Inter line below it is **typography**. We have a casual hand-drawn display font and we are using it at the same size as the section H2s. That's the cheapest possible application of a beautiful font.

I disagree with anyone who says "more is more" on the maximalist axis. We need *one or two* additional paper textures, not five. Graph paper for one specific surface, ruled paper for another. Not everywhere. The hierarchy has to stay legible.

My recommendation: pick the *fewest* additional moves that ship the most identity, and execute them with surgical precision.

## Design Manager (Aiden Park) speaks

> Tone: more strategic, willing to push beyond product-thinking. Cares about identity and memorability over component reuse.

Maya is right about precision, and she's underselling the gap.

Here's the problem. The cream-paper-notebook lane is **saturated**. Run a category-reflex check: a hiring manager sees "student farewell app + cursive font + cream background" and their brain finishes the sentence with "yeah, I've seen this aesthetic." That's the first reflex. Then they see "stickers + paper-note-tape" and the second reflex kicks in: "this is the well-executed version of that aesthetic." Both reflexes mean the work is not memorable, even when it's well-made.

You don't win a portfolio role by being the most polished version of a saturated lane. You win by being the *only one in a different lane* who is also polished.

So the question is: what's the lane that this product *should* own that no one else does?

I'd argue the product itself is begging for it. This is a **graduation farewell scribble shirt**. The thing students actually do: they take a Sharpie to their friend's shirt, scribble a one-liner, draw a quick doodle, sign their name. The cultural reference is not a notebook. It's the **shirt itself, the day-of, the ink-on-fabric**. The references should be:

- Sharpie ink bleeding slightly into cotton.
- A 90s yearbook two-page spread, with marginalia and ticket stubs and polaroids.
- A 12th-grade math notebook annotated to death in the margins.
- A scrapbook page with three paper substrates, two sticker pulls, and one polaroid taped at an angle.
- Are.na meets Pinterest meets a moleskine.

What that means in design moves:

1. **Multiple paper substrates, not one.** Cream paper is the canvas. *On top of it* sits graph paper (for the studio), ruled paper (for the activity log), kraft paper (for groups, where social density lives), polaroid white (for the avatar hero).
2. **Marginalia as layout primitive.** Not just stickers as decoration. *Hand-drawn arrows between sections.* *Scribbled asterisks instead of bullets.* *Doodle frame brackets around the page title.* *Date stamps in the corner of every page.* These are layout devices, not chrome.
3. **Typography at three altitudes.** Caveat at 72px+ for one moment per page. Caveat 24px for accents. Patrick Hand 16–18px for nostalgic text moments (the share-card friendly URL, the dashboard sticky tip). Inter for everything else.
4. **Color through content, not chrome.** The dashboard chrome stays cream + ink. The *content* on the avatar (the scribbles) is where color lives. The user's own scribble palette is the dashboard's color palette. This is so on-brand the brand writes itself.
5. **One signature moment per page.** Dashboard: the polaroid-framed avatar. Studio: the canvas zoom-in pull. Profile: the friends-who-scribbled grid as a yearbook spread. Yearbook: literal printed-page metaphor.

Maya is right that we can't ship five surfaces. We can ship *two paper substrates + four marginalia primitives + a typography ladder + a real avatar hero*. That's enough to differentiate, with restraint.

The thing I'd push back hardest on: don't be precious. Imperfect alignment, 1–3° rotations on stickers and polaroid frames, slight margin offsets — these need to *ship*, not "ship if there's time." That's the difference between "AI sketched a notebook UI" and "a designer made this."

## Where they agree, where they disagree

| Topic | Maya (PD) | Aiden (DM) | Resolution |
|---|---|---|---|
| Foundation primitives are right | Yes | Yes | **Protect**: asymmetric corners, washi tape, scribble-underline, pencil texture |
| One hero moment per page | Strong yes | Strong yes | **Required**: dashboard avatar gets the polaroid treatment first |
| Multiple paper substrates | "One or two more" | "Two or three more" | **Compromise**: cream + graph paper + kraft, three total |
| Marginalia as layout primitive | "If we have time" | "Required" | **Required**: doodled arrows, asterisk dividers, hand-set page numbers |
| Typography hierarchy | "Vary Caveat sizes" | "Three altitudes + Patrick Hand revived" | **Aligned**: three-altitude ladder defined below |
| Color expansion beyond paper+ink+purple | "No — stay restrained" | "Color through content, not chrome" | **Aligned**: chrome stays restrained, scribbles are the color |
| 1–3° rotations on stickers/cards | Cautious | Required for craft signal | **Required**: 1–3° on stickers, frames, polaroids only. NOT on body content. |
| Empty states styled as paper notes | Already done | Push further with marginalia | **Extend**: doodles + scribbled prompts inside empty states |

The disagreement is *how much*, not *what direction*. Both are pulling toward "scrapbook diary maximalism with editorial restraint." The compromise is on scope.

## Three creative directions (the actual decision)

Three honest directions. Each is internally consistent. Pick one and commit.

### Direction A — "Scrapbook Diary" *(Aiden's preference, Maya cautiously in)*

> A graduation scrapbook page. Cream paper substrate, with graph paper and kraft paper for specific surfaces. Marginalia as layout grammar. Hand-drawn arrows, asterisk dividers, hand-set page numbers, date stamps in corners. Polaroid frames for avatars. Strategic 1–3° rotations on stickers, frames, polaroids. Color comes from the scribbles users place, not the chrome. One signature hero moment per page.

**What ships**:
- **Three paper substrates**: cream (default), graph paper (`/shirts/[id]/scribble`, the studio), kraft paper (`/groups`, where social density lives).
- **Four marginalia primitives**: doodled arrow (between sections), asterisk divider (`✶ ✶ ✶` style, sparse), hand-set page number (lower-right, Caveat, e.g. *"page 03"*), date stamp (lower-left, e.g. *"2026 · class of"*).
- **Typography ladder**: Caveat 72/96 for the one hero per page, Caveat 24 for section eyebrows, Patrick Hand 18 for nostalgic moments, Inter 14/16 for everything else.
- **Polaroid avatar frame**: white frame, two taped corners, scribbled name in Caveat below, optional doodled arrow to the share CTA.
- **Strategic rotations**: stickers ±2°, polaroid frames ±1°, washi tape ±3°. Never on body text or panels themselves.
- **Empty states with marginalia**: a doodled smiley in the margin, an arrow pointing at the CTA, a scribbled one-line prompt in Caveat.

**Risk**: drifts into "messy" if a single component is over-rotated, or if marginalia gets used in body content. Mitigation: rotations limited to specific primitives only, asterisk dividers used max 1× per page.

**Portfolio strength**: highest. This is the lane that wins.

**Implementation cost**: ~2 days of focused work. Three new substrates, four marginalia components, polaroid frame component, typography pass on every page.

### Direction B — "Editorial Notebook" *(Maya's preference)*

> An art-school sketchbook on grain paper. Big breathing space, restrained palette, hand-set type at varied sizes, photographic moments. Closer to a museum catalog. Treats Scribbl as a literary object, not a maximalist scrapbook.

**What ships**:
- **One paper substrate**, the existing cream + dotted grid. Refined, not changed.
- **Two typography moves**: Caveat 96px for one heading per page; Patrick Hand 22 for nostalgic transitions ("turn the page" copy in margins).
- **Generous whitespace**: most cards lose their borders, sit on cream with one ruled line above + below to denote section breaks. Less chrome, more breathing.
- **Polaroid avatar frame** (same as A).
- **No additional substrates, no marginalia primitives, no rotations**.

**Risk**: reads as "very nice typography" without enough specificity to stand out. Could be mistaken for a literary indie site rather than a graduation farewell app.

**Portfolio strength**: medium-high. Safe. Beautiful. Less memorable.

**Implementation cost**: ~1 day. Mostly typography + spacing.

### Direction C — "Late-Night Doodle" *(neither's preference, the wildest)*

> Graph paper substrate everywhere. Ballpoint-pen blue ink as the primary text color (replacing ink-900). Ruled lines underneath sections. Equations and arrows and asterisks in margins. The energy of a math notebook annotated during a boring class. Kinetic, slightly chaotic, distinctly youthful.

**What ships**:
- **Graph paper as default substrate**, replacing cream paper-100. Cream becomes a secondary surface.
- **Ballpoint blue** (`#1d4ed8`-adjacent, tuned to OKLCH) replaces ink-900 as primary text. Black ink is reserved for the scribbles.
- **Ruled section breaks** (a single horizontal blue line, slightly rough, between sections).
- **Heavy marginalia**: doodled arrows everywhere, scribbled corrections, asterisks, "→ see page 4" pointers.
- **Hand-set page numbers** in the corner of every screen.
- **Three typography altitudes**, same as A.

**Risk**: highest. Could read as "academic" or "loses warmth." Mitigates the graduation/farewell nostalgia. Also makes accessibility harder (blue ink on graph paper grid).

**Portfolio strength**: highest *if it lands*, lowest *if it doesn't*. The home-run swing. The most distinctive lane.

**Implementation cost**: ~3 days. Effectively a re-skin of the entire app.

## My recommendation

**Go A.** Here's why.

You have a graduation farewell scribble shirt app. The product's emotional registers are nostalgia, friendship, end-of-an-era, ink-on-fabric. Direction A captures all four. Direction B captures elegance but underplays nostalgia. Direction C captures distinctiveness but flattens the warmth that makes the product care.

A also has the right *implementation-to-impact* ratio. Two days of focused work, four new components, three new substrates, one polaroid frame. We can execute this surgically without rebuilding the dashboard a third time. The studio v2 work (just shipped in Round 5) lives untouched inside the studio; we're operating on chrome, not canvas.

And critically: A is the lane that ships the screenshot. The dashboard with the polaroid-framed avatar, washi tape, scribbled name, hand-drawn arrow to the share button, asterisk-divider section breaks, and the empty state with a doodled smiley pointing at "Share your link" is the **one image** a hiring manager screenshots. That's the entire goal.

If we ship A and it drifts in execution, we can pull back to B (fewer paper substrates, less marginalia) without throwing work away. If we ship B and it underperforms in the portfolio review, we can't easily push to A — the difference is two days of work we wouldn't have done. So A has the right asymmetry.

## What I need from you

One decision. The rest of the work is mine and the subagents'.

### If you pick A or C
We do this in two passes:
- **Pass 1 (this session)**: write a "shape brief" doc with the exact components, palette, typography ladder, sample compositions for the dashboard hero. You confirm the brief.
- **Pass 2 (next session, can be tomorrow)**: implement against the brief.

### If you pick B
One pass. We do the typography + spacing in one go.

### Open question if you pick A
Do we ship one polaroid avatar frame everywhere, or two variants (taped-top for owned, taped-side for others' shirts)? My instinct: one variant for v1, evolve later. But you might want both.

---

## Round 3 — user reframes the metaphor (2026-05-21, evening)

User pushed back on the original three directions:

> *"Scribble day is in the open grounds of a college or anywhere in the campus, considering that none of the three options match... scrapbook theme is a little 90s and we are not in 90s... we are not giving the feeling of drawing in a notebook right but on the person... C is out of the thinking box now."*

This was the right read. The notebook metaphor (Direction A) maps onto the *future* yearbook phase, not the *current* scribbling phase. The scribbling phase is **outdoors, on campus, drawing on the person**. The reference is the physical day-of, not a book.

User also surfaced:
> *"I was thinking to maybe generated some illustrated version of my university based on the photos I have and then use them as background... appearance once and then almost invisible in the background but there is a feeling they are there."*

And:
> *"Since this is a college having a whiteboard or chalkboard stand added up somewhere as well that tells the title of the app?"*

Both moves were unanimously backed by Maya and Aiden in round 3.

### What was locked

**Direction D-revised: "Sunlit Lawn"** — a three-layer system, with two scope phases:

- **Phase 1 (scribbling, ships now)**: Sunlit Lawn. Illustrated campus backdrop as ambient *Place*, warmed cream paper as *Substrate*, content + chalkboard on top.
- **Phase 2 (yearbook, ships ~1 month later)**: Scrapbook Yearbook. Polaroid frames, two-panel spreads, archival cream paper. Same fonts and palette — visual continuity across phases.

The dropped elements from the original A/B/C:
- Polaroid frames — deferred to Phase 2 (yearbook)
- Date stamps + page numbers — deferred to Phase 2 (avoid competing with the place layer)
- `--sunlit-peach` color — dropped (the illustration provides the warmth)
- Yellow sticky notes everywhere — restricted to specific marginalia moments only
- Kraft paper substrate — dropped (too 90s)
- Graph paper substrate — dropped (was Direction C only)

### What carried forward into the lock

- Asterisk divider `✶ ✶ ✶` between sections (sparing)
- Scribbled name in Caveat 56–72px on signature pages
- Hand-drawn arrow doodle, one signature pointer per page (the hero arrow)
- Strategic ±2° rotation on `sticker-note`, `sticker-reaction`, washi tape only
- Floating sticker notes around the avatar as the hero composition
- Three-altitude typography ladder
- Quiet panels (less chrome) because the place layer carries the identity

### New elements that emerged in round 3

- **Place layer**: illustrated campus backgrounds, sketch-with-color style, ambient mode 8–12% opacity with `mix-blend-multiply` over paper.
- **First-visit mechanic**: 80% vivid hero opacity for ~1.8s desktop / ~1.1s mobile on first dashboard load, then fades to ambient. Persisted via localStorage. Skipped if `prefers-reduced-motion`.
- **Chalkboard component**: wooden-frame slate chalkboard as a reusable brand surface (a-frame, wall-mounted, small variants).
- **Art-directed mobile crops**: not "image shrunk," but a *different framing* of the same place per breakpoint.
- **Performance-aware degradation**: skip place layer on `slow-2g`/`2g` connections.

### The canonical spec

> **All implementation detail moved to [docs/18 — Sunlit Lawn Theme Spec & Playbook](./18-sunlit-lawn-theme-spec.md).** That doc is the single source of truth for tokens, components, file paths, illustration map, mobile budgets, and subagent boundaries. Doc 17 is the *conversation history*; doc 18 is the *implementation contract*.

If the context window dies and you (a future agent or future me) are reading this cold:
1. Read doc 18 first.
2. Come back here only to understand *why* a decision was made.
3. Past chats with the design conversation: this doc is the parent.

---

## Round 4 — Micro-interactions, whiteboard rename, ink writing (2026-05-21)

User came back after the round-3 lock with a clarity beat that *deepened* the metaphor rather than changing it:

> *"Hope the micro interactions, CTA's all are a little themed — like if I hover over a CTA its hover or clicked state is more of a pencil colour style fill than a solid fill or maybe if you can make it something better. On the chalkboards, I think whiteboard is more modern. I will again design these whiteboards and the content written over them so it feels more authentic — like a real whiteboard with marker written. Similar for notes left behind in writing, or maybe the panels we were thinking of creating on sticky notes or normal paper texture — they can have ink-like writing to feel more authentic."*

This was the move from *static decoration* to *physics*. The metaphor wasn't decoration any more; it was *how things behave*.

### What changed (the directional upgrades)

| Element | Before round 4 | After round 4 |
|---|---|---|
| Button hover | `translateY(-1px)` + border darkens (SaaS) | **Pencil-shade hover** — the existing repeating-linear-gradient at -12° animates from 4% → 18% opacity (ease-out 200ms). Active state hits 28% + 1px press. School-physics hover, not SaaS hover. |
| Input focus | 3px brand-ring shadow | **Ink-draw focus underline** — SVG line below the input, slightly wavy path, `stroke-dasharray` reveal over 350ms. Brand-ring stays for keyboard-focus accessibility, ink-line is the *expression*. |
| Sticker note hover | Static | **Lift-off-paper** — shadow grows + `scale(1.02)`, rotation preserved (don't flatten the tilt). |
| Form submit success | Confetti | Confetti **plus** a green ink "teacher's stamp" animation. Used sparingly — three Phase 1 moments: onboarding complete, scribble published, avatar locked. |
| Loading spinner | Lucide `<Loader>` | **Pencil-writes loader** — tiny SVG pencil drawing a line repeatedly. |
| Errors | Red text | **Red ink crossout** — wavy line strikes through the offending field/word. |
| Chalkboard component | Chalkboard (wooden frame + slate + chalk) | **Whiteboard component** (aluminum frame + off-white surface + Permanent Marker text in 4 colors — blue/black/red/green). Same variants (a-frame / wall-mounted / small), same role in the app. Modern, contemporary-classroom feel, and lets the user design their own whiteboard illustrations. |
| Sticky-note text | Inter | **Patrick Hand with ink-bleed text shadow** (`.text-handwritten-note`). Warm-brown ink color, slight bleed glow, subtle letter-spacing. Applied automatically inside `.sticker-note`, `.paper-note`, `.paper-note-tape`. |

### The school-element vocabulary (added in this round)

Every interaction in the app maps to one school instrument: paper, pencil, ink, marker, Sharpie/pen, highlighter, tape, stamp. If a new UI element doesn't map to one of these instruments, it doesn't ship. That's the design system in one table.

### Why "whiteboard" not "chalkboard"

User's reasoning: whiteboard is *modern*, not nostalgic. The chalkboard read would have pushed the design back toward the 90s feel we explicitly avoided in round 3. Whiteboard + marker says *contemporary classroom*, which aligns with the scribbling-phase metaphor (today's college, today's friends, today's golden hour). Chalkboard would say *vintage school*, which is closer to the Phase 2 yearbook tone.

Decision: whiteboard for Phase 1. Chalkboard remains a primitive we *could* introduce in Phase 2 if the yearbook needs a *vintage classroom* moment — but Phase 1 = whiteboard only.

### Why ink-on-paper for handwriting

Letters and notes from friends are *physical handwriting*. If they're rendered in Inter, the metaphor breaks the moment you look at one. Patrick Hand with a subtle text-shadow (ink bleeding into paper) makes notes feel like real handwriting — the same way the marker bleed makes whiteboard text feel like real dry-erase.

Caveat (used elsewhere on the system) is a more *decorative* handwriting — used for the scribbled name and hero display moments. Patrick Hand is *transactional* handwriting — used when the content is meant to read as "someone wrote this to you." Two different handwriting fonts, two different jobs.

### What this round did NOT change

The round-3 lock-in stands. Place layer, substrate, three-layer system, first-visit hero mechanic, mobile crops, performance budgets, asset gap list — all unchanged. Round 4 was a *deepening pass*, not a re-architecture.

---

## Round 5 — Reference image validation (2026-05-21, late)

User shared the original avatar-view concept image from May 17 (the "Front view / Back view" mockup with a head wearing sunglasses, scribbles on the shirt, sticker notes drifting around) and asked the question that should always be asked when locking a design system:

> *"This was the initial idea and the avatar system still remains this almost — so I hope our new design system and theme way is perfectly fitting for this themed avatar and not out of shape."*

### The audit (one row per element, all green)

Every visual primitive in the concept image maps cleanly to a Sunlit Lawn primitive. Cream paper → `--paper-100`. Soft purple wash behind the head → avatar halo (`--brand-soft` radial). Realistic head on illustrated body → Route 1 architecture. Scribbles on the shirt → scribble studio v2 + handwriting fonts. Floating sticky notes → `.sticker-note` + `text-handwritten-note`. Speech-bubble notes → `.sticker-note` speech-bubble variant. Paper-plane, heart, lightning doodles around the avatar → drifting doodles (new primitive). Top "Front view / Back view" segmented control → `.pencil-button` chrome. Bottom action bar → `.sketch-panel` floating action bar. Pencil icon for "Shirt scribbles" → already on-brand.

Every element had a name in the spec. That's the test passed.

### What the image revealed (the one upgrade)

The existing sticker SVGs (`paper-plane.svg`, `heart.svg`, `lightning.svg`, `sparkle.svg`, `crown.svg`, `smile.svg`, `flower.svg`, `star.svg`, `arrow.svg`, `bear-doodle.svg`) — already shipped under `src/assets/scribbl/stickers/` — are being used in the concept image as **page-level decoration around the avatar**, not as in-shirt scribble additions. That's a different role than "sticker tool result." That's **marginalia**.

Added to the spec as a new primitive: **drifting doodles**. Sticker SVGs at 24–40px, 60–80% opacity, ±3° to ±12° rotation, positioned absolute with `pointer-events: none` and `aria-hidden`. 4–6 per signature page on desktop, 2–3 on mobile. Placement is hand-coded per page (not random) — random looks like chaos, hand-placed looks like intention.

Also added: **avatar halo** — the soft elliptical `--brand-soft` radial gradient behind the user's head in the concept. Gives the avatar visual punch without needing card chrome around it.

### What the image confirms about the architecture

The Route 1 avatar architecture (uploaded head + SVG preset body) was the right call. The image shows a realistic photo head sitting on a drawn body, with scribbles applied to the body. That's exactly what Route 1 produces. No backtracking needed.

### The image is now the canonical north star

Doc 18 § 3 (Per-surface implementation map) cites this image as the visual proof of the Dashboard and Profile rows. Doc 18 § 8 (Marginalia primitives) opens with a note pointing to it. When in doubt about whether a composition is on-brand, hold it up to the concept image — if it matches the energy, it's on-brand.
