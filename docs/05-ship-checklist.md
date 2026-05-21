# 05 — Ship Checklist

> What must be true before scribble day. Tick each item before announcing the launch.

**Legend (2026-05-20 audit, 2026-05-21 round-2 refresh)**

- `[x]` — Verified in repo (code or file exists; run commands noted)
- `[~]` — Implemented in code; **you** still need manual E2E on mobile + desktop
- `[ ]` — Not done, not verified, or depends on production / your manual test
- ~~strikethrough~~ — Item cut from v1 scope (see [`08`](./08-information-architecture-access-and-implementation-plan.md) Round 2)

---

## A. Critical fixes (must be 100% green)

- [x] `proxy.ts` exists at project root and exports `proxy` for the Next.js 16 auth guard (`npm run type-check` passes)
- [x] `tsc --noEmit` exits 0 (verified 2026-05-20)
- [~] `npm run build` succeeds (run before launch)
- [~] `npm run lint` has no errors (run before launch)
- [ ] All uncommitted files committed or intentionally cleaned up
- [ ] Supabase migrations 001 → **010** run in order on **production** (010 added 2026-05-21: role constraints, slugs, share links, audit logs, system health, yearbook fields, phase machine, degrade flags, B.Tech CS seed)
- [ ] Storage buckets exist: `avatar-heads`, `shirt-textures` (both public)
- [ ] Google OAuth configured with prod callback URL
- [ ] `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` set to actual university domains
- [ ] `SUPABASE_SERVICE_ROLE_KEY` rotated (if directory was ever shared)
- [x] Dev links (`/dev/*`) gated on login via `showDevTesting` env flag

## B. Visual assets

- [~] `npm run validate:scribbl-assets` passes (structure OK; **aesthetic** match to mocks still open — see [08-avatar-shirt-assets.md](./08-avatar-shirt-assets.md))
- [ ] Canonical `shirt-editor-front.svg` / `shirt-editor-back.svg` match ChatGPT mock style (pencil shirt, cream paper)
- [ ] At least 6 hero body poses (3M + 3F) match same style; remaining presets acceptable or hidden
- [~] Stickers exist under `src/assets/scribbl/stickers/` (usage audit optional)
- [x] Google Fonts (Caveat, Patrick Hand, Inter) via `next/font/google` in `app/layout.tsx`
- [x] Favicon (`public/favicon.svg`), manifest, OG image (`public/og-image.svg`)

## C. Core flows tested end-to-end

Run each flow as a real user on **both mobile and desktop**.

### Onboarding (refactored 2026-05-21 — doc 08 Round 2.1)
- [~] Allowed-domain Google → dashboard (code: `proxy.ts`, `sync-user`, onboarding)
- [~] Non-allowed domain → guest path (`app/onboarding/guest/page.tsx`)
- [x] **4-step flow** in `app/onboarding/page.tsx`: basics → face → body+skin → review
- [x] B.Tech CS only, 52-batch grid (migration 010 seed)
- [x] Curated skin-tone slider (`SkinTonePicker` + `lib/utils/skinTone.ts`)
- [~] Avatar onboarding: preset + skin + head upload (`AvatarOnboardingFlow`, `app/onboarding/avatar/`)
- [x] ~~Thank-you message field in onboarding~~ → **moved to dashboard popup** (`ThankYouMessagePopup.tsx`)
- [x] Thank-you popup appears once post-onboarding when message is default
- [x] Confetti on onboarding completion (`canvas-confetti` in `app/onboarding/page.tsx`)

### Signing
- [~] Mobile signing usable (compose vs direct — verify touch + layout yourself)
- [~] Desktop signing on flat shirt canvas (`ScribbleStudio`, `/shirts/[id]/scribble`)
- [~] Voice note record + upload + playback (`/api/scribble/voice`, `ScribbleStudio`)
- ~~[~] Anonymous toggle + API (`is_anonymous` in place + studio)~~ **CUT** — doc 08 round 2 decision 2; toggle removed from UI, API ignores; column kept dormant
- [x] Voice playback restricted to owner + scribbler (server gates; UI to be enforced when `/u/[slug]` ships)
- [x] Phase + `disable_scribble_writes` flag enforced in `/api/scribble/place` and via DB trigger (migration 010)
- [~] Self-scribble hidden on own profile; server 403 (`place` route)
- [~] Scribble persists + realtime (manual: two tabs)
- [ ] Thank-you toast shown to **signer** after publish (API returns `thank_you_message`; confirm client toast)

### Dashboard
- [~] Avatar centerpiece + scribbles on shirt
- [~] Progress stats, shirt level, countdown
- [x] Daily quest renders + dismissible (`DailyQuest` wired in `app/dashboard/page.tsx`)
- [x] Thank-you message popup post-onboarding (`ThankYouMessagePopup.tsx`)
- [~] Activity feed, sign-next, pending requests
- [~] Bottom nav on mobile (`BottomNav.tsx` exists; dashboard still uses inline nav — wire `AppShell` if you want one nav everywhere)
- [~] Share link / QR / WhatsApp (verify buttons)

