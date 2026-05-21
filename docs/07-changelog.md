# 07 — Changelog

> What changed between the previous plan (now in [`archive/`](./archive/)) and this v1 ship plan. Living doc; every meaningful product or architecture decision lands here.

## 2026-05-21 — Round 6 (Phase 1G): Sunlit Lawn polish + tests

Polish/cleanup pass after the two signature-page subagents merged. Factored cross-page duplication, swept nav chrome to a single rule, removed the last lucide icon from a handwritten moment, and added design-system data tests.

**Refactored**
- Extracted the duplicated `STICKER_TONES` + `HERO_NOTE_SLOTS` + `HeroStickerNote` definitions out of `app/dashboard/page.tsx` and `app/profile/[userId]/page.tsx` into a single `components/marginalia/HeroStickerNotes.tsx`. Both signature pages now render the hero notes as `<HeroStickerNotes notes={heroNotes} />`. Exports: `HeroStickerNotes`, `HeroStickerNote`, `DEFAULT_HERO_NOTE_SLOTS`, `STICKER_TONES`, `StickerTone`, `HeroStickerNoteData`.

**Changed**
- Nav consistency sweep — `app/settings`, `app/activity`, `app/groups`, `app/groups/[groupId]`, `app/explore`, `app/yearbook` top navs all moved from `border-b border-black/5 bg-paper-100/80` (or the older `bg-white/90 backdrop-blur border-b border-gray-100` on yearbook) to the dashboard/profile rule: `border-b border-[color:var(--line-soft)] bg-paper-100/88`. One chrome rule across every signature + secondary surface.
- Dashboard footer line "One shirt. A hundred memories." now uses the `heart.svg` sticker SVG via `next/image` instead of the lucide `Heart` icon. Closes the doc 18 § 15 rule that lucide doesn't belong in handwritten moments.

**Added**
- `tests/hero-sticker-notes.test.ts` — 7 new tests covering the design-system data contract: tone palette shape, default slot count, mobile-collapse rule, tone-enum validity, rotation balance, single-corner positioning. Brings the suite to 60/60.

**Deferred to Phase 2 polish**
- Full DOM-render tests of `<Whiteboard>` and `<PlaceBackground>` per doc 18 § 19. Needs React Testing Library wired into the test rig.
- `<picture>` → `next/image` migration on `<PlaceBackground>`. The current `<picture>` block is correct and ships responsive sources via `srcset` + art-directed mobile crops; the `next/image` migration is an LCP optimisation, not a correctness issue.
- Sticker SVG dedup between `src/assets/scribbl/stickers/` and `public/scribbl/stickers/`. Both are needed (the first feeds the scribble canvas which inlines them; the second feeds `<Image>` tags). A future single-source-of-truth pass would pick one and write a build step to copy.

## 2026-05-21 — Round 6 (Phases 1A–1F): Sunlit Lawn theme shipped

Three rounds of design conversation (3 → 4 → 5) and four implementation passes (1A → 1B → 1C/D/E by Subagent B + 1E/F + docs by Subagent C). Locked the canonical theme for Phase 1 (scribbling phase) in [doc 18](./18-sunlit-lawn-theme-spec.md) and the conversation history in [doc 17](./17-design-system-v2-theme-conversation.md).

