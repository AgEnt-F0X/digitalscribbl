# 23 — Scribble Studio & Drawing-Experience Audit

> Deep audit of the 2D drawing/signing stack as of 2026-06-10 (branch `scribble-core-rework`, v2.0.0).
> Complements doc 22 (security / DB / onboarding) — this one goes component-level into the **drawing
> experience, signing flows, and mobile/desktop layouts**, plus code health for the yearbook transition.
> Severity scale: **P0** = correctness bug or experience-breaking (fixed in this pass), **P1** = high-impact
> next, **P2** = polish.

---

## 0 · Architecture map (what exists today)

Two complete signing implementations live in parallel:

| | Legacy inline studio | New Scribble Studio |
|---|---|---|
| Entry | Profile page → `ShirtView` "Scribble on this shirt" | `/shirts/[shirtId]/scribble` (**no link points here**) |
| Code | `components/shirt/ShirtView.tsx` (~870 lines) + `components/scribble/ScribbleToolbar.tsx` | `src/features/scribble/*` (Studio, Workspace, Toolbar, MobileSheet, Inspector, Signature mode, ZoomViewport, outside notes) |
| Drawing core | `components/scribble/DrawingCanvas.tsx` (shared) | same (via `FlatShirtCanvas`) |
| Realtime | `useShirtChannel` presence + stroke broadcast | **not wired** |
| Panels | front / back / sleeves | front / back only |
| Publish geometry | tight layer bounds (compose) or full canvas (direct) | always full canvas `(0,0,400,600)` |

Both call the same `/api/scribble/place` contract (400×600 canonical space, sanitized SVG + Fabric JSON).
The shared `DrawingCanvas` is a solid Fabric.js v7 wrapper: five PencilBrush profiles, live shapes,
arrow grouping, polygon snap-clamp for spawned objects, JSON-snapshot undo (20 steps), clip-path to the
shirt template. The scribble contract (`scribbleContract.ts`, `shirtTemplate.ts`) is well-tested.

---

## 1 · P0 — fixed in this pass (2026-06-10)