### Multi-shirt
- [~] Unlock shirt 2 at occupancy threshold (`unlockNextShirt` in place route)
- [~] Cap at 3 shirts (migration `009`, constraint)
- [~] Profile shirt tabs + settings lock UI

### Permission / lock
- [~] `open`, `batch_only`, `request_only`, `locked` permission modes
- [~] Shirt `is_locked` + `/api/shirt/lock` (you said product may de-emphasize lock — code still present)
- [~] In-flight scribble when locked (verify manually)

### Notifications
- [x] Bell unread badge + slide-out panel (`NotificationBell.tsx`)
- [x] Mark-all-read on panel close (not on open)
- [~] Tap notification → correct destination (manual)

### Admin
- [x] `proxy.ts` blocks non-admin from `/admin/*` (Round 2 — uses `getRole()`)
- [~] Admin routes + moderation + users + errors pages exist
- [ ] `/admin/system-health` page (doc 09) — **deferred to next session**
- [ ] `admin_audit_logs` writes added to existing admin endpoints — **deferred**

### Guest (expanded scope — doc 08 round 2 decision 1)
- [x] `proxy.ts` allowlist matches doc 08 (guest can hit `/guest`, `/activity`, `/explore` read-only, `/u/`, `/i/`, scribble flow)
- [ ] `/guest` landing route — **deferred to next session**
- [~] Guest blocked from dashboard / settings / groups (verified via role helper)
- [~] Guest badge on scribbles (manual)

## C.1 Backend foundations (Round 2 — added 2026-05-21)

- [x] Migration 010 written: role constraints, slugs, share links, audit, system health, yearbook fields, phase machine, degrade flags, B.Tech CS seed (52 batches)
- [ ] Migration 010 applied to production (run after review)
- [x] **Migration 011 written** (Round 3): patches the `scribbles_phase_guard()` trigger to allow `countdown`
- [ ] Migration 011 applied to production
- [x] `lib/utils/role.ts` — single role-derivation source
- [x] `lib/utils/phase.ts` — phase reader (defaults `scribble_open`, cached 30s)
- [x] `lib/utils/platformFlags.ts` — 8 soft-degrade flags (cached 60s)
- [x] `lib/utils/skinTone.ts` — slider model + back-compat for old swatch ids
- [x] `lib/utils/audit.ts` — `admin_audit_logs` writer (Round 3)
- [x] `lib/supabase/types.ts` extended with new tables + columns
- [x] `proxy.ts` uses role helper; phase + suspension + deleted + guest-allowlist + admin-route checks
- [x] `requireApiUser` re-checks `is_deleted` / `is_suspended` per API call (Round 3)
- [x] `auth/callback` refuses session for `is_deleted` users (Round 3)
- [x] Anon scribble UI + API removed (column dormant in DB)
- [x] DB trigger blocks scribble inserts during non-(`scribble_open`|`countdown`) phase or when `disable_scribble_writes` (countdown bug fixed in 011)
- [x] **Admin can flip phase + every `disable_*` flag** via `/api/admin/settings` allowlist (Round 3 — CRIT-2 fix)
- [x] All admin mutating routes write to `admin_audit_logs` (Round 3)
- [x] All 8 soft-degrade flags are now consumed by their respective routes (Round 3)
- [x] Voice + head upload rate-limited (Round 3 — 5/min, 3/min)
- [x] Email digest hash-mod-7 weekday stagger + HTML-escape display name (Round 3)
- [ ] `/u/[slug]` canonical profile route — **deferred (PM disagreement C — UUID URLs work for v1)**
- [ ] `/i/[code]` invite/share resolver — **deferred (schema kept, route not built)**
- [ ] `/guest` guest home — **next session**
- [ ] `/api/account/delete` (request + confirm OTP) — **deferred to v1.1 (PM disagreement B — admin-handled by email request for v1)**
- [ ] `/admin/system-health` page — **next session**
- [ ] Replace `/api/scribble/voice` GET with owner+scribbler+admin gate (when surface exists) — **next session**

## C.2 Three-review fixes (Round 3 — added 2026-05-21 evening)

Closes the action items from `docs/16-three-reviews-synthesis.md`:

