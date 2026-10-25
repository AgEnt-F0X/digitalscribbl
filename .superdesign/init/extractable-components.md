# Extractable component menu

Reusable components available to the design tool, grouped by role. **No source here** —
full source lives in `components.md` (primitives) and `layouts.md` (shell).

- **Extractable props** = state / navigation / content props that legitimately vary per page.
- **Hardcoded** = icons, label copy, CSS class names, and image sources that are baked into
  the component and would need editing (not props) to change.

---

#### Layout Components

### AppShell
- **Source:** `components/nav/AppShell.tsx`
- **Category:** Layout / App shell
- **Description:** Intended shared shell — mobile compact header + desktop top nav + body + bottom nav, with full-bleed opt-outs.
- **Extractable props:** `children`, `currentUserId`, `currentUserName`, `currentUserHeadUrl`, `hideBottomNav`, `hideTopNav`
- **Hardcoded:** `scribbl-page` / `min-h-screen` frame, mobile logo text `"Scribbl"`, avatar ring `border-ink-100`, `md:hidden` / `hidden md:block` breakpoints, bell absolute offset `right-[180px]`, main padding fallback `88px`
- **⚠ Status: mounted by zero pages.** Every page hand-rolls its own header instead.

### TopNav
- **Source:** `components/nav/TopNav.tsx`
- **Category:** Layout / Navigation (desktop)
- **Description:** `md+` header with Scribbl wordmark, optional Explore / Groups links, and a greeting chip.
- **Extractable props:** `currentUserName`, `currentUserHeadUrl`, `variant` (`'full' | 'minimal'`); `currentUserId` + `unreadCount` are declared but unused
- **Hardcoded:** wordmark `"Scribbl"` + `scribble-underline`, tagline `"Your story. Their words."`, hrefs `/dashboard` `/explore` `/groups`, `Compass` + `Users` icons, active style `bg-brand-soft text-brand`, blank bell slot
- **⚠ Status: only reachable through unused `AppShell`.**

### BottomNav
- **Source:** `components/nav/BottomNav.tsx`
- **Category:** Layout / Navigation (mobile)
- **Description:** Mobile 5-slot tab bar with a centre `nav-fab` CTA; unread badge on Activity.
- **Extractable props:** `currentUserId` (drives the `/profile/:id` href)
- **Hardcoded:** 5 slot labels `"Home" "Explore" "Activity" "Profile"`, `Home` `Compass` `Bell` `User` `PenLine` icons, centre CTA href `/explore?filter=unsigned`, `bottom-nav` / `nav-fab` / `bottom-nav-item` classes, `9+` badge cap, `md:hidden`
- **Note:** active state is internal (`usePathname`), not a prop.

### RootLayout
- **Source:** `app/layout.tsx`
- **Category:** Layout / Root
- **Description:** Registers 5 Google fonts, imports `globals.css`, mounts toasts + the report button.
- **Extractable props:** `children`
- **Hardcoded:** `<html lang="en">`, metadata title/description, OG image `/og-image.svg`, favicon `/favicon.svg`, manifest, `themeColor: '#FFF6D9'`, `viewportFit: 'cover'`

### ShirtShell
- **Source:** `components/shirt/ShirtShell.tsx`
- **Category:** Layout / Canvas frame
- **Description:** T-shirt chrome with a clipped child surface so content only renders inside the drawable area.
- **Extractable props:** `shirtColor`, `headUrl`, `panel`, `children`, `showHead`, `surfaceClassName`, `className`
- **Hardcoded:** `aspect-[4/5]`, shoulder/sleeve/torso geometry percentages, head ring `border-[5px] border-[#f8f5ee]`, collar + button SVG paths, inline `HEAD_PLACEHOLDER` data-URI, backdrop gradient literal

### ZoomViewport
- **Source:** `src/features/scribble/components/ZoomViewport.tsx`
- **Category:** Layout / Viewport
- **Description:** Transform-based pan/zoom wrapper that layers gestures over Fabric without changing the draw coordinate space.
- **Extractable props:** `zoom`, `onZoom`, `minZoom`, `maxZoom`, `onGestureStart`, `onGestureEnd`, `className`, `children`
- **Hardcoded:** transform math, `touchAction: 'none'`, `cursor: grabbing/grab`, `transition: transform 120ms ease`, default clamp 50–200

### Whiteboard
- **Source:** `components/brand/Whiteboard.tsx`
- **Category:** Layout / Brand surface
- **Description:** Framed dry-erase board with HTML marker text layered over an SVG surface.
- **Extractable props:** `variant`, `title`, `subtitle`, `markerColor`, `rotation`, `customSvg`, `className`
- **Hardcoded:** 3 variant geometry tables, per-variant default marker colors, `MARKER_HEX` literals, `±2deg` rotations, frame + screw + smudge SVG, marker underline path

