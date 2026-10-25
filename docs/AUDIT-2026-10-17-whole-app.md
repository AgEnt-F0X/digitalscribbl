# Scribbl — Whole-App Build, UX & Flow Audit

**Date:** 2026-10-17 · **Build:** branch `scribble-core-rework` @ `3d9f9cd` (v2.0.0)
**Method:** build commands executed locally, three parallel code audits (UX/flows, API+code health, design system+a11y), plus a live browser walkthrough of the running dev server.
**Supersedes:** `UX-AUDIT.md` (2026-10-05) and `docs/AUDIT-2026-09-01.md` (v1). Both are correct about what they saw; this records what changed since.

---

## 0. Verdict

**Not shippable. Three blockers, and the newest one is the dangerous one.**

The product thinking is still excellent — v2's pivot ("we missed scribble day, sign before convocation, then archive") is sharp, and the last few commits (one-door access resolver, owner chrome, retired request flow) are real progress. The problems are wiring and discipline, not taste.

| Blocker | Evidence |
|---|---|
| **1. The backend is gone.** `dvqdwvzvfxlqwdxmakao.supabase.co` is NXDOMAIN. Every authenticated surface is unreachable. | Verified live today |
| **2. Prototype mode fails open.** If `NEXT_PUBLIC_SUPABASE_URL` is unset or a placeholder, the whole app silently serves fake data with **every visitor logged in as the first seeded user** — and there is no `NODE_ENV` guard. | `lib/supabase/prototype.ts:39` |
| **3. The build is red.** `tsc --noEmit` fails with **295 errors across 49 files**. `vitest run` fails to even load one suite. | Verified locally |

**The trap:** blocker 1 makes blocker 2 the obvious "fix". Shipping prototype mode to get a demo up would turn a dead backend into a **total authentication bypass**, and it would look like a working app. This is the single most important thing in this document.

**The good news:** of the 30 API routes, every one re-checks auth independently; admin routes are genuinely gated; uploads are hardened; no SQL injection surface; no committed secrets. The v1 code was built carefully. It is the v2 wiring on top that is unfinished.

---

## 1. Build health (executed today)

| Check | Command | Result |
|---|---|---|
| Types | `npm run type-check` | ❌ **295 errors / 49 files** |
| Tests | `npm test` | ❌ 116 passed, **1 suite fails to load** |
| Lint | `npm run lint` | ✅ 0 errors, 1 warning |

### 1.1 The 295 type errors are one root cause

They are not 295 bugs. `createClient()` now returns `PrototypeClient | SupabaseClient`, so every `.from()` chain in the app is a union type and every result field fails to resolve.

Worst affected: `app/admin/yearbook/page.tsx` (39), `app/dashboard/page.tsx` (22), `lib/hooks/useShirtChannel.ts` (20), `app/explore/page.tsx` (16), `app/admin/groups/page.tsx` (15), `app/profile/[userId]/page.tsx` (14), `app/settings/page.tsx` (13).

Two independent clusters sit underneath that:
- `lib/hooks/useShirtChannel.ts` — `RealtimeChannel` vs a narrower `ChannelLike`; `presenceState`, `track`, `topic/params/socket/bindings` missing.
- `lib/identity/access.ts:106-136`, `lib/utils/recomposite.ts:62-129` — query results typed `Row | Row[] | {...}` so `.visibility` / `.owner_id` / `.is_locked` / `.is_suspended` / `.map` / `.length` don't type-check.

**Fix:** delete prototype mode from the shared clients (see §2) or return a proper discriminated union. That alone clears most of the 295.

### 1.2 The failing test suite

```
FAIL tests/proto-import.test.ts [ RolldownError: Parse failure:
Duplicated export 'resetPrototypeStore' ]
```

`lib/supabase/prototype.ts:56` declares `export function resetPrototypeStore()` and `:96` re-exports it. One-line duplicate. Note this **aborts the whole run** — CI goes red on a green codebase.

### 1.3 Repo hygiene

Last commit is recent (v2 work is landing), but `docs/v2/` and the prototype work are still uncommitted, and the working tree has 2 modified + 3 untracked source files. **Commit the tree.**

---

## 2. 🔴 BLOCKER — Prototype mode fails open

`lib/supabase/prototype.ts:33-42`:

```ts
const url = (env?.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
if (!url) return true                        // ← unset env ⇒ prototype ON
if (/your-project|example\.supabase\.co/i.test(url)) return true
```

