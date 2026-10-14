# Scribbl — End-to-End UX Audit

**Date:** 2026-10-05 · **Reviewer lens:** Product Manager + Senior Product Designer
**Build reviewed:** branch `scribble-core-rework` (v2.0.0), dev server on localhost
**Method:** live walkthrough (mobile 390×844 primary, code-verified), full code inventory of all routes/components, review of docs 13–18, 22–23 (v1 audits) and v2 product spec, contrast/token measurement, design-skill (app-designer) scan of the current theme.

> **Verification caveat (important).** The app's Supabase project (`…supabase.co`) **no longer resolves** — the backend behind this app is gone (NXDOMAIN on 1.1.1.1 and 8.8.8.8). Everything that needs the database could not be exercised live: dashboard, explore, studio, profile, yearbook, groups, settings, activity. Findings for those screens come from a line-level code inventory and the project's own audit docs, and are marked **[code]**. Findings I could exercise live are marked **[live]**. Fixing the backend is itself Finding #1.

---

## 0. Executive summary

Scribbl's product thinking is unusually good — the concept (one month, one ritual, then it becomes an archive) is sharp, the docs are disciplined, and v1's review culture left a genuinely honest paper trail. The current implementation, however, is **not shippable this week**, for reasons that have nothing to do with taste:

1. **The backend is dead.** Every authenticated surface is unreachable. Nothing can be tested end-to-end. P0.
2. **Onboarding cannot complete under dev auth** — the founder's own friend-test path dead-ends with a lying error message. P0.
3. **The growth loop is severed.** v2 doc calls the WhatsApp share "non-negotiable… Explore does not recruit 500 people" — yet onboarding has **no share step**, and the bottom-nav FAB ("Sign someone's shirt") links to an `?filter=unsigned` parameter **Explore never reads**. P0 for launch.
4. **The front door lies.** The landing countdown silently defaults to "14 days from now" and resets on every visit — on a product whose entire emotional premise is a *real, shared deadline*. P1.
5. **The flagship theme is drifting apart.** The "Sunlit Lawn" system (cream paper, ink browns, violet brand) is applied on authenticated pages, but the **landing and onboarding — the first surfaces anyone sees — are amber/orange with rose-indigo gradients**, below-contrast, and use undefined tokens. New visitors meet a different app than the one returning users live in. P1.

Score as it stands (PM lens): **~55/100 — strong concept, broken spine.** The single best news in this audit: most of the gap is *wiring and discipline*, not redesign. The design system that exists on the authenticated pages is worth keeping — it just needs to be enforced everywhere, and its two load-bearing components (place illustrations, avatar) are still placeholders.

### Top 10 issues (ranked)

| # | Issue | Sev | Where |
|---|---|---|---|
| 1 | Supabase project unreachable — app cannot run at all | P0 | env/infra |
| 2 | Onboarding can't complete under dev-auth; error misattributes cause ("fill in your name" with fields filled) | P0 | `app/onboarding/page.tsx:209` |
| 3 | Share-the-link moment missing from onboarding (the growth loop v2 calls non-negotiable) | P0 | `app/onboarding/page.tsx` |
| 4 | FAB "Sign someone's shirt" → `/explore?filter=unsigned`, param never read — dead core-loop CTA | P0 | `BottomNav.tsx` / `app/explore/page.tsx` |
| 5 | Landing countdown is fake (defaults to now+14d, resets every visit) | P1 | `app/page.tsx:119`, `CountdownTimer.tsx:48` |
| 6 | Theme drift: landing + onboarding amber/rose/indigo, off-token, 2.2–3.0:1 CTAs, undefined `ink-800` token | P1 | `app/page.tsx`, `app/onboarding/page.tsx` |
| 7 | Yearbook — the product's payoff — is not linked from any navigation | P1 | `app/yearbook/page.tsx` |
| 8 | Dashboard still the 9-block scroll doc 13 flagged; no single hero; stat strip vs groups vs queue vs activity compete | P1 | `app/dashboard/page.tsx` |
| 9 | Studio gaps from doc 23 still open: whole-object eraser, voice = file upload not recording, status text not toasts, tablet 768–1023 gets mobile sheet | P1 | `src/features/scribble/*` |
| 10 | Two parallel onboarding/avatar systems; main flow has hardcoded default avatar, no resume; friend-test users all stranded un-onboarded | P1 | `app/onboarding/*` |