**Added**:
- Warmed paper-100 substrate (#FFF6D9, ~8% warmer toward golden hour) across the entire app
- `<PlaceBackground>` component — illustrated campus backgrounds at the Place layer (vivid on first visit, ambient subsequently)
- `<Whiteboard>` component — dry-erase whiteboard primitive (a-frame / wall-mounted / small variants) in aluminum frame with Permanent Marker text
- Permanent Marker Google Font loaded for whiteboard text
- `<AvatarHalo>` — soft brand-color radial behind the user's avatar on signature pages
- `<DriftingDoodles>` — existing sticker SVGs reused as page-level marginalia
- `<AsteriskDivider>`, `<HandDrawnArrow>` — marginalia primitives
- `<InkUnderline>`, `<InkCheckbox>`, `<StampSuccess>`, `<PencilLoader>` — themed micro-interactions
- Typography ladder utility classes (.text-hero-name, .text-hero-display, .text-eyebrow-display, .text-marker, .text-handwritten-note, .text-nostalgia, .text-eyebrow-uppercase)
- Tilt utility classes (.tilt-left, .tilt-right, .tilt-tiny)
- Pencil-shade button hover (replaces the SaaS translateY(-1px))
- Lift-off-paper hover on sticker notes
- Reference image (avatar-view concept) is now the canonical visual proof of dashboard + profile composition

**Changed**:
- Login, Dashboard, Profile, Explore, Groups, Group detail, Activity, Onboarding pages all rewritten to use the new primitives
- Dashboard hero composition matches the reference image (avatar + halo + sticker notes + scribbled name + drifting doodles + hand-drawn arrow → share CTA)
- Section card chrome dropped from secondary sections; content sits on substrate

**Dropped**:
- Chalkboard concept (renamed to Whiteboard in round 4)
- Daily Quest section from dashboard
- The SaaS `translateY(-1px)` button hover (replaced with pencil-shade)

Asset gap: user is producing real WebP illustrations for the Place layer (lawn-golden-hour + classroom-hall) in parallel. Subagent A shipped abstract sketch-style SVG placeholders; the swap is a single-file replacement when ready.

## 2026-05-21 (Round 5 — late night) — Route 1 architecture lock

User picked Route 1: one avatar system (SVG presets via `AvatarRenderer`), one canonical white shirt, one canonical drawable polygon. Three subagents executed in parallel; parent synthesised.

### Decision
- The CSS-based `AvatarDisplay` is gone. Everywhere in the app — dashboard, profile, explore, groups, yearbook, settings, onboarding, activity, admin yearbook — renders through a single `Avatar` wrapper that calls the SVG-preset `AvatarRenderer` under the hood.
- One shirt. No `shirt_color` picker in onboarding; `users.shirt_color` stays in the schema as a back-compat read but no UI surfaces it. The shirt is the white scribbling surface, full stop.
- One drawable polygon: `M82 206 L136 154 L168 190 C188 204 212 204 232 190 L264 154 L318 206 L340 558 C284 570 116 570 60 558 Z` in coordinate space 400×600, exported from `lib/utils/shirtTemplate.ts`. The flat scribble canvas clips strokes to this path; every preset SVG's `id="shirt-drawable"` path matches it byte-for-byte; the rendered avatar clips its scribble overlays to it. One polygon, three call sites.

### What changed
- **New helper `lib/utils/avatarResolve.ts`** — single resolver. Prefers `avatar_config.presetId`. Falls back via `LEGACY_BODY_STYLE_MAP` (M1→`m-soft-casual`, M2→`m-classic-straight`, M3→`m-upright-confident`, F1→`f-confident-upright`, F2→`f-soft-side-lean`, F3→`f-relaxed-casual` — all six legacy ids map onto the six launch heroes). Defaults safely. Merges `head_front_url` / `head_back_url` from the user row.
- **New wrapper `components/avatar/Avatar.tsx`** — drop-in replacement for `AvatarDisplay` with `row | config | presetId | bodyStyle` API. `shirtColor` prop deliberately not in the contract (Route 1: no shirt-colour customisation).
- **Polygon unification** — `lib/utils/shirtTemplate.ts` updated. `drawableBounds` recomputed to `{ x: 60, y: 154, w: 280, h: 416 }`. `pointInPolygon` exported for caller-side clipping checks. Test `tests/shirt-template.test.ts` still 3/3 under the new polygon.
- **6 hero presets** — `HERO_PRESET_IDS` exported from `avatarResolve.ts`. These are the only ones with hand-finished SVGs at launch. Subagent C's `docs/08-avatar-shirt-assets.md` rewrite documents the asset workflow for the user to finish offline.
- **11 page migrations** — every `AvatarDisplay` call site rewritten to `Avatar`. Every Supabase user-row select now includes `avatar_config` so `<Avatar row={...} />` resolves correctly. `components/avatar/AvatarDisplay.tsx` deleted (9 108 bytes gone). Zero application-layer callers remain.
- **Onboarding step 3 rebuilt** — legacy `BODY_STYLES` (M1–F3) grid replaced with a 3×2 grid of the 6 hero presets, each tile showing a tiny `<Avatar presetId={preset.id} size="sm" />`. Shirt-colour picker block deleted entirely. `complete()` writes `avatar_config: { presetId, skinTone, headSource }` and derives `body_style` from the preset for legacy back-compat.
- **Scribble studio v2 (state of the art)** — five distinct freehand brushes wired in `DrawingCanvas.tsx` with tuned per-tool `PencilBrush` profiles (cap/join/decimate/opacity/width clamps). New `TOOL_MARKER`, `TOOL_HIGHLIGHTER`, `TOOL_BRUSH` constants in `lib/constants.ts`. Shapes group (Line/Circle/Rect/Arrow + Fill toggle) promoted to first-class toolbar entries. Signature mode with a Caveat font and one-tap "Just sign" CTA — entry from the top bar, a dedicated `SignaturePanel` on desktop and a `MobileSignatureSheet` on mobile, a new `restyleAllText` ref method for live preview. Real 50–200% zoom + pan via a new `ZoomViewport.tsx`: two-finger pinch on mobile (raw touch listeners with `preventDefault` so Fabric never sees the gesture), one-finger drag pans when zoomed, desktop pointer drag works via a transparent pan-overlay that only mounts while `zoom > 100`. Pan clamped so the shirt never disappears. Drawing pauses while zoomed in (clear pill explains). Recent-colors row (last 6 distinct picks, no persistence). Live brush-size preview circle next to the slider. Hover descriptions on every toolbar button. Spawn-clamping for text/stickers: clicks outside the drawable polygon are snapped to the nearest interior point and nudged 12px toward the centroid, so no orphan handles on the edge.
- **Documentation** — `docs/08-avatar-shirt-assets.md` rewritten around the Route 1 lock (canonical polygon section, six-hero list, "14 files for launch" minimum set, "ONE canonical white shirt" language threaded throughout). `docs/04-architecture.md` got a new "Avatar & shirt rendering (Route 1 — single system)" section with a flow diagram (`user row → resolveAvatar → <Avatar> → <AvatarRenderer> → preset SVG layers`). `lib/constants.ts` got LEGACY deprecation comments above `BODY_STYLES` and `SHIRT_COLORS` (exports kept so back-compat reads keep working).

### Migration note for existing users
- `users.body_style` is no longer the source of truth but still drives a fallback render via `LEGACY_BODY_STYLE_MAP`. Anyone with a row created pre-Route-1 still gets an avatar; they'll re-pick a hero preset on next settings visit or re-onboarding.
- `users.shirt_color` writes continue from `app/settings/ProfileForm.tsx` for back-compat — the column has not been dropped. New code MUST NOT expose this picker; the white surface is canonical.
- `users.avatar_config.presetId` is the new authoritative field. Anyone re-onboarding writes it. Settings will fall through to writing it on the next save.

### Parent-level synthesis (this session)
- Reconciled the canonical drawable polygon BEFORE launching the subagents (so they all clipped to the same path).
- Wrote 6 regression tests for `avatarResolve` to lock the legacy mapping behavior (`tests/avatar-resolve.test.ts`).
- Fixed `tests/scribble-normalized.test.ts` to lock the new `HANDWRITING_STYLES` order (`signature` now first, ahead of `casual`). Comment added explaining the order is intentional and index-based lookups are not used.
- Fixed three `react-hooks/refs` lint errors in `ZoomViewport.tsx` by lifting `panStart` / `pinchStart` interaction state to `isPanning` / `isPinching` so the `transition` and `cursor` styles read state instead of refs during render.
- Harmonised the Publish CTA wording: `ScribbleBottomBar` and `ScribbleActions` now say "Publish scribble" / "Publishing…" matching the top bar (was "Send scribble" / "Sending..." inconsistency flagged by Subagent B).
- Updated the stale `CANVAS_COLORS` comment in `lib/constants.ts` (referenced "dark shirts" that no longer exist under Route 1).
- Verified `m-relaxed-shoulder-tilt` is still a registered preset (one of the 20) but no longer a launch hero — clean.

### Tests
- `npx tsc --noEmit` — clean, 0 errors.
- `npx tsx --test tests/*.test.ts` — 53/53 passing (47 prior + 6 new for `avatarResolve`).
- `npm run lint` — 0 errors, 0 warnings.

### Files touched this round
- New: `lib/utils/avatarResolve.ts`, `components/avatar/Avatar.tsx`, `src/features/scribble/components/ZoomViewport.tsx`, `src/features/scribble/components/SignaturePanel.tsx`, `tests/avatar-resolve.test.ts`.
- Deleted: `components/avatar/AvatarDisplay.tsx`.
- Modified across `app/**` (11 page-level callers + onboarding), `src/features/scribble/**` (studio v2), `src/features/avatar/**` (resolver-aware), `lib/constants.ts` (new tool constants + legacy annotations), `lib/utils/shirtTemplate.ts` (polygon unification + `pointInPolygon` export), and `docs/04-architecture.md`, `docs/08-avatar-shirt-assets.md`.

## 2026-05-21 (Round 4 — night) — PM/PD overrides + UX rebuild

User reviewed the three-review synthesis, picked **Option C**, and then layered **five hard overrides** on top:

### Dropped from v1 (explicit user calls)
- **Daily Quest** — judged "not useful." `src/features/dashboard/components/DailyQuest.tsx` deleted; dashboard queries `signaturesGivenToday` + `reactionsGivenToday` removed (one fewer count per dashboard load).
- **Head placeholder bank** — *"the whole app theme is to have a customised head avatar. so no head bank."* `lib/data/headPlaceholders.ts` deleted. Onboarding step 2 reverts to **prompt → upload → (skip)**, with the AI prompt promoted to a `<details open>` so it's the first thing on the screen. The customised face is now the product's stated identity, friction included.
- **Account deletion (UI + OTP)** — schema in migration 010 stays (so admins can SQL-flip `is_deleted` + the API/proxy gates we built keep working), but no UI ships in v1. Hard delete = email the admin. Linked to the email-system drop below; OTP requires email.
- **Email digest / Resend integration** — `app/api/email/digest/route.ts` now returns 503 unconditionally unless `EMAIL_DIGEST_FORCE_ENABLE=true`. Body left intact for future re-enable on a non-paid provider. Cron is not scheduled. The `disable_email_digest` platform flag is now redundant but harmless.

### Upgraded
- **Skin tone** — added an **undertone axis** (cool ↔ warm, −50…+50) on top of the existing depth slider, per PM #4. `lib/utils/skinTone.ts` exposes `skinToneFrom(depth, undertone)` and preserves all back-compat (`{value}`, legacy ids, raw hex). Onboarding step 3 now renders two sliders with live preview swatch.

### Dashboard rebuild (Subagent A)
- `app/dashboard/page.tsx` rewritten end-to-end. Mobile-first single column; desktop `xl` keeps the 3-column sticky layout with the avatar hero in the wide centre.
- Compressed 10 panels → 5 visible sections (callout, shirt hero, groups, activity, combined Up-next). Shirt link / level explainer / occupancy % moved into one collapsible `<details>` "More about your shirt".
- One Caveat hero per screen: the shirt headline is the only `font-display` H1; every other section drops to an `text-xs uppercase tracking-[0.18em]` eyebrow.
- Killed the fake Front/Back `<span>` pills (replaced with a real `View back` link to `/profile/{id}?panel=back`), the fake 5×5 div "QR code", and 5 decorative angled border divs.
- Floating Lucide `<Send>` and `<Star>` replaced with inline hand-drawn SVG stickers lifted from `src/assets/scribbl/stickers/paper-plane.svg` + `star.svg`.
- Friendly share label `scribbl.app · your shirt` hides the raw UUID URL; ShareButton still copies the real link.
- `Farewell-in` lifted into the hero eyebrow (`"X days left to scribble"`). `Online now` standalone metric removed (subsumed by Sign-next).
- Hex sweep: `bg-[#fffaf0]/88` → `bg-paper-100/88`, `text-[#7c3aed]` etc → `text-brand`, `bg-[#f3e8ff]` → `bg-brand-soft`, `border-[#7c3aed]/40` → `border-brand/40`, `text-blue-800` → `text-brand`. Remaining hex literals are intentional sticker artwork colours, the four-tone FloatingNote palette, and the three-colour group tile palette.

### Mobile scribble studio bottom-sheet (Subagent B)
- `ScribbleStudio.tsx` now renders two `<main>` blocks: `block md:hidden` (mobile) and `hidden md:grid` (desktop) sharing the same state. Desktop layout unchanged.
- New `ScribbleMobileSheet.tsx`: CSS-only swipe-up bottom sheet with two snap points (collapsed ~92px peek, expanded 60vh), positioned `bottom: calc(60px + safe-area)` so it floats over the BottomBar without ever covering the Publish CTA.
- Four tabs in the sheet: Tools / Text / Stickers / Voice. Selecting an outside-note auto-switches to a synthetic `SelectionEditor` (rotation + scale + duplicate + delete sliders) — replaces the unreadably-tiny corner handles on phones.
- TopBar's Publish CTA is `hidden md:inline-flex` on mobile; BottomBar keeps the big thumb-reachable one.
- 44×44 tap targets everywhere: `ScribbleToolbar` colour swatches wrapped in `min-h-11 min-w-11` (visible dot stays 32px), tool buttons + sticker grid items min-height 14 (56px), `CanvasModeToggle` + `ScribbleSideToggle` now have a `size="sm"` variant with `min-h-11`.
- Sticker grid mobile variant: `columns=4` at 56×56 (was 6-col at smaller dims).
- `OutsideNotesCanvas` mobile variant: `aspect-[4/5]` so it shrinks to the canvas region; avatar `max-w-[300px]`; note max-width 150px. Desktop unchanged.
- Hex sweep inside scribble files: brand purples / paper creams replaced with `bg-brand`/`text-brand`/`bg-paper-100`. Highlighter + sticky-note yellows (`#fff2a8`, `#f2c84b`, `#fff4b8`, `#e9d37d`) kept intentionally — they're feature colours, not brand/paper.
- A pre-existing inline-component-during-render lint error in `ScribbleToolbar.tsx` (a `<Section>` wrapper) was caught by the final lint pass and inlined into the return statement.

### Design tokens + accessibility (Subagent C)
- Token consolidation across the codebase (every file outside dashboard + scribble-studio scope):
  - 6 purple-literal occurrences → `text-brand` / `bg-brand-soft`. Includes three sticker SVGs (`sparkle`, `speech-bubble`, `bear-doodle` — 13 stroke/fill changes).
  - 19 cream-literal occurrences across `app/{settings,yearbook,explore,error,groups,login,profile/[userId],dev/test-users,activity}/page.tsx`, `components/{ui/Skeleton,activity/ActivityLog,shirt/ShirtView,notifications/NotificationBell}.tsx`, and avatar editor components → `bg-paper-100`.
  - `CANVAS_COLORS` in `lib/constants.ts` re-synced to the tailwind `scribble.*` palette: black `#000000 → #2D2923`, green `#16A34A → #5F8B48`. `ScribbleToolbar` reads from `CANVAS_COLORS` so the swatches visually re-tone on next deploy.
- `app/globals.css`:
  - Defined the previously-undefined `--brand-ring` variable (the `.input:focus` rule had been referencing it dead).
  - `:focus-visible` ring shipped on `.pencil-button`, `.pencil-button-primary`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`.
  - `@media (prefers-reduced-motion: reduce)` block at the bottom — collapses every animation/transition to 0.001ms and explicitly disables `paper-shimmer`, `confetti-in`, `fade-in-up`, `fade-in`, `badge-bounce`, `scribble-draw`.
  - `.bottom-nav-item` inactive label colour `text-ink-300 → text-ink-500` (≈4.0:1 → ≈6.6:1 on paper-100).
- `components/nav/BottomNav.tsx`: `aria-current="page"` on every active tab (was only on `/dashboard`).
- `components/notifications/NotificationBell.tsx`: dynamic aria-label (`"Notifications, N unread"` / `"Notifications, no unread"`) + `aria-haspopup="dialog"` + `aria-expanded`.
- `components/avatar/AvatarDisplay.tsx`: new optional `displayName?: string` prop. The parent (this session) threaded it through every dashboard caller (hero, top-nav badge, group members, request avatars, queue avatars) so screen readers now announce `"Aanya's avatar"` instead of generic `"Avatar"`.
- Retired `src/features/avatar/components/SkinTonePicker.tsx` (legacy 5-swatch). Replaced with new shared `SkinToneSliders.tsx` component driven by the upgraded depth+undertone model in `lib/utils/skinTone.ts`. The only caller (`AvatarOnboardingFlow.tsx`) keeps live preview from both axes but resolves to the closest legacy `skinToneId` on save to preserve the `/api/avatar/config` contract. Extending the avatar API to carry `{depth, undertone, hex}` is logged for v1.1.

### Parent-level synthesis fixes
- Threaded `displayName` into every `AvatarDisplay` call on the dashboard (5 sites: top nav, hero, group member previews, pending request rows, sign-next queue rows). PD §6 alt-text gap closed.
- Demoted `ActivityLog`'s heading from `font-display text-2xl font-bold` to `text-base font-semibold` + the existing eyebrow. The component is always a secondary section in its 3 callers (dashboard, profile, /activity) — each page now has exactly one Caveat hero.
- Updated `docs/02-design-system.md` voice cap: "10 seconds" → "12 seconds" (reconciled with `MAX_VOICE_DURATION_MS = 12_000`).
- Final `npm run type-check` clean, `npm run lint` clean, `npm test` 47/47.

### Files touched this round
- New: `src/features/scribble/components/ScribbleMobileSheet.tsx`, `src/features/avatar/components/SkinToneSliders.tsx`
- Deleted: `src/features/dashboard/components/DailyQuest.tsx`, `lib/data/headPlaceholders.ts`, `src/features/avatar/components/SkinTonePicker.tsx`
- Modified (~20 files spanning `app/`, `components/`, `src/features/`, `lib/`, `docs/`) — see git status for the full list.

## 2026-05-21 (Round 3 — evening) — Three-review fixes landed

Senior PM, PD, and Dev reviews (`docs/13`, `docs/14`, `docs/15`) synthesised in `docs/16-three-reviews-synthesis.md`; user picked "option C" — fix the 5 action-board items + the disagreement recommendations. All of the below shipped in one session.

### Critical fixes
- **Migration 011 (`011_critical_fixes.sql`)** patches the `scribbles_phase_guard()` trigger to accept the `countdown` phase. Previously every scribble POST would 500 the moment admin flipped phase to `countdown`. Also reflected in `010` for fresh installs.
- **`app/api/admin/settings/route.ts`** allowlist extended to cover `phase`, `scribble_ends_at`, `yearbook_opens_at`, `transition_message`, and all 8 `disable_*` flags. The route also now invalidates the in-process phase + platform-flag caches on flip, type-validates incoming values, and writes to `admin_audit_logs`. The "single SQL flip" promise in doc 09 is finally reachable from the admin UI.
- **`.card`** is now defined in `app/globals.css` as `@apply sketch-panel`. Onboarding panels no longer render as bare divs.

### Degrade flags + free-tier hardening
- Six previously-dangling flags are now consumed: `disable_email_digest` (digest route), `disable_voice_notes` (voice route), `disable_head_uploads` (upload route), `disable_new_signups` (`auth/callback` + `sync-user`), `disable_realtime_presence` + `disable_realtime_broadcast` (threaded through `useShirtChannel`).
- Per-route rate limiters added to `/api/scribble/voice` (5/min) and `/api/avatar/upload-head` (3/min). Storage budget is no longer one motivated user away from full.
- Email digest now stages users by stable hash-mod-7 bucket so all 1,500 users get a turn each week instead of the same first-100 every day.
- Digest HTML now escapes `display_name` before interpolation; `last_digest_sent_on` query now also filters out `is_deleted = true`.

### Deleted + suspended user gates
- `lib/auth/server.ts:requireApiUser` now fetches `is_deleted` / `is_suspended` from `users` on every API call and refuses if either is true. Closes the gap where `proxy.ts` skips `/api/*` and a still-tokened user could keep writing.
- `app/auth/callback/route.ts` now selects `is_deleted` from the user row and signs out + redirects with `?reason=deleted` if true. Same gate added to `/api/auth/sync-user`.

### Audit logging
- New `lib/utils/audit.ts` writer. `admin_audit_logs` now receives a row from `admin/settings`, `admin/users` (suspend/unsuspend/admin grant/revoke), and `admin/moderation` (scribble hide/remove/dismiss, report action/dismiss). Failure to log doesn't block the underlying action — fails soft with `console.error`.

### Permission modes 4 → 2 (PM + PD agreement)
- `app/settings/ProfileForm.tsx` picker reduced to two options: **Batchmates** (default — `batch_only` in DB) and **Request only** (`request_only`). Legacy `open` and `locked` values continue to validate at the API for backward compat.
- The shirt-lock section is renamed to **Pause signing** with proper `aria-pressed` + `aria-label`. The picker now only chooses _who_, the toggle chooses _whether_.

### Onboarding collapse (PD + PM #1 issue)
- `/onboarding` is now the canonical end-to-end flow. The "Continue" button on review sets `onboarding_completed = true` directly and redirects to `/dashboard?onboarded=1` — no more chained `/onboarding/avatar` round-trip, no more confetti firing twice.
- Step 2 ("Your face") is now optional with three paths: pick one of 8 placeholder heads (`lib/data/headPlaceholders.ts`), upload a real face, or skip and add later.
- The AI prompt copy is rendered inline in a `<details>` block with a "Copy prompt" button. Doc 08 §10 said to do this and now we actually do.
- Review step (step 4) now offers **Edit basics / Edit face / Edit body** quick-jumps.
- `/onboarding/avatar` continues to exist as an optional polish surface reachable from Settings. The auto-redirect from step 4 was the regression.
- The thank-you popup now correctly fires on first dashboard load after the canonical flow.

### Deferred (synthesis disagreements B + C)
- Email-OTP account deletion **UI** deferred to v1.1. Schema in migration 010 remains (`is_deleted`, `account_delete_otps`, deleted-user gates at proxy + API). Hard deletes will be admin-handled via email request for v1.
- `/i/[code]` invite attribution route deferred. Schema in migration 010 remains (`share_links`, `share_link_visits`). v1 sharing uses `/u/[slug]` or current UUID URLs over WhatsApp.

### Files touched
- migrations: `010_role_access_lifecycle.sql` (line 341 fix in-place), `011_critical_fixes.sql` (new)
- new helpers: `lib/utils/audit.ts`, `lib/data/headPlaceholders.ts`
- API routes: `admin/settings`, `admin/users`, `admin/moderation`, `scribble/voice`, `avatar/upload-head`, `email/digest`, `auth/callback`, `auth/sync-user`
- libs: `lib/auth/server.ts`, `lib/hooks/useShirtChannel.ts`, `lib/utils/safetyAccess.ts`
- pages: `app/onboarding/page.tsx` (collapse), `app/settings/ProfileForm.tsx` (modes), `app/profile/[userId]/page.tsx` (realtime flag thread-through)
- components: `components/shirt/ShirtView.tsx`
- styles: `app/globals.css`

`npm run type-check` green; no lints.

## 2026-05-21 (Round 2.1 — late afternoon) — Onboarding scope + yearbook deferral

- **Thank-you message** moved out of onboarding → post-onboarding dashboard popup. Removes one friction point from first 90 seconds.
- **Onboarding fields** locked to: display name + program (hard-coded `B.Tech CS`) + batch (int 1–52) + enrollment. Academic-group concept dropped (doesn't generalise to smaller-batch courses).
- **B.Tech CS only for v1**; other courses added on request with their own batch shape.
- **Yearbook UI deferred to last-week launch**. Phase machine + schema + write-block plumbing still ship in v1 so we don't have to refactor flowing data.
- doc 08 §10 and doc 10 top-of-file updated to reflect both.

## 2026-05-21 (Round 2 — afternoon) — Role IA locked + transition + fallback

The morning audit raised 14 open questions on doc 08. All answered + locked. Three new docs + strikethrough reconciliation across the older ones.

### Product decisions locked
| # | Decision | Impact |
|---|---|---|
| 1 | Guest gets home + limited explore + activity (not just invite-only) | `proxy.ts` allowlist, new `/guest` route |
| 2 | **Anonymous scribbles CUT** — voice notes carry the emotional weight | UI toggles removed; `is_anonymous` column stays dormant; doc 03/06 updated |
| 3 | Voice playback restricted to owner + scribbler (+ admin for moderation) | Backend gate; UI shows mute icon to others |
| 4 | Group canvas kept; group admin owns/locks/moderates; one canvas per group | Matches migration 009 `group_id` column |
| 5 | Slug churn limit (1/30d), reserved slug list, history preserved forever | Migration 010 spec |
| 6 | Invite code: custom nanoid alphabet (no 0/O/1/I/l), length 10 → 57 bits | Migration 010 spec |
| 7 | **Account deletion with email OTP** — friends' memories of you survive by default | NEW spec; `is_deleted`, `account_delete_otps` table |
| 8 | Suspension = full block, content stays until admin manually removes | RLS gate, no auto-cascade |
| 9 | **No fixed deadline yet** — phased lock; transition page; ceremony into yearbook | NEW doc 10 |
| 10 | Onboarding asks (basics) vs yearbook asks (legacy line, featured scribbles) split in time | Migration 010 schema |
| 11 | **Free-tier fallback via `platform_settings` flags** + auto-soft-degrade | NEW doc 09 |
| 12 | Concrete indexes on `share_link_visits`, `notifications`, `admin_audit_logs` | Migration 010 spec |
| 13 | Role derived from flags via single `getRole()` helper; not stored | `lib/utils/role.ts` (new) |
| 14 | Admins are seeded via SQL only; no in-app promotion UI | No code work needed |

### New docs
- [`08-information-architecture-access-and-implementation-plan.md`](./08-information-architecture-access-and-implementation-plan.md) — updated in-place with "Decisions Locked On 2026-05-21 — Round 2" header section + cross-doc reconciliation table.
- [`09-free-tier-fallback.md`](./09-free-tier-fallback.md) — **NEW**. Monitoring thresholds, eight degrade switches, per-resource recipes, $65/mo upgrade ladder.
- [`10-scribble-to-yearbook-transition.md`](./10-scribble-to-yearbook-transition.md) — **NEW**. Phase state machine (`scribble_open` → `countdown` → `transition` → `yearbook`), yearbook profile page spec, ceremony animation spec, migration order.

### Strikethroughs (history preserved)
- `02-design-system.md` — 5-swatch skin → curated slider; anon-scribble section removed
- `03-product-flows.md` — onboarding step count + order; guest access scope; "Sign anonymously" toggle; group canvas property name
- `04-architecture.md` — guest hard-block; daily-digest cron → weekly; missing 009 columns added; `is_anonymous` marked dormant; route map expanded with `/u`, `/i`, `/guest`, `/transition`, `/yearbook`
- `06-revisit-later.md` — added "Anonymous scribbles" cut entry alongside the existing "Anonymous voice notes" entry

### What was NOT changed
- `01-product-overview.md` — still accurate as a one-pager; resists fine detail by design
- `05-ship-checklist.md` — will get an update **after** migration 010 is written + applied (next session)
- `08`'s decisions locked on 2026-05-21 (morning) remain in force; round 2 extends, doesn't replace

### Pending follow-ups
- Migration `010_role_access_links_and_digest.sql` — write + apply
- `lib/utils/role.ts`, `lib/utils/phase.ts`, `lib/utils/platformFlags.ts` — implement helpers
- Code removal of anonymous-scribble usage (UI + API + types)
- Admin "System Health" page (doc 09)
- `/transition`, `/u/[slug]`, `/i/[code]`, `/guest` routes (doc 08 + doc 10)

## 2026-05-20 (late) — Checklist audit + asset playbook

## 2026-05-20 (late) — Checklist audit + asset playbook

- [05-ship-checklist.md](./05-ship-checklist.md) updated with `[x]` / `[~]` / `[ ]` legend; code-verified items marked from repo scan
- [08-avatar-shirt-assets.md](./08-avatar-shirt-assets.md) added — step-by-step SVG workflow (ChatGPT → trace → validate) without requiring illustration skill
- `DailyQuest` wired into dashboard (IST day boundary + progress counts)

## 2026-05-20 — Ship-plan reset

A full product + architecture pass that consolidates 7 previous documents into the current 6-file canonical set. The old docs are kept in `docs/archive/` for history.

### Replaced docs
- `PLANNER.md` → folded into [04-architecture.md](./04-architecture.md) + [05-ship-checklist.md](./05-ship-checklist.md)
- `SESSION_STATE.md` → no longer needed; replaced by this changelog
- `product_strategy.md` → folded into [01-product-overview.md](./01-product-overview.md) + [06-revisit-later.md](./06-revisit-later.md)
- `project_analysis.md` → resolved items merged into ship-checklist; remaining concerns archived
- `LAUNCH_BACKEND_RUNBOOK.md` → folded into ship checklist
- `docs/product-flows.md` (v1) → expanded into [03-product-flows.md](./03-product-flows.md)
- `docs/design-system.md` (v1) → expanded into [02-design-system.md](./02-design-system.md)

### Product additions (in this release)

| Feature | Why |
|---|---|
| **Voice notes (10s cap)** | Storage math fits free tier; emotional payoff is huge |
| **Anonymous scribbles** | Anonymous-until-deadline reveal gives shy users a voice |
| **Owner thank-you message** | Pre-written, fires as toast to every signer — warm, low-friction |
| **Multi-shirt (max 3)** | Schema already supported it; UI + limit added |
| **Lock with in-flight fallback** | Locking mid-signing doesn't kill the active scribble |
| **Mobile bottom-nav** | Mobile is the primary surface; thumb reachability matters |
| **Compose mode default on mobile** | Fingers can't precision-draw on a small shirt |
| **Daily quest module** | Drives daily engagement during the 1-month window |
| **Notification center slide-out** | Bell shows all activity in one place, mark-all-read intentional |
| **Daily email digest (Resend)** | Browser push is rejected by most users; email is the fallback |
| **Guest user path** | Friends-of-students can sign via direct link without university email |
| **Group canvas (shared)** | Friend groups get a shared canvas to sign collectively |

### Product cuts / deferrals

See [06-revisit-later.md](./06-revisit-later.md) for the full list with rationale.

Quick summary of what was on the table and isn't shipping in v1:
- Pre-generated avatar head bank → cut (personal profiles)
- Time-locked scribbles → cut (breaks real-day metaphor)
- Print-on-demand → cut (shirt-on-shirt is conceptually wrong)
- Signing party rooms → cut (groups cover the need)
- Whisper / mutual-gate scribbles → cut (anonymous reveal covers it)
- Profile song → cut (onboarding friction)
- Polaroid moments → cut (storage budget)
- Auto-DM → cut, **replaced by owner pre-written thank-you toast**
- Friendship graph → deferred to yearbook phase
- Deadline ceremony animation → deferred to final-week build

### Architecture changes

| Change | Why |
|---|---|
| `proxy.ts` restored as the auth guard | Next.js 16 expects the proxy convention; the old middleware convention now warns during build |
| Migration `009_v1_launch_features.sql` | Voice notes, anonymous flag, thank-you text, guest flag, multi-shirt cap, avatar-per-shirt override |
| Removed collision blocking on `/api/scribble/place` | Per product decision: overlaps allowed; only size + drawable-region enforced |
| Lock check now allows in-flight scribbles | UX fix — locking mid-signing no longer rage-quits the signer |
| Resend integration for daily digest | Browser push is too low-acceptance; email is the path |
| Mobile-first design system rewrite | Most users will be on phones; old layout assumed desktop |

### Design system additions

| Token / component | Purpose |
|---|---|
| `font-display` = Caveat | Hand-drawn headings (replaces ad-hoc Segoe Print) |
| `font-hand` = Patrick Hand | Scribble previews, quote previews |
| `font-body` = Inter | All readable body copy |
| `--brand: #6f54df` | Single brand accent (purple) — replaces ad-hoc multiple accents |
| `bottom-nav` component | Mobile primary nav |
| `paper-shimmer` skeleton | Loading state baseline |
| Drawable-region rules | No bounding box on placed scribbles; border only while active drawing |
| Sticker reactions outside shirt | Strict separation: shirt content vs decoration |

### What's still broken and known

- **Avatar + shirt SVGs** are placeholder-ish — the user is generating production SVGs in the ChatGPT style separately, slot-in pending
- Loading + error states for most routes — building in this release
- Mobile audit has not been run yet — building in this release
- Empty states are not all designed — building in this release
- Resend daily quota at 1500+ users exceeds free tier (215/day) — monitoring + Brevo fallback planned

### Files moved

- `PLANNER.md` → `docs/archive/PLANNER.md`
- `SESSION_STATE.md` → `docs/archive/SESSION_STATE.md`
- `product_strategy.md` → `docs/archive/product_strategy.md`
- `project_analysis.md` → `docs/archive/project_analysis.md`
- `LAUNCH_BACKEND_RUNBOOK.md` → `docs/archive/LAUNCH_BACKEND_RUNBOOK.md`
- `docs/product-flows.md` → `docs/archive/product-flows-v1.md`
- `docs/design-system.md` → `docs/archive/design-system-v1.md`

### Files added

- `docs/README.md` (index)
- `docs/01-product-overview.md`
- `docs/02-design-system.md`
- `docs/03-product-flows.md`
- `docs/04-architecture.md`
- `docs/05-ship-checklist.md`
- `docs/06-revisit-later.md`
- `docs/07-changelog.md` (this file)
- `proxy.ts` (root)
- `supabase/migrations/009_v1_launch_features.sql`
- `components/nav/BottomNav.tsx`
- `components/nav/AppShell.tsx`
- (more added as the build progresses)