**There is no `NODE_ENV` check anywhere in the file.** Wiring is three call sites, all shared modules: `lib/supabase/client.ts:5`, `lib/supabase/server.ts:6`, and `lib/supabase/server.ts:31` (the **service-role** client).

If it activates — a typo, a missing Vercel env var, a deploy that forgets one — nothing throws. Every page renders as a logged-in demo:

| Control | Becomes |
|---|---|
| Session check | `getUser()` returns `store.get('users')[0]` — the first seeded user, **for every request** (`prototype.ts:137-140`) |
| Suspension gate | reads the mock row → always `false` (`lib/auth/server.ts:30-42`) |
| `getUserIsAdmin` | reads `is_admin` off the seed row (`lib/auth/server.ts:116-125`) |
| RLS | not modelled at all — stated in the file header (`prototype.ts:17`) |
| Writes | in-memory `Map`, resets on restart, every insert "succeeds" |
| Storage / RPC | `{data:null, error:null}` |

`app/api/scribble/place/route.ts:207-231` would then be reading fake rows and writing fake scribbles. **Every request becomes an authenticated demo request.**

Two smaller defects in the same file:
- `createPrototypeClient(env?)` **never reads its `env` parameter** (`prototype.ts:128-129`) — the parameter is a trap; the decision falls back to module-global `process.env`.
- `prototype.ts:139` destructures `const [user] = store.get('users') ?? []`, yielding `undefined` (not `null`) on an empty store despite a `Row | null` return type.

**Fix, in order:**
1. Invert line 39 → `if (!url) return false`.
2. Hard-gate the whole module: `if (process.env.NODE_ENV === 'production') return false`.
3. Move prototype mode **out** of `lib/supabase/client.ts` and `server.ts` entirely. It should be a preview-only build (`Bolt`), not a runtime branch in the shared client. This is also what clears the 295 type errors.
4. Until it is gone, add `PROTOTYPE_MODE=off` explicitly to every deploy environment.

---

## 3. UX & flow gaps

### 3.1 Route inventory and navigation

`components/nav/AppShell.tsx` is **dead code** — zero importers. Every page hand-rolls its own `<nav>`.

| Route | loading | error | notes |
|---|---|---|---|
| `/` | ✅ root | ✅ | redirects to `/onboarding` when profile incomplete |
| `/login` | ❌ | ❌ | |
| `/onboarding` | ✅ | ✅ | |
| `/onboarding/guest` | ❌ | ❌ | |
| `/onboarding/avatar` | ❌ | ❌ | |
| `/dashboard` | ✅ | ✅ | |
| `/explore` | ✅ | ✅ | |
| `/activity` | ❌ | ❌ | no boundary of its own |
| `/settings` | ✅ | ✅ | |
| `/profile/[userId]` | ✅ | ✅ | |
| `/yearbook` | ✅ | ✅ | **unreachable from nav** |
| `/groups` | ✅ | ✅ | **not reachable on mobile** |
| `/groups/[groupId]` | ❌ | ❌ | |
| `/groups/join/[token]` | ❌ | ❌ | |
| `/shirts/[shirtId]/scribble` | ✅ | ✅ | |
| `/admin` + 5 children | ✅ (at `/admin` only) | ✅ | children inherit |
| `/dev/*` | — | — | in the **public** route allowlist |

There is no `app/shirts/[shirtId]/page.tsx` — the shirt is a sub-route only.

**Navigation reality:** `BottomNav` (Home / Explore / FAB / Activity / Profile) is the only consistent spine and it is fine. `TopNav` renders **only** from the unused `AppShell`, so **desktop has no shared global nav at all** — each page's inline header is the only nav, and they have drifted.

### 3.2 Breaks, ranked