---

## 1. Product lens (PM)

### 1.1 Positioning — what this is, and whether the UI knows it

The v2 spec is one of the clearest product one-pagers I've seen: *"We missed scribble day. Sign before convocation. Then we keep a public record of us."* Three audiences (verified / guest / family), one batch, one month, then archive. The UI mostly honors this — but three surfaces contradict the spec:

- **[live] Landing promises voice notes** ("Collect drawings, doodles, and voice notes") — voice is explicitly **out** for this ship (v2 doc: "Voice: out"). Users will hunt for the feature.
- **[live] Landing shows a countdown to a fake date** (see 4.4) — the deadline is the product's dramatic engine; a rolling one cheapens the ritual.
- **[code] The yearbook — "the point of the whole month" — is an orphan route.** No nav tab, no dashboard card links to it (only the dashboard's "sign next" queue and profile pages link out). The emotional payoff is unreachable by normal navigation.

### 1.2 The moments that matter (and their current state)

A one-month ritual app lives or dies on four moments:

1. **"Send this on WhatsApp tonight."** The share step. **Missing from onboarding** [live]. The dashboard hero has a share CTA, but the moment of highest motivation — I just claimed my shirt — is not harvested. v2 spec: "Onboarding share step is non-negotiable." This is the highest-ROI fix in the entire audit.
2. **First signature received.** The aha-backwards moment ("someone signed MY shirt"). Today: activity inbox + unread badge [code]. No push, no email trigger on first-ever signature (digest route exists but is batch-shaped). For a one-month product, the "first mark" notification is the retention engine. **Build the webhook moment.**
3. **The seal / flip.** Shirts locking into the yearbook (doc 22 C2.4: "not built"). The product pivots from *signing* to *archive* in November; right now nothing in the UI anticipates it. Even a countdown-to-seal state on the dashboard would make the phase legible.
4. **The public archive.** Yearbook goes public, family visits, `/u/slug` pages get shared. Slugs are generated in the API [code] but profiles are still raw UUID routes — unfriendly to WhatsApp sharing, the actual channel. Doc 14 flagged this; still open.

### 1.3 Funnel walkthrough (as far as the live app allowed)

| Stage | State | Notes |
|---|---|---|
| Land | ✅ [live] | Strong voice ("Wear the shirt. Let everyone sign it."), clear CTAs. Fake countdown + off-theme amber undermine it. |
| Sign up | ⚠️ [live] | OTP + Google. Copy explains mechanism ("First profile setup uses your university email OTP") rather than outcome. Domain-allowlist errors are codes, not sentences [code]. |
| Onboard | ❌ [live] | Cannot complete under dev-auth (Finding 2). Step 2 hard-locks to Bennett CS with a good "request program" escape hatch. No share step. |
| First session (dashboard) | ⚠️ [code] | 9 blocks, 4 competing sections, stat strip uses hardcoded `/150` goal (doc 13 asked for batch-relative; still open). Personalize banner (amber/rose/indigo gradient) is off-system. |
| Core loop: sign someone | ❌ [live+code] | FAB's `?filter=unsigned` dead → the loop opens with an unfiltered directory. Permission UX (can/request/locked) is well-modeled in code and tests, but request *status* lives in dashboard "pending" — discoverability of "my outgoing request was approved" depends on the user coming back. |
| Core loop: be signed | ⚠️ [code] | No first-signature celebration; confetti dependency installed but unused. Sticker notes show received notes — good. |
| Seal & yearbook | ❌ | Transition not built (doc 22 C2.4). Yearbook orphaned. |
| Archive | ⚠️ [code] | Print stylesheet for yearbook is a lovely touch. Export requests modeled. |

### 1.4 Metrics to instrument before relaunch

The codebase has no analytics. For a 4–8 week live window, five numbers decide everything:

1. **Share rate:** % of onboarded users who copy/share their link within session 1 (the onboarding share step makes this measurable).
2. **Activation:** % of invited users who complete onboarding + sign one shirt.
3. **Signatures per shirt** (distribution, not average — the ritual is peer-to-peer; median vs top-decile spread is the cold-start alarm).
4. **% of batch onboarded** vs the 500–1,000 "real archive" threshold — should be the dashboard's batch number, not `/150`.
5. **Request-to-signature latency** (approval-gated shirts): if approval waits >24h, the loop dies.

### 1.5 Scope discipline (credit where due)

The v2 "not" list (no Instagram, no storage, no print-on-demand, no juniors) is respected in the implementation — groups are capped, photos are constrained (3 solo + 1 convocation slot), photos-on-shirt is refused. This restraint is the product's best asset. Keep it.

---

## 2. Design lens (senior product designer)

### 2.1 The current theme ("Sunlit Lawn") — validation verdict

**What the theme gets right** (keep these): the whiteboard component is a genuinely ownable identity element (aluminum frame, marker colors, Permanent Marker text — it *is* scribble-day); the sketch-panel/paper-note/sticker vocabulary is cohesive and warm; asymmetric hand-drawn radii are a nice signature; safe-area handling, 16px inputs (iOS zoom guard), `prefers-reduced-motion` block, focus-visible rings, and per-route loading skeletons are all craft-correct.

**What the scan and measurements flag** (full scored critique in `design/CRITIQUE.md`, rendered evidence in `design/shots/`):

| Finding | Evidence | Severity |
|---|---|---|
| **Front-door drift:** landing + onboarding use `amber-600` CTAs (7 occurrences on landing, 8 in onboarding) with rose/indigo gradient banners — the brand violet `#6f54df` appears nowhere in the acquisition flow. White-on-amber-600 measures ≈ **2.2:1**, amber-on-cream ≈ **2.95:1** — WCAG fail on the primary CTA. | live screenshots + token grep | P1 |
| **Undefined tokens ship:** `hover:bg-ink-800`, `text-ink-800` — the ink scale defines 100/300/500/700/900. These classes generate nothing (hover does nothing; text inherits). | `app/page.tsx:45,111` | P1 |
| **Emoji in chrome:** ✨ in the wordmark row and "Virtual Shirt #1 Ready", 🎓 as the avatar placeholder, 📓/📖 in error/empty states — breaks the hand-drawn vocabulary the rest of the system earns. Emoji-as-icon is the most recognizable AI-design tell. | live + `app/onboarding/page.tsx`, `app/yearbook/page.tsx` | P1 |
| **Meta text fails contrast:** `ink-300 #A07040` on `paper-100` = **3.98:1** (<4.5 for small text) — used for timestamps/meta. `marker-green on whiteboard` = 3.74:1 (small text fails). | measured | P1 |
| **Place illustrations are placeholders** (doc 22 C2.1, confirmed unchanged) — the theme's single biggest visual asset is a stand-in; the "golden hour lawn" that names the theme is not actually rendered. | `public/illustrations/place/*.svg` | P1 |
| **Dashboard squint-test failure:** no single landing point — gradient banner, hero cluster, stat strip, whiteboard, groups, queue, activity all at similar visual weight (doc 13 flagged the density; round-4 reduced it but the strip + banner + queue still compete). | code + doc 13 | P1 |
| **Body font is Inter by default.** The handwritten display voices (Caveat/Patrick Hand/Permanent Marker) are chosen; Inter is what was left. Defend it or pick a face with a stated reason. | `app/layout.tsx` | P2 |
| **No dark mode at all** (no `dark:` variants, no `.dark` class). For a product used at farewell parties (evening events), the light-only constraint is felt. | `globals.css` | P2 |
| **Three accent hues + semantic colors on one screen** (violet brand, amber CTAs, green progress, red badges, marker colors) — violates the one-accent-one-role rule; the marker palette is *content* (ink colors) and should not double as UI accent. | `tailwind.config.ts` | P2 |

**Net verdict on the current theme:** a real direction with a nameable identity (rare), executed at ~70% coverage — enforced on the community surfaces, abandoned on the acquisition surfaces, and waiting on two placeholder assets (place art, avatar heads) that carry the whole "lawn" premise. It does **not** need to be thrown away; it needs to be *finished*. Section 4 (theme concepts) offers three additional directions if the team wants a stronger departure, rendered and scored.

### 2.2 Information architecture & navigation

- **[code] Five near-identical sticky headers, hand-rolled per page.** Dashboard shows Explore/Groups links; Explore shows only bell+avatar; Yearbook swaps in a batch filter. `AppShell`/`TopNav` exist and are **mounted by zero pages**. Consequence: inconsistent back behavior, inconsistent brand lockup, four chances to drift per new page. Mount one shell.
- **[code] BottomNav is the only consistent spine** (Home / Explore / FAB / Activity / Profile) — good labels, correct `aria-current`, 56px targets, unread badge. Two issues: the FAB's dead filter param (Finding 4), and **Profile tab lands on your own profile page** which doubles as "view someone else's shirt" surface — the owner's context (edit/customize) and the visitor's context (sign/request) are the same layout with swapped CTAs; it works, but the tab should perhaps be "My shirt" with owner-state first (customize, share, stats) rather than a generic profile.
- **[code] Depth is shallow and flat:** dashboard → profile → studio is the only 3-hop path; groups/yearbook/activity are single-hop. This is *correct* for a one-month app — resist adding hierarchy.
- **[code] `/dev/*` routes are in the public allowlist** (`lib/utils/role.ts:55` lists `/dev`). They're gated behind env flags in practice, but the *route-level* allowlist should not include `/dev` in a production deploy — defense in depth.

### 2.3 Screen-by-screen highlights

**Landing [live]** — best copy in the app; worst token discipline. Fixes: one CTA color (brand violet or ink-900), real deadline, drop "voice notes", replace the 3-card amber/rose/indigo "how it works" with the whiteboard component (the identity carrier), unblur the sneak-peek to a designed placeholder (a blurred fake grid reads as stock).

**Onboarding [live]** — the live identity preview card is a genuinely good pattern (watch the name appear in Caveat as you type). Failures: cannot complete under dev-auth; 🎓 emoji placeholder; hardcoded default avatar config (`m-classic-straight`, skin_03) written server-side; no resume; **no share step**; step-2's "Contact Me / Add Course" opens a modal whose success state is easy to miss. Add the share step, wire the real avatar flow (or defer avatar honestly: "shirt first, face later"), persist partial state.

**Dashboard [code]** — doc 13's compression ask is half-done. Cut to: hero (avatar + shirt status + one number that matters: *marks received*), share CTA, sign-next queue (the loop), activity. Move groups + pending-requests into Explore/Activity respectively. The "Personalize Your Virtual Shirt & AI Head" gradient banner is the loudest element on the screen and off-system — it's also a settings task, not a dashboard task.

**Explore [code]** — the whiteboard header is strong. Missing: the `filter=unsigned` behavior (the FAB's promise), and a "recently active" sort (signing is a social act; surface who's online now — the data exists, online dots render elsewhere).

**Scribble Studio [code]** — the most ambitious surface (Fabric.js, two canvas modes, presence, drafts, mobile bottom-sheet). Doc 23's open items are the worklist: whole-object eraser (Z3), voice-record (FL5), toast status (LY3), tablet layout (LY1), tool a11y (LY4). One designer note to add: **"Just sign" is the best UX idea in the app** — the one-tap signature mode that wipes the canvas and preloads your name. It should be the *default* entry for first-time signers, not a secondary CTA, and its success moment should be celebrated (sticker-lift animation; the confetti dep is already installed).

**Profile / ShirtView [code]** — "% filled" pill and per-scribble tap-to-remove/report are right. The shirt map (3 occupancy bars) is clever but abstract — label the zones in plain words ("collar 2 free") or drop it. Empty state copy ("Nobody has signed this surface yet. Be the first mark on the fabric.") is excellent.

**Yearbook [code]** — orphaned; plain `bg-paper-100` with no place layer — the least themed page carries the most meaning. Give it the whiteboard/search identity, link it from the nav (seasonally: during signing it can live behind "Class of 2026"; after seal it *is* the app).

**Groups [code]** — "Wings & circles" header copy is charming; mini-whiteboard cards carrying the group name is the system working as designed. Keep.

**Settings [code]** — intentionally quiet; fine. Account deletion = "contact your admin" is friction that doc 08 accepted for scale, but for a class of 1,400 a self-serve delete with confirm is kinder and cheaper than admin tickets.

**Errors/empty [code]** — three idioms coexist (whiteboard empties, dashed rows, `EmptyState` component barely used); root `error.tsx` is a plain white card off-brand while dashboard's error is a paper-note ("📓 Something tore the paper") — pick the whiteboard idiom everywhere. Em-dash/exclamation copy rules from the theme docs are respected.

### 2.4 Accessibility

- Verified: 16px inputs, focus-visible rings, `aria-current`, 56px nav targets, reduced-motion block, 44px-ish buttons in the studio sheet.
- Fails: amber CTA contrast (≈2.2–3:1), `ink-300` meta text (3.98:1), marker-green on whiteboard (3.74:1 small text), icon-only buttons with missing `aria-label`s in places [code], emoji-as-icon read literally by screen readers ("graduation cap" before the name).
- No keyboard path documented for the drawing canvas (Fabric toolbar needs roving focus + shortcuts beyond Ctrl+Z — doc 23 LY4).

### 2.5 Trust, safety, moderation (PM-required for a public archive)

The plumbing is serious: sanitize-svg tests, rate limiting, permission matrix tests, report user/scribble routes, admin moderation queues, suspension/deletion roles. The *UX* of safety is where work remains: report affordances exist on profile and scribbles [code], but there's no visible "this is moderated" reassurance on the public yearbook for family visitors, and the onboarding "Contact Me / Add Course" modal is the only support surface — name it "Help" somewhere persistent.

---

## 3. Technical UX notes (shipped-behavior bugs found live)

1. **[live]** With `DEV_AUTH_BYPASS=1`, the proxy treats *every* visitor as an authed user (env flag, not cookie-scoped), and the dead DB profile lookup sends all routes to `/onboarding` — including `/` and `/dev/*`'s siblings. The friend-test runbook (doc 12) runs on this path; it is currently unusable.
2. **[live]** Onboarding submit checks `userId` from a client-side `supabase.auth.getUser()` that has no session under dev-auth (server-side only bypass) → permanent "Please fill in your name and enrollment number" with both fields visibly filled. The message conflates three failure modes; log the real one.
3. **[live]** Full-page screenshot/scroll on landing tiles the fixed `PlaceBackground` 4× (fixed-position art + full-page capture). Minor, but fixed-attachment backgrounds also cost paint on mobile Safari — the theme docs already note 2g skip; consider scroll-native parallax.
4. **[code]** `canvas-confetti` installed, `confetti-in` keyframe defined, zero runtime usage. Either build the celebration moment or drop the dep.
5. **[code]** `.env.local` points at a deleted Supabase project; there is no `.env.example` sync discipline (`.env.local.example` exists — good — but `SITE_URL`, digest secrets etc. should be re-audited at relaunch).

---

## 4. Theme directions (summary — full work in `design/`)

Using the app-designer process (audit → 3 concepts from different source families → render on the real core screen → mechanical scan → fresh-eyes critique), I generated three **new** theme directions for the core screen (the shirt/profile view), each required to differ from Sunlit Lawn on ≥3 of 5 columns (source family / ground / type / accent hue / richness):

| Direction | Concept | Columns (family/ground/type/accent/richness) | Best if… |
|---|---|---|---|
| **A — "The Last Night"** | The jersey on the hostel floor at midnight — markers, lamplight, everyone signing before dawn | object / **dark** / grotesque (Archivo Expanded) / marker red / 3d-object | You want the signing ritual to feel like the farewell party it is |
| **B — "The Annual"** | The school annual's last page — printed permanence, everyone's name, one stamp | printed / light (newsprint) / serif (Newsreader) / seal blue / photo | You want the archive/yearbook to be the hero, not the party |
| **C — "House Colours"** | The farewell assembly — the shirt's fabric colour fills the screen; the white shirt is the only object | play / **colour-field** / condensed (Big Shoulders) / neutral / colour-material | You want maximum energy and per-owner identity (shirt colour = ground) |

All three are rendered (mobile 390×844, real content, no placeholders) in `design/explore.html` → `design/shots/explore/sheet.png`, mechanically scanned (no FAILs; every warn answered in `design/DIRECTION.md`), and scored by a fresh-eyes critic in `design/CRITIQUE.md`. **The recommendation, with scores, is in that file; the one-line version: keep Sunlit Lawn's whiteboard component in any direction; Direction A (The Last Night) scored strongest on concept-carry and hierarchy, and its dark ground also finally gives the app an evening mode.**

---

## 5. Prioritized action plan

### P0 — unblock the product (this week)
1. **Restore a Supabase project** (new project, run `supabase/migrations` + seed, update `.env.local`, re-run friend-test smoke). Nothing else matters until this is true.
2. **Fix onboarding under dev-auth:** derive `userId` server-side (pass from the server component or read the dev cookie server-side), or render onboarding as a server component with a server action. Fix the error to name the real failure.
3. **Add the share step** to onboarding: step 3 = "Your link. Send it on WhatsApp tonight." (Web Share API + copy button + a real preview of the shirt). Measure share rate.
4. **Wire `?filter=unsigned`** on Explore (or repoint the FAB to a "Sign next" queue page) — the core loop's front door must not dead-end.

### P1 — make it feel like one app (next 2 weeks)
5. Re-token the landing + onboarding onto Sunlit Lawn (kill amber-600/rose/indigo, fix `ink-800`, fix contrast: bump `ink-300` to `ink-500` for meta text, marker-green large-only).
6. Real deadline in `CountdownTimer` (from phase flags), and a dashboard "signing closes in…" state.
7. Mount `AppShell` everywhere; delete the five hand-rolled headers; add Yearbook to the nav (and to the FAB long-press or overflow post-seal).
8. Replace emoji-in-chrome with the sketch vocabulary (hand-drawn SVG glyphs or Lucide, one weight); replace 🎓/✨/📓/📖.
9. Commission/draw the **real place illustrations** and finish the **avatar pipeline** (doc 19's open items) — these two assets carry the theme's entire premise.
10. Compress the dashboard to hero + share + sign-next + activity; move the personalize banner into Settings/Profile.
11. First-signature moment: email/push on first mark + sticker-lift celebration on the profile (use or remove the confetti dep).
12. Studio worklist from doc 23 (Z3 eraser, FL5 voice-record, LY3 toasts, LY1 tablet, LY4 a11y).

### P2 — polish & phase 2 readiness
13. Pick one navigation idiom for empty/error states (whiteboard) and one icon set/weight.
14. `/u/[slug]` friendly URLs (slugs already generated) for WhatsApp-clean shares.
15. Defend or replace Inter as body; define the 5–7-step type scale as utilities and lint against raw sizes.
16. Dark mode: if Direction A wins, the dark theme arrives for free; otherwise design one properly (not an inversion).
17. Self-serve account deletion with confirm; "Help" entry point in the shell.
18. Seed E2E tests for the three golden paths (onboard→share; sign→publish; receive→react) — the unit suite is strong; nothing protects the loop itself.

---

## 6. What's already good (do not regress)

- Product scope restraint (the "not" list is respected in code).
- The whiteboard component and hand-drawn radius/shadow vocabulary — ownable, warm, and consistently loved on authenticated pages.
- The "Just sign" signature mode — best interaction idea in the app.
- Permission matrix, sanitizer, rate-limit, and contract tests — serious safety plumbing for a student project.
- Mobile craft: safe areas, 16px inputs, reduced-motion, loading skeletons per route, print stylesheet for the yearbook.
- Honest documentation culture (docs 13–23) — this audit could build on it directly.