- [x] **CRIT-1** Phase trigger allows `countdown` (mig 011 + 010 in-place)
- [x] **CRIT-2** Admin settings allowlist extended; cache invalidation + audit on flip
- [x] **CRIT-3** `.card` defined in `globals.css` as alias of `.sketch-panel`
- [x] **#2** Onboarding collapsed to a single 4-step flow ending with `onboarding_completed = true`
- [x] **#2** Default head bank (8 placeholders) + inline AI prompt with Copy button + Skip path
- [x] **#3** 6 unconsumed degrade flags wired into their routes
- [x] **#4** Rate-limit on `/api/scribble/voice` (5/min) + `/api/avatar/upload-head` (3/min)
- [x] **#5** Deleted users blocked at the API layer + audit logs from admin routes
- [x] **Disagreement D** Permission modes 4 → 2 (`batch_only` / `request_only`) + pause-signing toggle
- [x] **#6** Dashboard compression — desktop + mobile (Round 4 — single Caveat hero, fakes removed, friendly URL, hero above the fold on mobile)
- [x] **#8** Token cleanup — purple + cream literals swept codebase-wide, `CANVAS_COLORS` re-synced to tailwind palette (Round 4)
- [ ] **#7** 5-friend stress test (`docs/12`) — **schedule before launch**

## C.3 Round 4 — PM/PD overrides + UX rebuild (2026-05-21 night)

- [x] **Drop Daily Quest** — component deleted, dashboard queries removed
- [x] **Drop head placeholder bank** — `lib/data/headPlaceholders.ts` deleted; onboarding step 2 = prompt + upload + skip
- [x] **Skin tone upgrade** — `lib/utils/skinTone.ts` now exposes depth + undertone axes; onboarding step 3 renders both sliders with live preview
- [x] **Drop email digest** — `/api/email/digest` returns 503 unless `EMAIL_DIGEST_FORCE_ENABLE=true`; no cron scheduled
- [x] **Drop account deletion UI** — schema dormant in mig 010; admin-handled via SQL flip on email request
- [x] **Mobile scribble studio bottom-sheet** — canvas pinned top 60vh + single tabbed sheet (Tools/Text/Stickers/Voice); duplicate Publish CTA dropped on mobile; 44×44 tap targets
- [x] **Single Caveat hero per screen** — `ActivityLog` heading demoted; dashboard reset to one `font-display` H1
- [x] **Focus-visible rings** on `.pencil-button` + `.btn-*` in `globals.css`
- [x] **`prefers-reduced-motion`** block kills `paper-shimmer` / `confetti-in` / `fade-in-up` / `fade-in` / `badge-bounce` / `scribble-draw`
- [x] **`BottomNav` `aria-current="page"`** on every active tab
- [x] **`NotificationBell` dynamic aria-label** with unread count
- [x] **`AvatarDisplay.displayName`** threaded into all 5 dashboard call sites
- [x] **Retire `SkinTonePicker.tsx`** → new shared `SkinToneSliders.tsx`
- [x] **`docs/02` voice cap** reconciled to 12s

## D. Mobile audit (per page)

375×667 — all items manual unless marked otherwise:

- [x] Touch targets ≥44px — dashboard pencil/btn/share, scribble toolbar swatches + tool buttons + sticker grid + canvas-mode/side toggles all min-h-11 / min-h-14 (Round 4)
- [x] No horizontal scroll — dashboard single-column on `<xl`, scribble studio canvas-only on `<md` (Round 4)
- [x] Bottom nav reachable — scribble mobile sheet floats above BottomBar (Round 4)
- [ ] Safe-area insets — sheet uses `calc(60px + safe-area)`; verify on iOS notch
- [x] Shirt canvas tap / zoom — mobile relies on native pinch; sheet collapses to peek so canvas isn't scrolled off (Round 4)
- [ ] Inputs ≥16px font — verify per form

## E. Loading + error states

- [x] `loading.tsx` for: dashboard, profile, explore, groups, settings, onboarding, admin, yearbook, shirts/scribble, root
- [x] `error.tsx` for same routes + shared `PageError` → `/api/errors/report`
- [~] Skeletons use design tokens (visual pass on Slow 3G)

## F. Empty states

- [~] `EmptyState` component exists; verify per route manually

## G. Performance

- [ ] Dashboard LCP on Slow 3G
- [~] Fabric.js only on scribble route (dynamic import — verify Network tab)
- [ ] Image `sizes` / LCP pass
- [ ] No console errors on major routes

## H. Security

- [ ] No service-role key in client bundle (grep `.next/static` after build)
- [~] API routes use `requirePageUser` / admin guards (spot-check)
- [~] SVG sanitization on scribble insert
- [x] Rate limits on place / react / report / request
- [x] Self-scribble blocked server-side

## I. Pre-launch communication

- [ ] 5 friends × 2 days stress test
- [~] Report issue widget (`ReportIssueButton` in layout)
- [ ] Admin broadcast + social copy ready
- [ ] Deadline in `platform_settings`

## J. Post-launch monitoring

- [ ] Daily `/admin/errors`, Supabase usage, Resend quota

## K. Yearbook handover

- [ ] Post-scribble phase only (ZIP export, read-only)

---

**Asset anxiety?** Read [08-avatar-shirt-assets.md](./08-avatar-shirt-assets.md) — you can ship with current SVGs and upgrade 6 poses later.

If every **launch-blocking** box in A + your manual C/D passes, you are ready for the friend test. Full green on B is polish, not a hard gate.