---

#### Basic Components

### EmptyState
- **Source:** `components/ui/EmptyState.tsx`
- **Category:** Basic / Feedback
- **Description:** The app's single centered empty state; paper-note surface, warm copy.
- **Extractable props:** `icon`, `title`, `description`, `action`, `className`
- **Hardcoded:** `paper-note` surface, `text-display` heading size `2xl`, `max-w-md mx-auto`, `text-ink-500` body

### PageError
- **Source:** `components/ui/PageError.tsx`
- **Category:** Basic / Error
- **Description:** Shared `error.tsx` body; reports to `/api/errors/report` on mount.
- **Extractable props:** `error`, `reset`, `route`, `title`, `description`, `homeHref`, `homeLabel`
- **Hardcoded:** `"Something tore the paper."` headline + description, `📓` glyph, `homeHref = '/dashboard'`, `Try again` / `Back to dashboard` labels, `btn-primary` / `btn-secondary`, ref line `Ref: {digest}`

### PageLoading
- **Source:** `components/ui/PageLoading.tsx`
- **Category:** Basic / Loading
- **Description:** Shared `loading.tsx` body with five skeleton layout shapes.
- **Extractable props:** `shape` (`list` | `shirt` | `form` | `studio` | `table`)
- **Hardcoded:** shimmer header row, 6-card list, 360/460px shirt block, `560px` studio columns, 8-row table, `max-w-6xl` frame

### Skeleton / SkeletonText / PageShellSkeleton
- **Source:** `components/ui/Skeleton.tsx`
- **Category:** Basic / Loading
- **Description:** Atomic paper-shimmer block, a text stack, and the page frame.
- **Extractable props:** `variant` (`line`/`circle`/`rect`/`card`), `lines`, `children`, `className`
- **Hardcoded:** `paper-skeleton` animation, variant shape classes, `max-w-7xl` frame, last-line `w-2/3` truncation

### ToastProvider
- **Source:** `components/ui/ToastProvider.tsx`
- **Category:** Basic / Feedback
- **Description:** Global toast host driven by the `scribbl:toast` window event.
- **Extractable props:** none (event payload supplies `tone` / `title` / `body`)
- **Hardcoded:** 4-toast cap, 4200 ms dismiss, `right-3 top-3 z-[100]`, 360px width, tone→Tailwind palette map, `x` dismiss glyph
- **Note:** `TOAST_EVENT` and `ToastTone` are exported for callers.

### InkCheckbox
- **Source:** `components/forms/InkCheckbox.tsx`
- **Category:** Basic / Form control
- **Description:** Controlled checkbox whose check stroke draws itself in with an overshoot.
- **Extractable props:** `checked`, `onChange`, `label`, `disabled`, `id`, `ariaLabel`, `className`
- **Hardcoded:** 20px `CHECK_LENGTH`, `250ms cubic-bezier(0.45, 1.4, 0.6, 1)` transition, `44px` tap target, `6×6` box, brand focus outline, check path `M3 8 L7 12 L13 4`

### InkUnderline
- **Source:** `components/forms/InkUnderline.tsx`
- **Category:** Basic / Form control
- **Description:** SVG wave that draws under a focused/filled input and erases when cleared.
- **Extractable props:** `active`, `className`
- **Hardcoded:** 200px `PATH_LENGTH`, `350ms ease-out`, wave path `M2 4 Q 50 1 100 4 T 198 4`, `-bottom-1 h-2` placement

### PencilLoader
- **Source:** `components/feedback/PencilLoader.tsx`
- **Category:** Basic / Feedback
- **Description:** Wavy ink stroke that loops as a submitting-state spinner.
- **Extractable props:** `className`, `label`
- **Hardcoded:** `40×20` viewBox, `700ms` SMIL dasharray loop, `1.6` stroke width

### StampSuccess
- **Source:** `components/feedback/StampSuccess.tsx`
- **Category:** Basic / Feedback
- **Description:** Rubber teacher's-stamp approval mark; fires `onComplete` at animation end.
- **Extractable props:** `show`, `onComplete`, `className`, `primaryText`, `secondaryText`
- **Hardcoded:** `260ms` timing, `120×120` viewBox, `r=56` ring, `--ink-stamp-green` stroke, `blur(0.4px)` filter, `stamp-land` class

### HandDrawnArrow
- **Source:** `components/marginalia/HandDrawnArrow.tsx`
- **Category:** Basic / Decoration
- **Description:** Squiggly arrow with a dasharray draw-on reveal; rotates via CSS transform.
- **Extractable props:** `direction`, `length`, `attention`, `stroke`, `strokeWidth`, `className`
- **Hardcoded:** `110px` path length, `600ms` body / `350ms` head (+400 ms delay), canonical paths, `4:1` viewBox ratio, `aria-label="hand-drawn pointer"`