| # | Issue | Sev | Evidence |
|---|---|---|---|
| 1 | **Every guest dead-ends on a 404.** `proxy.ts:127` redirects guests to `/guest`, which does not exist. | blocker | `proxy.ts:127`; `app/guest/**` absent |
| 2 | **`/yearbook` is orphaned.** The product's payoff has zero `href="/yearbook"` outside the admin page. | major | grep: no user-nav link |
| 3 | **Mobile cannot reach `/groups`.** The link is `hidden sm:inline` in page headers; BottomNav has no slot. | major | `dashboard/page.tsx:310`, `activity/page.tsx:128` |
| 4 | **Desktop has no global nav.** `TopNav` is unreachable because `AppShell` is never mounted. | major | `AppShell.tsx` — 0 importers |
| 5 | **Join-group failures are silent.** `join/[token]/page.tsx:24,32` redirect to `?join_error=…`; `app/groups/page.tsx` never reads `searchParams`. User sees an empty list, no reason. | major | both files |
| 6 | **Admin settings keys don't match what the write path reads.** Admin toggles `scribbling_enabled` (`admin/page.tsx:35`); placement reads `disable_scribble_writes` (`scribble/place/route.ts:184`). Admin writes `deadline_date` (`:36,102`); dashboard reads `scribble_deadline` / `extraction_deadline` / `launch_deadline` (`dashboard/page.tsx:113`). **The admin kill-switch and the countdown may both be inert.** | major, verify at runtime | as cited |
| 7 | **Approval mode lets you draw, then hides it.** You can complete a whole drawing with no mention that it is held (`identity/signing.ts:63-65`), while the profile CTA says only "Scribble on this shirt" (`profile/page.tsx:335`). Highest-surprise rule in the product. | major | as cited |
| 8 | **`/admin/moderation` has no nav link** in its own file; `/admin` is reachable only by typing the URL. | major | grep |
| 9 | **FAB points at a param Explore never reads** — `/explore?filter=unsigned` (`BottomNav.tsx:63`); `explore/page.tsx:17-25` has no `filter`. | minor | as cited |
| 10 | **Hero CTA may only appear for `needs_approval`** (`profile/page.tsx:334-338`). For an *open* shirt the hero shows no CTA and the only entry is a small pill in `ShirtView.tsx:158`. Confirm at runtime. | major, suspected | as cited |
| 11 | **Removing your own scribble has no confirmation** (`ShirtView.tsx:203-208`). Group leave *does* confirm (`LeaveButton.tsx:40`) — inconsistent. | minor | as cited |
| 12 | **`/dev/ia-map` has no production guard**, unlike its sibling `app/dev/sunlit-lawn/page.tsx:12-14` which calls `notFound()`. Combined with `/dev` in the public allowlist (`lib/utils/role.ts:55`), it renders for anonymous users in production. Leaks internal schema/route docs. | major | as cited |
| 13 | **`disable_head_uploads` flag is defined but never enforced** — `platformFlags.ts:24` lists it; `onboarding/page.tsx:99` and `HeadUpload` upload without checking. | minor | as cited |
| 14 | **`normalizeVisibility` fails open** — any unknown/null value becomes `open` (`identity/access.ts:63-65`). A bad DB value silently exposes a private shirt. | major | as cited |

### 3.3 Access rules, explained

Signing is checked in this order (`identity/signing.ts:53-67`, `access.ts:147-191`): shirt missing → 404; viewer suspended → refused; owner suspended → refused; **you are the owner → refused**; owner blocked you → refused; `circle` mode and you're not on the circle → refused; `approval` mode → allowed but invisible until approved; `open` → allowed and visible.

Rules that will confuse users:
- **`approval` mode is silent** — you draw, it publishes nothing, nobody is told.
- **A block is disguised as a lock** — blocked users get "isn't taking signatures from you right now" (`access.ts:73`), identical to a locked shirt, so they may retry forever.
- **`circle` refusal says "ask them to add you"** (`access.ts:75`) with no in-app way to ask.
- **Own shirt is refused** — the owner can never demo or test their own canvas.
- **`shirtLevel` ranks by unique signers, not scribbles** (`shirtLevel.ts:46-53`), and `adminLevelOverride` forces `progress: 100` (`:41`) — an overridden shirt shows a full bar above copy like "Blank canvas".

### 3.4 State coverage

| Surface | empty | loading | error | offline | denied |
|---|---|---|---|---|---|
| `/` | — | ✅ | ✅ (off-brand) | — | — |
| Dashboard | inline dashed row | ✅ | ✅ | — | — |
| Explore | — | ✅ | ✅ | — | — |
| Profile | — | ✅ | ✅ | — | — |
| Groups | — | ✅ | ✅ | — | — |
| Notifications | inline text | — | — | — | — |
| Scribble studio | — | ✅ | ✅ | — | ✅ `ScribblePermissionStatus` |
| Activity | — | ❌ | ❌ | — | — |
| Yearbook | — | ✅ | ✅ | — | — |
| Admin ×5 | — | ❌ inherit | ❌ inherit | — | — |

