# CRITIQUE.md — Scribbl theme exploration

Critic: one fresh-eyes design director (separate agent), briefed per critique.md with the concept, colour roles, refused defaults, rubric, and the before screen for the Fidelity line.

## Round 1 — `shots/explore/` (3 directions × 2 screens)

| # | Line | A — The Last Night | B — The Annual | C — House Colours |
|---|---|---|---|---|
| 1 | Concept on the pixel | 4 | 4 | **5** |
| 2 | Not the category average | 4 | **5** | **5** |
| 3 | Not this skill's average | 4 | **5** | **5** |
| 4 | Hierarchy | 4 | 4 | 4 |
| 5 | Typography | 4 | **5** | 4 |
| 6 | Colour | **5** | **5** | **5** |
| 7 | Richness | 3 | 3 | 4 |
| 8 | Rhythm and space | 3 | 4 | 3 |
| 9 | Craft details | 4 | 4 | 4 |
| 10 | Native fluency | 4 | 3 | 4 |
| 11 | Signature | 4 | **5** | **5** |
| 12 | The feature test | 4 | 4 | **5** |
| 13 | Fidelity (vs incumbent) | **5** | **5** | **5** |

Critic's pick: **C — House Colours.** "The only direction where the ritual's object owns the whole world — the shirt's fabric colour is the screen, the batch's handwriting lands directly on it." A lost on execution (empty signing canvas, tape-tabbed cards dragging back the refused scrapbook); B lost because it is the record, not the ritual (its №-stamp signature was recommended for stealing into the winner).

Verdict: **Done by the stop rule** (C: no line below 3; 9 of 12 at 4+).

### Round-1 asks (five, for C)

1. C2 kill the dead field: shirt to ~60% width, tray up, ghost prior signatures at ~12% ink on the remaining field.
2. C1 note clearances: Meghna note clear of the sleeve seam; Arjun note off the FRONT/BACK row.
3. C1 meta register: fresh-mark + counts lines in Big Shoulders caps, 12px, +3–14% tracking, not condensed sentence case.
4. C1 rebalance: name block −8–10%, shirt +8% — the object owns the poster.
5. C1 "Share her link": underlined text link → 1.5px ink-bordered pill, transparent fill, ink caps, CTA height.

Named defects regardless: A's tape tabs (refused-default adjacency); a2's duplicated orange/amber swatches; B's numbering mismatch (23 stated / № 24 stamped / № 25 promised); B2's missing tool rail.

## Round 2 — `shots/r2/` (post-done fixes, re-scored by the same critic)

All five asks + four named defects executed; nothing declined.

All five asks landed; the A/B defect fixes confirmed. Re-scores: C line 4 **3→n/a, 4→5** (hierarchy: the jersey is the single brightest mass on both C screens), C line 8 **3→5** (rhythm: dead field gone, ghosts populate it), C line 9 **4→5** (craft), A line 9 **4→5**, B line 9 **4→5**. C round 2, lines 1–12: **5, 5, 5, 5, 4, 5, 4, 5, 5, 4, 5, 5** — twelve of twelve at 4+, nine 5s; Fidelity 5.

Post-done defects named by the critic (both fixed, re-shot clean in `shots/r2/`): CTA register unified to tracked caps ("SIGN THIS SHIRT" / "PUBLISH" / "JUST SIGN" to match "SHARE HER LINK"); "Just sign" underline dropped.

Final verdict: **Done by the stop rule.**

## Mechanical scan record

- `shots/before/` — the incumbent core screen rebuilt from its real tokens: **6 FAILs** (3 type families in content; avatar-chip contrast 4.15:1; 6 hue families; centred FAB over the tab bar; plus clipping/overlap artefacts of the rebuild) and warns (Inter as default face, 11 text sizes, 8 shadow casters). These document the shipped theme; see `../UX-AUDIT.md` §2.1.
- `shots/explore/` (round 1, after fixing first-pass FAILs: SVG-text CSS-colour mismatch, 10.5px labels, button contrast, tap targets, Arial fallback on `.quiet`, ink tray instrument-chrome exemption): **clean, 0 FAILs / 0 warns on all six screens.**
- `shots/r2/` (round 2, after critic fixes): **clean on all six screens** after removing an off-frame ghost mark from a2.
- Declined asks: none. Instrument-chrome exemption (declared, not hidden): the 8-swatch ink tray on signing screens is the domain's tool palette (the product's real `CANVAS_COLORS`), marked `data-system="ink-tray"` in the mockups so the confetti check skips it; every other colour on every screen obeys one-accent (or no-accent for C).