### AsteriskDivider
- **Source:** `components/marginalia/AsteriskDivider.tsx`
- **Category:** Basic / Decoration
- **Description:** Three `✶` glyphs as a section separator.
- **Extractable props:** `className`
- **Hardcoded:** 3× `✶`, `my-8 gap-4`, `text-eyebrow-display text-ink-500`

### AvatarHalo
- **Source:** `components/brand/AvatarHalo.tsx`
- **Category:** Basic / Decoration
- **Description:** Soft brand-soft radial glow behind an avatar.
- **Extractable props:** `width`, `height`, `top`, `left`, `right`, `bottom`, `className`
- **Hardcoded:** `70% × 40%` defaults, `top: 30%` / `left: 50%` default placement, `translateX(-50%)` recentring

### DriftingDoodles
- **Source:** `components/brand/DriftingDoodles.tsx`
- **Category:** Basic / Decoration
- **Description:** Absolutely positioned hand-drawn doodles; layout by density, glyphs round-robin.
- **Extractable props:** `density` (`low`/`medium`/`high`), `palette`, `className`
- **Hardcoded:** 3 density layout tables (3/4/6 slots), 10-entry default palette, 12 inline SVG glyph strings, `rotate`/`opacity` per slot, `dangerouslySetInnerHTML`

### HeroStickerNotes / HeroStickerNote
- **Source:** `components/marginalia/HeroStickerNotes.tsx`
- **Category:** Basic / Composition
- **Description:** Positions sticker notes around an avatar; slots 3+ collapse below `md`.
- **Extractable props:** `notes` (`{ id, body, emoji? }[]`), `slots`, `className`
- **Hardcoded:** 4-slot `DEFAULT_HERO_NOTE_SLOTS` (top/left/right, rotation, tone, width), 4 `STICKER_TONES` hex pairs, notes truncated to `slots.length`, `sticker-note` + `hidden md:block`

### PlaceBackground
- **Source:** `components/place/PlaceBackground.tsx`
- **Category:** Basic / Decoration
- **Description:** Illustrated campus layer with vivid → fading → ambient first-visit phases.
- **Extractable props:** `surface`, `illustration`, `alwaysVivid`, `alwaysAmbient`, `className`
- **Hardcoded:** `1800ms` / `1100ms` durations, `768px` breakpoint, `/illustrations/place/{…}-{mobile|tablet|desktop}.svg` paths, `picture` source breakpoints `768 / 1280`

### Avatar
- **Source:** `components/avatar/Avatar.tsx`
- **Category:** Basic / Media
- **Description:** The single app avatar; resolves config → preset → row, then delegates to `AvatarRenderer`.
- **Extractable props:** `row`, `config`, `presetId`, `size`, `side`/`showBack`, `displayName`, `scribbles`, `scribbleCount`, `className`
- **Hardcoded:** `SIZE_TO_MAX_WIDTH_PX` map (80/156/240/340/440), legacy prop names, `bg-ink-900` count badge, `w-full`

### NotificationBell
- **Source:** `components/notifications/NotificationBell.tsx`
- **Category:** Basic / Navigation + Inbox
- **Description:** Bell + dropdown panel; doubles as the scribble-approval queue.
- **Extractable props:** `userId`
- **Hardcoded:** `🔔` literal glyph, `w-80` panel, `max-h-96`, `9+` cap, `bg-scribble-red` badge, `typeEmoji` 9-entry map, `animate-badge-bounce`, approve/reject button copy, `bg-green-500` / `bg-red-50` (off-system)

### ActivityLog
- **Source:** `components/activity/ActivityLog.tsx`
- **Category:** Basic / List
- **Description:** "X signed Y" timeline with optimistic emoji reactions and per-row deep links.
- **Extractable props:** `items`, `viewerId`, `title`, `eyebrow`, `emptyText`, `className`
- **Hardcoded:** `"Activity"` / `"Live memories"` / `"No scribbles yet."` defaults, `700ms` reaction cooldown, `14×14` thumbnail, `Sign back` / `Open shirt` labels, `/api/scribble/react` POST, `h-8` reaction pills

### ReportIssueButton
- **Source:** `components/support/ReportIssueButton.tsx`
- **Category:** Basic / Support
- **Description:** Global floating pill that POSTs a user-reported issue; mounted in the root layout.
- **Extractable props:** none (uses `usePathname`)
- **Hardcoded:** `fixed bottom-4 right-4 z-50`, `w-72` panel, 300-char limit, `"Report issue"` / `"Send"` / `"Cancel"` copy, `/api/errors/report` + `USER_REPORTED_ISSUE`