| # | Fix | Where |
|---|---|---|
| F1 | **Canvas was disposed + rebuilt after every stroke.** `initialJson` (a new object per stroke commit) was in the init effect's deps; each stroke triggered full Fabric teardown, re-create, and async `loadFromJSON`. Cost: per-stroke jank that grows with content, killed in-flight `IText` editing, and a window where fast strokes could be lost mid-rebuild. `initialJson` is now mount-time-only via a ref (both consumers already remount via `key` when they want a reload). | `DrawingCanvas.tsx` |
| F2 | **Blurry strokes on every modern screen.** `enableRetinaScaling: false` left a 400×600 backing buffer CSS-stretched to up to ~620 CSS px × DPR 2–3. Now retina scaling is on; coordinates/exports unchanged. | `DrawingCanvas.tsx` |
| F3 | **Drafts were a placebo.** "Save draft" wrote `ScribbleDraft` stubs with empty stroke arrays, and *nothing ever read them back* — a refresh silently lost the drawing. Now: the real Fabric JSON is persisted per side on every stroke commit (`scribbl:flat-editor:{shirtId}:{side}`), outside notes/reactions under `scribbl:studio:{shirtId}`, both restored on mount and cleared on publish. | `ScribbleStudio.tsx` |
| F4 | **Eraser cursor was `not-allowed`** — the universal "you can't do this" signal. Replaced with an eraser-glyph cursor. | `DrawingCanvas.tsx` |
| F5 | **No keyboard shortcuts.** Added Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y redo, suppressed while typing (inputs + Fabric's hidden IText textarea). | `ScribbleStudio.tsx` |
| F6 | Publish now **explicitly clears the working canvas** — previously this happened only as a side effect of bug F1's rebuild, so fixing F1 without this would have double-rendered the published scribble. | `ScribbleStudio.tsx` |

Verified: `tsc --noEmit` clean, eslint clean, 47/49 unit tests pass (the 2 failures are pre-existing
runner issues — see §5.4 — not related to these files).

---

## 2 · P1 — the high-impact next moves

### 2.1 Drawing feel (top priority)

**Z1 — Draw while zoomed.** `ZoomViewport` blocks drawing whenever zoom > 100% and shows
"drawing paused". Precise signing on a phone *is* the reason to zoom — this inverts the core use case.
Target interaction model (state of the art: Procreate / Excalidraw / FigJam):

- **Touch:** one finger draws at any zoom; two fingers pan + pinch-zoom. On a 2-pointer touchstart,
  cancel the in-progress Fabric stroke (discard the live `PencilBrush` path) and hand the gesture to the
  viewport.
- **Desktop:** wheel = zoom toward cursor (or Ctrl+wheel), Space-drag / middle-drag = pan; drawing never
  pauses.
- Implementation note: Fabric v7 maps pointers through `getBoundingClientRect`, so the CSS-scale wrapper
  keeps coordinates correct — the drawing already works while CSS-stretched; the blocker is purely the
  capture overlay in `ZoomViewport.tsx:221`. Remove the overlay, move 2-finger interception into the
  viewport's `touchstart` (already `passive: false`), and add stroke-cancel plumbing to `DrawingCanvas`.
  Verify on iOS Safari that Fabric's `path:created` doesn't fire for the cancelled stroke.

**Z2 — Stroke quality: smoothing + pressure.** All brushes are fixed-width `PencilBrush` with `decimate`
tweaks. For "state-of-the-art" ink: variable width from pointer pressure/velocity (perfect-freehand-style
outline polygons, or modulating `strokeWidth` per segment), `pointerrawupdate`/`getCoalescedEvents()` for
dense sampling, and input prediction for visible latency. Keep the output a Fabric `Path` so the existing
JSON/SVG contract, undo, and sanitizer are untouched. This is the single biggest *feel* upgrade after Z1.

**Z3 — Eraser semantics.** The eraser deletes whole objects on tap — surprising when users expect to
erase part of a stroke. Either (a) adopt partial erasing (`@erase2d/fabric`, the maintained Fabric v6+
eraser, or composite-operation erasing flattened at export), or at minimum (b) hover/touch-highlight the
object that would be removed and label the tool "Remove object". Also set `targetFindTolerance` so small
strokes are tappable on touch.

**Z4 — Touch-friendly object handles.** Spawned text/stickers use default Fabric corner handles, which
are small on phones. Set `touchCornerSize` (~24), larger `cornerSize`, `transparentCorners: false`, and
`padding` on interactive objects.

**Z5 — Haptics + sound (doc 22 C2.5).** `navigator.vibrate(8)` on stroke commit and publish; optional
faint pencil-scratch loop while drawing (respect `prefers-reduced-motion` and a mute toggle).

### 2.2 Flows

**FL1 — Wire the new studio in (or kill it).** Nothing navigates to `/shirts/[shirtId]/scribble`; the
profile's "Scribble on this shirt" button enters the *legacy* inline ShirtView studio. Recommended cut:
the studio route becomes the only signing surface; `ShirtView` becomes view-only (browse, owner-remove,
realtime presence) and its button becomes a `<Link>` to the studio. This deletes the duplicate signing
implementation: `ShirtView` shrinks by roughly half, and `components/scribble/ScribbleToolbar.tsx` +
`GhostBoxCanvas.tsx` (already unreferenced) become removable. **Do this before any further studio work —
every improvement currently has to be reasoned about twice.**

**FL2 — Publish geometry.** The studio always publishes `fullCanvas: true` → every scribble is stored as
a full 400×600 layer at `(0,0)`. Consequences: per-scribble SVG bloat, occupancy/collision logic
(`PANEL_AREA`, `clampScribbleBoxToCanvas`) sees every shirt as 100% covered by each scribble, and the
yearbook recomposite stacks N full-size layers. Switch to the already-implemented
`exportLayer()` tight-bounds path (it pads + clamps correctly); keep full canvas only as a fallback when
bounds are degenerate.

**FL3 — Realtime in the studio.** `useShirtChannel` (presence, stroke broadcast, texture-updated) is only
wired into the legacy view. Decide the live story for the studio: at minimum presence ("Asha is signing
this shirt…") and a refresh signal when someone else publishes. Do **not** port the current remote-stroke
handler as-is — it `loadFromJSON`s the *entire* canvas over the local one (last-writer-wins, clobbers
in-progress work). Scribbles are already per-signer layers; broadcast published layers, not working JSON.

**FL4 — Sleeves panel.** DB, API, and legacy view support `front | back | sleeves`; the studio's
`ShirtSide` is front/back only. Pick one: add sleeves to the studio (third toggle, sleeve template) or
retire the panel value before yearbook rendering has to special-case it.

**FL5 — Voice notes: record, don't upload.** Both voice surfaces are file pickers. Nobody has a 12-second
audio file lying around — add in-app `MediaRecorder` capture (hold-to-record, waveform, 12 s cap matches
the server rule) with the picker as fallback.

**FL6 — Outside notes: direct manipulation.** Notes/stickers are tap-to-select, then nudged with
inspector sliders. Make them draggable (pointer events on the note, normalized 0–1 transform already in
place), with pinch rotate/scale on touch; keep the inspector for fine-tuning.

**FL7 — Honest buttons.** "Preview" shows a toast saying the preview is already visible — either build a
real preview (fit-zoom composite incl. existing scribbles, chrome hidden) or drop the button. Same bar for
any control: if it doesn't do anything, it costs trust in the ones that do.

### 2.3 Layout (mobile + desktop)

**LY1 — Tablet/desktop-md is broken-ish.** The desktop grid is `hidden md:grid` but columns are only
defined at `lg:` — between 768 and 1024 px everything stacks into one long column (toolbar → canvas →
inspector) while the mobile sheet is hidden. Either keep the mobile layout through `lg`, or define an
`md:grid-cols-[220px_minmax(0,1fr)]` intermediate with the inspector folded into a drawer.

**LY2 — Mobile canvas size.** `max-w-[40vh]` caps the shirt at ~337 px wide on a 390 pt phone — safe but
small for the app's core action. Add a **focus mode**: collapse the sheet to a slim strip + auto-hide the
top bar while a stroke is in progress (chrome fades back on release). Cheap, huge perceived-canvas win.

**LY3 — Status messaging.** `message`/`error` render as small text in two different places (under canvas,
plus sheet) and never auto-dismiss; route them through the existing `ToastProvider`/`showToast` and add
`role="status"` for screen readers.

**LY4 — A11y sweep on the studio.** Tool buttons need `aria-pressed`, the zoom controls need labels, and
the bottom sheet should trap focus when expanded. (The broader app is decent here — the studio is the
gap.)

---

## 3 · Yearbook-transition readiness (scalability)

The phase machinery is in good shape (`phase.ts`, `platform_settings`, DB phase-guard trigger, yearbook
tables shipped in migration 010). The scribble-specific risks for Phase 2:

1. **FL2 geometry** — fix before sealing; rewriting stored full-canvas layers post-lock is far messier.
2. **One signing pipeline (FL1)** — the yearbook recomposite (`lib/utils/recomposite.ts`) should only ever
   have to reason about one publish path's output.
3. **Sleeves (FL4)** — the yearbook card renderer needs a definitive panel list.
4. Plus doc 22's pre-flip items: avatar-config unification (D-DB1), `profile_slugs` backfill (D-DB2),
   asset-host allowlist (S1).

---

## 4 · Code health

| # | Item | Action |
|---|---|---|
| H1 | `components/scribble/GhostBoxCanvas.tsx` is dead (no importers) | Delete with FL1 |
| H2 | `components/scribble/ScribbleToolbar.tsx` used only by legacy ShirtView | Delete with FL1 |
| H3 | `ScribbleDraft`, `ShirtStroke`, `ShirtTextScribble`, `ShirtStickerScribble` in `src/features/scribble/types.ts` are now fully orphaned (the placebo draft was their last consumer) | Delete, or implement them as the real normalized stroke model if Z2 goes that way |
| H4 | `ScribbleStudio.tsx` ~950 lines | Extract `useStudioDrafts`, `useStudioPublish`, and move `MobileSignatureSheet` to its own file |
| H5 | `ShirtView.tsx` ~870 lines mixing modes, placement math, network, realtime | Shrinks naturally under FL1; otherwise split per doc 22 C2.3 |
| H6 | Test runner can't resolve `@/src` alias / `.tsx` (2 of 15 test files always fail: `avatar-resolve`, `hero-sticker-notes`) | Move tests to vitest (understands tsconfig paths), or register a loader for node:test; right now the suite cries wolf on every run |

---

## 5 · Suggested order of attack

1. **FL1** — converge on the studio, delete the legacy signing path (unblocks everything else).
2. **Z1** — draw-while-zoomed (the single biggest UX win on mobile).
3. **FL2** — tight publish bounds (before yearbook data accumulates).
4. **Z2 + Z3** — stroke quality and eraser semantics.
5. **LY1/LY2** — tablet grid + mobile focus mode.
6. **FL3/FL5/FL6** — realtime presence, voice recording, draggable notes.
7. **H1–H6 + LY3/LY4 + Z4/Z5** — cleanup and polish as you touch each area.