## Rounds 3–4 — `shots/r3/`, `shots/r4/` (founder request: "explore the marigold direction more — or something even better")

**Round 3 — the direction expanded into a full system (8 frames):** anchor shirt refined (№ stamp folded in, dye wash added), a second owner on the cobalt field, night field (dark mode as the field deepened), home, batch wall, landing, re-tooled signing studio, and the "shirt fills" signature storyboard. Critic: the system survives expansion ("one object-world; no frame breaks it"), nine lines at 5 — but rhythm (8) and craft (9) fell to 3 with five named defects: studio action cluster floating mid-screen (root cause: a missing `studio` class, so the flex layout never applied), MEGHNA/MAYANK labels re-colliding with the grown shirt's shoulder, a half-cut ink swatch, dead holes in explore/storyboard, and the wash's light disagreeing with the hard shadows. Verdict: Done (defects named).

**Round 4 — all five fixed, nothing declined.** Rescores: line 8 **3→5**, line 9 **3→5**, line 10 **4→5**; wash re-anchor confirmed on line 6.

**Final — House Colours lines 1–12: 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5 · Fidelity 5.** Verdict: **Done by the stop rule** — every line at portfolio grade; trend across four rounds: one 3 → twelve 4+ → two 3s from expansion → twelve 5s.

Unscored polish note from the critic (applied after the final render, shot clean in `shots/r4/`): the signing tray pill now wears the system's hard offset shadow + ink border like every other white object.

Declined asks: none across all four rounds. Standing exemptions: ink tray = instrument chrome (`data-system="ink-tray"`); the dye wash is a physical light phenomenon (one gradient, field-internal, absent at night) per colour.md §6.


## New exploration (founder redirect: "different concepts, not different colours")

Three NEW concepts from three fresh source families, rendered on the same core screen with identical real content (`explore-concepts.html`, `shots/concepts/` + post-fix `shots/concepts2/`). Same critic.

| # | Line | M — The Mixtape (media/dark/mono+hand/orange/shape) | G — The Garland (nature/red field/rounded/gold/illustration) | D — The Deck (play/felt/grotesque/red/colour-material) |
|---|---|---|---|---|
| 1 | Concept on the pixel | **5** | 4 | **5** |
| 2 | Not the category average | **5** | **5** | **5** |
| 3 | Not this skill's average | **5** | **5** | **5** |
| 4 | Hierarchy | **5** | **5** | **5** |
| 5 | Typography | 4 | 4 | 4 |
| 6 | Colour | **5** | **5** | 4 |
| 7 | Richness | 4 | 3 | 4 |
| 8 | Rhythm and space | 4 | 4 | 4 |
| 9 | Craft details | 4 | 4 | **5** |
| 10 | Native fluency | 4 | 4 | 4 |
| 11 | Signature | **5** | 3 | **5** |
| 12 | The feature test | 4 | 4 | 4 |
| 13 | Fidelity | 4 | **5** | 4 |

Critic's pick: **The Mixtape** — "the only concept that transforms the object world completely while keeping the keep list on the front of the screen." Garland lost (bloom system never becomes visible; empty field), Deck lost (signatures hidden behind a flip; shirt demoted). Merge with House Colours? **No** — the grammars contradict; only the deck's fresh-event discipline transfers (HC already has it via the № line).

Post-verdict, the critic's five Mixtape fixes were applied (`shots/concepts2/01-m1-shirt.png`): shirt grown to hero scale over-printing the label margin, a tape window behind it, "SIDE B · 4 FREE" one-truth, a 28px mono display beat ("24 TRACKS · 17 FRIENDS"), REC tag on the fresh track + spool rotation ticks. Scan: 0 FAILs (standing warns: hue-bucket artefact on garland; per-screen type scales ≤7).

Watch-item carried in the record: the Mixtape's orange shares a hue word with the refused LokAI object/light/orange row — allowed because ground/type/source/richness all differ and the orange's job (REC/live) is new; it must never drift toward that system's flat object-orange.