**App-wide gaps:**
- **No offline state anywhere.** No `navigator.onLine`, no `online`/`offline` listener. `useSlowConnection.ts` exists but is consumed only by `PlaceBackground.tsx:53`.
- **No too-many-items state.** No pagination, limit, or `endReached` affordance on any list.
- **`EmptyState` has zero importers** (`components/ui/EmptyState.tsx:20`) — the four "present" empties are hand-rolled in three different idioms.
- Three loading idioms coexist (`PageLoading`, `PageShellSkeleton` in `app/loading.tsx:5`, per-route skeletons).

---

## 4. API, contract and data-integrity gaps

### 4.1 Confirmed contract mismatches

| Endpoint | Caller | Problem |
|---|---|---|
| `/api/onboarding/lookup` | `onboarding/page.tsx:146,164` | Returns `{found:true, code:'unlisted_program'}` with **no `program` key**. Caller branches only on `data.found`, then reads `data.program` → `undefined` → fails the `lookup?.program?.id` guard and shows *"Look up your enrollment number first"* for a number that genuinely resolved. |
| `/auth/callback` vs `/api/auth/sync-user` | `login/page.tsx:120` | Same guest, two destinations: callback sends any non-university user to `/onboarding/guest` unconditionally (discarding `next`); sync-user honours `onboarding_completed`. |
| all `/api/*` | `ProfileForm.tsx:55`, `onboarding/page.tsx:104,188` | `proxy.ts:141-144` excludes only static assets, so `/api/**` runs the proxy, and `proxy.ts:61-66` redirects unauthenticated calls to `/login` (HTML 200). The route never runs. These callers do a bare `await res.json()` with no catch → throws. |
| `/api/shirt/lock`, `/groups/join`, `/groups/create`, `/groups/leave`, `/scribble/remove`, `/shirt/release-box` | forms | Unguarded `await req.json()` — no `try`, no `.catch`, unlike `shirt/access/route.ts:31`. Malformed body → 500 HTML, not a documented 400. |

### 4.2 Data-integrity bugs — these silently corrupt product state

1. **Occupancy recount omits approval status — MAJOR.** `scribble/place/route.ts:347-351` filters `.eq('approval_status','approved')` with an explicit comment that the service-role client bypasses the RLS policy hiding pending scribbles. The remove path (`scribble/remove/route.ts:53-59`) filters only `is_hidden`. So **removing a scribble recomputes shirt fullness including invisible pending marks**, inflating occupancy and firing `unlockNextShirt` early — handing students blank shirts while work is pending. Two paths that must agree, do not.
2. **`scribble/remove` reports success unconditionally — MAJOR.** `:50,62-65` discard write errors and always return `{success:true}` (`:67`). A failed hide shows as removed on the UI while the scribble stays on the yearbook page. Compare `scribble/approve/route.ts:80-97`, which checks the error.
3. **No rollback on destructive writes — MAJOR.** `scribble/remove/route.ts:50` commits the hide, then recalculates occupancy; if that fails, `*_occupancy` is permanently wrong with no compensating write.
4. **Safety controls fail silently — MAJOR.** `shirt/access/route.ts:83,103,109` — three deletes with no error check, each returning `{success:true}`. The panel optimistically removes the row first (`ShirtAccessPanel.tsx:153`). **A failed block is a safety control silently not applied.**
5. **`JSON.parse` on a truncated slice is not exception-safe — MINOR.** `errors/report/route.ts:13-16` slices `JSON.stringify(value)` to 2000 chars and parses; a mid-token cut throws `SyntaxError` in an unguarded path, 500ing the error-reporting endpoint exactly when the app is already broken.

### 4.3 Auth posture — mostly sound

- Admin routes genuinely gated (`admin/users:18`, `admin/settings:65`, `admin/moderation:25,93`, `export-requests:93`, `yearbook/export:186`).
- No route trusts a client-supplied user id for identity. `scribble/place` accepts one but re-validates through `checkShirtAccess` (`:260`).
- Dev impersonation **is** correctly blocked in production (`lib/auth/dev.ts:31`).
- `proxy.ts` is live and correctly wired for Next 16's root `proxy.ts` slot (no `middleware.ts`, and none is needed).