### ScribbleToolbar
- **Source:** `src/features/scribble/components/ScribbleToolbar.tsx`
- **Category:** Basic / Editor control
- **Description:** Brush / shape / extra tools, colour swatches, stroke slider, handwriting, undo-redo.
- **Extractable props:** `activeMode`, `tool`, `color`, `brushSize`, `fontStyleId`, `highlightEnabled`, `fillShapes`, `recentColors`, `onTool`, `onColor`, `onBrushSize`, `onFontStyle`, `onHighlight`, `onFillShapes`, `onUndo`, `onRedo`, `variant`
- **Hardcoded:** 13 `ToolDescriptor` entries with icons + descriptions, `previewLine` swatch path, `CANVAS_COLORS` grid, `Brushes`/`Shapes`/`More`/`Colours`/`Recent`/`Stroke` labels, `1–28px` slider, `1.4×` preview-dot scaling, `sketch-panel` aside, `min-h-11` tap targets

### ScribbleBottomBar
- **Source:** `src/features/scribble/components/ScribbleBottomBar.tsx`
- **Category:** Basic / Editor control
- **Description:** Sticky action bar: permission sentence, zoom cluster, Clear draft, Publish.
- **Extractable props:** `activeMode`, `permissionState`, `zoom`, `onZoom`, `onFitZoom`, `onClear`, `onPublish`, `canPublish`, `isSaving`, `publishLabel`
- **Hardcoded:** 4 status sentences, `MIN_ZOOM 50 / MAX_ZOOM 200 / STEP 25`, `"Clear draft"` label, `bg-ink-900` desktop vs `bg-brand` mobile publish, `lg` breakpoint split, `xs:block` status reveal

### SignaturePanel
- **Source:** `src/features/scribble/components/SignaturePanel.tsx`
- **Category:** Basic / Editor control
- **Description:** Signature-mode inspector — font, colour, size, Sign CTA.
- **Extractable props:** `fontStyleId`, `color`, `fontSize`, `onFontStyle`, `onColor`, `onFontSize`, `onExit`, `onPublish`, `canPublish`, `isSaving`, `variant`
- **Hardcoded:** `"Signature mode"` copy block, `8`-column colour grid, `18–72pt` step-2 slider, `"Sign"` / `"Use full canvas instead"` labels, `sketch-panel` aside

### StickerPicker
- **Source:** `src/features/scribble/components/StickerPicker.tsx`
- **Category:** Basic / Editor control
- **Description:** Emoji sticker grid.
- **Extractable props:** `onSelect`, `heading`, `columns`
- **Hardcoded:** `SCRIBBL_STICKERS` source data, `"Quick stickers"` + `"12 ready"`, 3-column fallback, `hover:-translate-y-0.5`

### HandwritingStylePicker
- **Source:** `src/features/scribble/components/HandwritingStylePicker.tsx`
- **Category:** Basic / Editor control
- **Description:** Font chooser that previews each style via its own `sampleText`.
- **Extractable props:** `value`, `onChange`, `variant`
- **Hardcoded:** `HANDWRITING_STYLES` data, `Handwriting` label, `border-brand ring-2 ring-brand/30` selected state, `min-h-14`

### CanvasModeToggle
- **Source:** `src/features/scribble/components/CanvasModeToggle.tsx`
- **Category:** Basic / Editor control
- **Description:** Two-segment switch between shirt canvas and outside notes.
- **Extractable props:** `mode`, `onMode`, `size`
- **Hardcoded:** `"Shirt canvas"` / `"Outside notes"` labels, `min-h-11`, `bg-brand text-white` active state

---

## Cross-cutting reuse notes

- **Nav duplication is the main extraction target.** `NotificationBell` + `BottomNav` are
  imported directly by `/dashboard`, `/explore`, `/profile/[userId]`, `/settings`, `/groups`,
  `/yearbook`, and `/groups/[groupId]` (bell but not bottom nav). Each page then writes its own
  `<header>`, so `AppShell`/`TopNav` could not be adopted without removing those headers.
- **Hero sticker composition is already shared** between `/dashboard` and `/profile/[userId]`
  via `HeroStickerNotes` + `AvatarHalo` — the one hero pattern that deduplicated cleanly.
- **`ShareButton` lives in a page folder** (`app/dashboard/ShareButton.tsx`) but is imported
  by `/profile/[userId]` — a candidate for promotion to `components/`.
- **Off-system colour callouts** (keep hardcoded unless deliberately re-themed):
  `bg-amber-600` landing/onboarding CTAs, `bg-green-500` / `bg-red-50` approve/reject buttons
  in `NotificationBell`, and the stock `green/red/amber/blue` 50/100/200 tone palette inside
  `ToastProvider`.
- **Unexported / leaf primitives** with no local imports worth extracting further:
  `HeadCropUpload` (canvas crop UI), `ScribbleTopBar`, `ScribblePermissionStatus`,
  `ApprovalInbox`, `ExploreSearchField` (thin wrapper over `InkUnderline`),
  `CreateGroupForm` (also exports `JoinGroupForm`).