Minor: `app/dev/logout/route.ts:4-8` has no guard; `lib/utils/role.ts:68` lists `/api/` in the guest allowlist (misleading dead policy — routes re-check via `requireApiUser`); `email/digest:52` compares its secret with `===` rather than constant-time; `proxy.ts:75-89` builds a **service-role** client and reads a profile row on every non-API navigation.

**Unfinished, and it matters:** `lib/identity/verification.ts:8` documents the OTP provider as an unprovisioned stub that *blocks* rather than simulates. Consequence: `app/api/onboarding/complete/route.ts:124` lands every student as `verification_status:'pending'`, and **enrollment-number uniqueness is the only identity anchor** on a public archive.

---

## 5. Design system & accessibility

The "Sunlit Lawn" theme is a real direction executed at roughly 70% coverage — enforced on authenticated pages, abandoned on the acquisition surfaces.

### 5.1 Token layer

30 `:root` custom properties in `app/globals.css:18-77` + 46 leaf colors in `tailwind.config.ts`. **~19 hex values are hand-duplicated across both files** — `docs/18-sunlit-lawn-theme-spec.md:219` explicitly instructs this ("update in **both**"), so the spec designs the drift in.

- **Two different "reds" ship:** `scribble.red: #E8453C` (`tailwind.config.ts:64`) vs `--marker-red`/`danger: #D83F6B` (`docs/02-design-system.md:65`). `NotificationBell.tsx:74` uses the former.
- **Dead reference:** `globals.css:371` justifies a contrast fix against `--ink-300`, which is not defined.
- **Phantom token:** `AppShell.tsx:79` reads `var(--tw-padding-bottom-fallback, 88px)` — defined nowhere. Bottom-nav clearance hardcodes 88px and ignores `env(safe-area-inset-bottom)`.
- **Fonts are compliant** — all 5 load via `next/font/google` (`app/layout.tsx:2,7-40`). Fragile though: `globals.css:20-24` re-declares the same var names with literal family names that don't match next/font's hashed names. It works only because next/font's class is unlayered.
- ~550 stock-Tailwind-palette references across 43 files. **~550** is the bulk; `app/page.tsx` (38) and `app/onboarding/page.tsx` (33) are built on amber/rose/indigo.

### 5.2 Spec violations (confirmed in code)

| Spec promise | Actual |
|---|---|
| §9 ships `text-body` + `text-meta` classes | **Neither is defined** — and `text-meta` is used in production at `explore/page.tsx:196`, so it renders at 16px |
| "Every route's error.tsx imports `PageError`" | Root `app/error.tsx:27-32` rolls its own off-brand card |
| `EmptyState` = "the single empty-state component used across the app" | **Zero importers** |
| §18 error states use Whiteboard `small` | `PageError.tsx:49-50` uses a 📓 emoji |
| §10 "brand accent is a single muted purple" | Toasts use stock green/red/amber/blue (`ToastProvider.tsx:18-21`) |
| §19 "no drop shadows beyond shadow-sm" | `shadow-xl`, `shadow-2xl` (`NotificationBell.tsx:86`, `ThankYouMessagePopup.tsx:87`) |
| Doc 02 "no emoji-as-UI-icons" | 🔔 is the nav bell (`NotificationBell.tsx:72`), 🎓 the avatar placeholder (`onboarding/page.tsx:233`), 📓 in error states |
| Doc 02 "touch targets ≥ 44px" | ~20px and ~24px buttons (`NotificationBell.tsx:90,149,156`) |
| Doc 02 "no gradient buttons" | `bg-gradient-to-br … shadow-2xl` (`app/page.tsx:127`) |
| §14 "no JS animation libraries" | `framer-motion` in `CountdownTimer.tsx:4` |

Adoption is uneven, not absent: `pencil-button` 18 uses, `sketch-panel` 16, `text-eyebrow-uppercase` 13 — but `.text-marker` **0**, and `.input` is used 3× against `.label`'s 334. The form primitives are largely bypassed for raw Tailwind.

### 5.3 Theme drift — still the top visual defect

Live on `/onboarding` today: `bg-amber-600` CTA, amber/rose/indigo gradient banner, `✨` in the wordmark and in "Virtual Shirt #1 Ready", 🎓 as the avatar placeholder. The brand violet `#6f54df` appears **nowhere** in the acquisition flow. White-on-`amber-600` measures ≈ **2.2:1** — a WCAG fail on the primary CTA.

**The undefined-token bug is worse than it looks: `ink-800` is referenced in 8 places across 6 files** — `app/page.tsx:45,111`, `app/onboarding/page.tsx:250,320`, `app/dashboard/page.tsx:353`, `app/dashboard/ApprovalInbox.tsx:128`, `app/dev/ia-map/InteractiveIAMap.tsx:226,315`. The `ink` scale is 100/300/500/700/900, so `ink-800` emits no CSS: **hover states on three primary CTAs do nothing, and the text inherits.** That includes the "Check" button on onboarding and the CTA on the landing hero.

**Live screenshot confirms:** landing and onboarding meet visitors in a different app than the one returning users live in.

### 5.4 Accessibility

**High**
- `NotificationBell.tsx:83-86` — trigger declares `aria-haspopup="dialog"`, but the panel has no `role="dialog"`, no focus trap, no Escape handler.
- **No Escape handling anywhere in the app.** The only two `keydown` listeners are undo/redo and zoom.
- `NotificationBell.tsx:112-119` — `<div onClick>` notification rows with no `role`/`tabIndex`/key handler. Keyboard and screen-reader users cannot mark read.
- **The canvas has no alternative.** `DrawingCanvas.tsx` creates canvases with zero `aria-label`, `role`, or `sr-only` text. The entire signing surface is unreachable non-visually.
- **Hidden file inputs are keyboard-dead.** `className="hidden"` (→ `display:none`, removed from the a11y tree) at `ScribbleMobileSheet.tsx:359-364` and `ScribbleInspectorPanel.tsx:106-111`. The voice-note upload is mouse-only.
- Contrast failures: `text-gray-400` (#9CA3AF) on white ≈ 2.6:1 (`NotificationBell.tsx:90,98,130`, `yearbook/page.tsx:152,156,166`); `text-amber-600` on `paper-100` ≈ 2.95:1 (`app/page.tsx:39`); `PageError.tsx:53` `text-ink-300` ≈ 3.8:1 at 11px.

**Medium**
- Unlabeled textareas (placeholder only): `ScribbleMobileSheet.tsx:273,416`, `ScribbleInspectorPanel.tsx:136,237`.
- **Dead enabled button** — "Layer" at `ScribbleInspectorPanel.tsx:210-216` has no `onClick` and no `disabled`, only `opacity-50`. AT announces it as actionable.
- Broken `aria-controls` — `ScribbleMobileSheet.tsx:160` points at a tabpanel host that unmounts when `hasSelection` (`:189`).
- Toast live region — `ToastProvider.tsx:42` returns `null` when empty, so the `role="status"` node is inserted *with its content*. A known dynamic-live-region anti-pattern; announcements are unreliable.
- `TopNav.tsx:46-65` has no `aria-current` (BottomNav does) and its `<nav>` lacks the `aria-label` BottomNav has.

**Compliant — cite these:** `PlaceBackground.tsx:118,125` (`aria-hidden` + `alt=""` on decorative layers); `BottomNav.tsx:44,54,75,99` (full `aria-current`); `globals.css:271-279` (`:focus-visible` pinned to all 5 button families).

### 5.5 Responsive

Mobile-first is genuinely handled on the signature pages — `dashboard/page.tsx` uses 29 breakpoints and fixed widths are safely scoped. Confirmed risks:

- **Sticker grid overflows.** `StickerPicker.tsx:27,35` — `grid-cols-6` + `gap-2` with `min-w-14` needs 6×56 + 5×8 = **376px** in a ~266px panel. (The mobile path passes `columns={4}` and is safe.)
- `app/page.tsx:24` — `min-h-screen … overflow-hidden` on a content-heavy landing page **clips vertical overflow**.
- Notification panel is `w-80` (320px) at `right-0` — tight at 360px.
- Zero-to-one breakpoint variants: `onboarding/avatar/page.tsx`, `admin/page.tsx`, `settings/page.tsx`, `shirts/[shirtId]/scribble/page.tsx`, and all 5 `admin/*` pages with `whitespace-nowrap` action rows (`admin/yearbook/page.tsx:143,152,287,293,390`) — table rows that cannot wrap.

### 5.6 Motion

`PlaceBackground.tsx:52,72-76` is the **only** consumer of `usePrefersReducedMotion` and it is correct. The global CSS block (`globals.css:592-635`) is thorough.

**Not compliant:** `CountdownTimer.tsx:96-107` — `AnimatePresence`/`motion.span` driven by rAF and inline styles, which `globals.css:596` cannot reach. It animates every second as digits roll. This is on the **landing page**.

---

## 6. What changed since the last audit (good)

- **Onboarding is much better.** "What is your enrollment number?" with no school picker, and copy that explains the mechanism ("The convocation list confirms your program — there is nothing to pick") is the right v2 instinct. The old "hard-locked to Bennett CS" problem is gone.
- **Owner chrome** landed — the owner/visitor split on profile is now modelled.
- **One-door access resolver** — four gates now route through `lib/identity/access.ts` instead of four drifting copies.
- **The v1 request flow is retired** at the schema level.
- **Theme discipline on authenticated pages is real** — the whiteboard identity element, sketch panels, sticker notes, focus rings, 16px inputs and per-route skeletons are all craft-correct.
- 116 tests pass, covering identity, roster, signing, occupancy, reactions, safety and sanitisation.

## 7. Dead code (grep-confirmed)

- `lib/supabase/prototype.ts:44,65,72,85` — `getPrototypeRoster`, `createShadowStore`, `loadPrototypeDataForBolt`, `tableNames` each have exactly one hit: their own definition.
- `src/features/scribble/components/ScribbleActions.tsx`, `ScribbleNotePanel.tsx` — not imported anywhere.
- `components/ui/EmptyState.tsx` — zero importers.
- `components/nav/AppShell.tsx` + `TopNav.tsx` — the entire desktop nav layer, unreachable.
- `canvas-confetti` — installed, `confetti-in` keyframe defined, **zero runtime usage**. Either build the celebration moment or drop the dep.

---

## 8. Recommended order

**Today — stop the bleeding**
1. **Fix `prototype.ts:39`** (invert to `false`) and add a `NODE_ENV === 'production'` kill-switch. Set `PROTOTYPE_MODE=off` in every deploy env. **This is one line and it is the difference between a broken demo and a total auth bypass.**
2. Delete the duplicate export at `prototype.ts:56` → green test suite.
3. Commit the working tree.
4. Decide: kill prototype mode from the shared clients, or return a discriminated union. Either way this clears most of the 295 type errors.

**Before any friend test**
5. Stand up the backend (new Supabase project, run `supabase/migrations/v2/001` + `002`, point `.env.local` at it). Nothing else is verifiable until this is true.
6. Fix the two navigation breaks that block real use: `/guest` → `/onboarding/guest`, and give `/yearbook` a nav entry.
7. Reconcile the admin setting keys with the keys the write path reads (`scribbling_enabled` vs `disable_scribble_writes`; `deadline_date` vs `scribble_deadline`). A kill-switch that does not kill is worse than none.
8. Fix the occupancy recount in `scribble/remove/route.ts` to match `place/route.ts`, and stop returning `{success:true}` when the write failed. Same for the three deletes in `shirt/access/route.ts` — a block that silently fails is a safety hole.

**Then, in value order**
9. Finish the theme on the front door: one CTA colour (brand violet or `ink-900`), kill `ink-800`, remove the emoji, drop the gradients. Cheapest visible credibility win in the app.
10. Fix `text-body` / `text-meta` in `globals.css` — one class definition fixes a live rendering bug on Explore.
11. Onboarding: surface the share step (v2 spec calls it non-negotiable — the moment of highest motivation is unharvested), and tell the user in approval mode that their mark is being held.
12. A11y batch: `NotificationBell` dialog semantics + Escape, `sr-only` instead of `hidden` on file inputs, `onClick`/`disabled` on the Layer button, an alternative to the canvas.
13. Collapse the token duplication: point `tailwind.config.ts` colors at `var(--paper-100)` etc. so one edit means one file.

---

## Appendix — commands run

```bash
npm run type-check    # FAIL — 295 errors / 49 files
npm test              # FAIL — 116 pass, 1 suite parse error (prototype.ts dup export)
npm run lint          # PASS — 0 errors, 1 warning (no-img-element, app/onboarding/page.tsx:231)
npm run dev           # OK — Next 16.2.6, Turbopack
```

Live checks: `/` → redirects to `/onboarding` under `DEV_AUTH_BYPASS`; `/dashboard` → redirects to `/onboarding`; Supabase host **NXDOMAIN** on DNS resolution and `HTTP FAILED` on `/auth/v1/health`; `/onboarding` renders 200 with zero console errors.