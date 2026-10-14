# 22 — App Audit & Security Review

> Full review of Scribbl as of 2026-06-09 (branch `scribble-core-rework`, v2.0.0). Four parts:
> **A.** Security scan · **B.** Database audit · **C.** UX / UI audit + theme improvements · **D.** Onboarding flaws.
> Each finding has a severity and a concrete fix. Headline: **the app is genuinely well-built and well-secured** — the findings below are hardening and polish, not fires.

---

## A · Security scan

**Scope:** auth flow, RLS + grants, all API routes, file upload, SVG handling, OAuth, dev backdoors, secret handling, admin authz.

### A.0 Posture summary — what's already done right

This codebase is more secure than the large majority of student/indie apps. Confirmed-strong controls:

- **No XSS surface from user content.** There is **no `dangerouslySetInnerHTML` anywhere** in the app. User-drawn scribble SVGs render only as `background-image: url(data:image/svg+xml,...)` (`components/shirt/ShirtView.tsx:484`). SVGs loaded via CSS background / `<img>` cannot execute scripts, so even a sanitizer bypass yields no script execution.
- **Defense-in-depth SVG sanitizer** anyway (`lib/utils/sanitizeSvg.ts`): blocks `<script>`, `<foreignObject>`, event handlers, `javascript:` URLs, external refs, and CSS `url()` exfiltration; caps at 512 KB.
- **Hardened file upload** (`app/api/avatar/upload-head/route.ts`): validates **magic bytes** via `file-type` (never trusts client MIME), re-encodes through Sharp (strips EXIF + any polyglot payload), caps size, rate-limits, writes to a path keyed on the authenticated `user.id` (no path traversal).
- **Secrets are clean.** `SUPABASE_SERVICE_ROLE_KEY` is server-only and never appears with a `NEXT_PUBLIC_` prefix (grep-verified). `.env*.local` / `.env` are gitignored and **not tracked** (only `.env.local.example` is in git).
- **RLS on every table** (`002_rls.sql`) plus **column-level grants** (`008_security_hardening.sql`) that restrict `email`, `enrollment_number`, `is_admin`, suspension state to the service role — normal authenticated clients literally cannot `SELECT` those columns.
- **Privileged writes go through service-role API routes only.** Clients can't insert/update `scribbles`, `shirts`, or forge `notifications` (insert policy = `service_role` only).
- **Auth is layered.** The token is validated server-side (`supabase.auth.getUser()` in `proxy.ts` and `lib/auth/server.ts`), and account status (`is_deleted` / `is_suspended`) is **re-checked at the API boundary** (`requireApiUser`) so a deleted-but-still-tokened user can't keep writing.
- **Soft-deleted accounts are refused** at three layers: OAuth callback, proxy, and API.
- **OAuth `next` param is validated** against open-redirect (must be relative, not `//`, not `/api/`).
- **Dev auth bypass is hard-disabled in production** (`isDevAuthBypassEnabled()` returns false when `NODE_ENV === 'production'`); the `/dev/as/[slot]` route 404s in prod.
- **Signups are domain-gated** (`getAccountKind`): off-domain Google logins become locked-down guests who can't own shirts and can only scribble via explicit invite.
- **Admin routes consistently** check `getUserIsAdmin`, write `admin_audit_logs`, and block admin self-modification.
- **Account-delete OTPs are hashed** (`account_delete_otps.otp_hash`), owner-only readable.
- **DB-level phase guard** trigger (`scribbles_phase_guard`) backs up the API phase check.

### A.1 Findings

| # | Severity | Finding | Location |
|---|---|---|---|
| S1 | **Medium** | SSRF via user-controlled `head_front_url` fetched server-side | `app/api/yearbook/export/route.ts:112`, `app/api/avatar/export/route.ts` |
| S2 | **Medium** | Rate limiting is in-memory per-instance — ineffective on serverless | `lib/utils/rateLimit.ts` |
| S3 | **Low–Med** | No security headers / Content-Security-Policy | `next.config.mjs` |
| S4 | **Low** | `voice_url` stored without host allowlist | `app/api/scribble/place/route.ts:154` |
| S5 | **Low / Info** | Any authenticated user can enumerate every face-photo URL | RLS grants + public heads bucket |
| S6 | **Info** | Onboarding writes profile directly from the browser (client-trust) | `app/onboarding/page.tsx:203` |

---

#### S1 — SSRF via `head_front_url` (Medium)

**What.** Users can update `head_front_url` directly (it's in the `grant update(...)` column list, migration 008). The export routes later do `await fetch(profile.head_front_url)` server-side to composite the yearbook card. A malicious user can set their own `head_front_url` to an internal address (`http://169.254.169.254/latest/meta-data/...`, `http://localhost:...`, internal services) and trigger the server to fetch it when an **admin** runs an export or the yearbook render job.

**Impact.** Blind SSRF. The fetched body is piped into Sharp (which throws on non-images), so direct data exfiltration is limited, but it can still probe internal endpoints / cloud metadata and is a real escalation path. Becomes more exposed in Phase 2 when the render job fetches these URLs in bulk.

**Fix.** Before fetching, validate the URL is on the Supabase storage host:

```ts
function isAllowedAssetUrl(u: string | null): u is string {
  if (!u) return false
  try {
    const { protocol, hostname } = new URL(u)
    return protocol === 'https:' &&
      hostname.endsWith('.supabase.co') &&        // your project host
      // optionally: hostname === new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
      true
  } catch { return false }
}
// ...
if (isAllowedAssetUrl(profile.head_front_url)) { const res = await fetch(profile.head_front_url, { redirect: 'error' }) }
```

Add `redirect: 'error'` so a 302 to an internal host can't bypass the check. Apply in **both** export routes and the future render job. (Bonus: validate on write in `upload-head` — the URL it stores is already storage-derived, so also reject any client attempt to set `head_front_url` to a non-storage host via a server-side settings route.)

#### S2 — In-memory rate limiting doesn't survive serverless (Medium)

**What.** `createFixedWindowRateLimiter` keeps counts in a module-level `Map`. On Vercel, each serverless instance has its own memory, and instances scale out / cold-start. So the "8 saves/min" and "3 uploads/min" limits are per-instance, not per-user-global — an attacker hitting the function concurrently or after cold starts gets many multiples of the intended limit.

**Impact.** The limiters work as a courtesy against accidental double-submits but won't stop a determined abuser from spamming scribble saves or burning the storage/Sharp budget. For a small friends cohort the blast radius is small; at any scale or under a targeted attack it's a real gap (cost + spam).

**Fix.** For the abuse-sensitive routes (`scribble/place`, `avatar/upload-head`, `scribble/voice`, signup), back the limiter with a shared store:
- Simplest with current stack: a Postgres table `rate_limits(key, window_start, count)` with an atomic upsert, or a Supabase RPC doing `INSERT ... ON CONFLICT ... DO UPDATE` and returning the new count.
- Or add Upstash Redis (`@upstash/ratelimit`) — a few lines, generous free tier.
Keep the in-memory limiter as an L1 cache in front of it. Document the decision either way.

#### S3 — No security headers / CSP (Low–Med)

**What.** `next.config.mjs` sets no response headers. There's no Content-Security-Policy, `X-Frame-Options`/`frame-ancestors` (clickjacking), `X-Content-Type-Options`, `Referrer-Policy`, or HSTS.

**Impact.** Defense-in-depth gap. A CSP is especially valuable for an app that displays user-generated SVG and embeds Supabase storage images — it caps the damage of any future injection and blocks the app from being framed.

**Fix.** Add a `headers()` block:

```js
// next.config.mjs
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Content-Security-Policy', value: [
        "default-src 'self'",
        "img-src 'self' data: https://*.supabase.co",
        "media-src 'self' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline'",   // tighten to nonces later if feasible
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "font-src 'self' https://fonts.gstatic.com",
        "frame-ancestors 'none'",
      ].join('; ') },
    ],
  }]
}
```

Test against Supabase realtime (`wss://`) and Google Fonts before shipping; loosen only what breaks.

#### S4 — `voice_url` host not allowlisted (Low)

**What.** `scribble/place` accepts any `voice_url` that merely `startsWith('http')`. It's stored and later served to other users' browsers as an audio source.

**Impact.** A signer could store an arbitrary URL that other users' browsers fetch when they play the note — usable for IP/UA logging of viewers, or pointing at unexpected content. Low severity (no server-side fetch), but it's user content served to others.

**Fix.** Require the voice URL to be on the Supabase storage host (same helper as S1). Voice notes are uploaded to your bucket anyway, so legitimate URLs always match.

#### S5 — Face-photo URLs enumerable by any authenticated user (Low / Info)

**What.** `head_front_url` / `head_back_url` are in the columns granted to `authenticated`, and the heads bucket is public-read. So any logged-in cohort member can read every other member's face-photo URL and open it. The UUID path isn't guessable, but the URL is right there in a normal `users` read.

**Impact.** For a cohort yearbook this is largely **intended** (faces are meant to be seen by classmates). It becomes relevant in Phase 2 for users who set `yearbook_visibility = 'batch'` or `'hidden'` — their *photo URL* is still readable even if their profile page is gated.

**Fix (optional, Phase 2).** If batch/hidden visibility must also hide the face asset, move heads to a private bucket and serve via short-lived signed URLs gated by the same visibility check. For v1 this is acceptable as-is — just document that "hidden" hides the page, not the raw asset URL.

#### S6 — Onboarding writes profile from the browser (Info)

**What.** `app/onboarding/page.tsx` writes `users` (including `onboarding_completed: true`) directly via the browser Supabase client, relying on RLS column grants. Every other mutation in the app goes through a server API route.

**Impact.** Not a vulnerability (RLS scopes it to the user's own granted columns), but it means onboarding field validation is client-trust only and is inconsistent with the app's "writes go through API routes" architecture. A user could set their own granted fields to arbitrary values. Low risk; mostly a consistency/robustness note. (See also D1 — the two onboarding flows.)

**Fix.** Route onboarding completion through a `POST /api/onboarding/complete` that validates server-side (name length, enrollment format, batch exists) and sets `onboarding_completed`. Aligns with the rest of the app and gives you one place to enforce rules.

### A.2 Things I checked that are fine

SQL injection (none — all queries are parameterized through supabase-js), open redirects (validated), CSRF on state-changing routes (Supabase cookie auth + same-site; consider an explicit origin check on POSTs for extra safety), admin authorization (consistent), secret leakage (clean), dependency surface (mainstream, current majors).

---

## B · Database audit

**Verdict: well-architected and production-ready.** Normalized, fully RLS'd, thoughtfully migrated (11 ordered migrations with idempotent guards, existence checks, and inline rationale tied to the docs). The yearbook schema is already in place. This is a strong foundation.

### B.1 Strengths

- Clean academic hierarchy (`academic_groups → programs → batches`) and a `users` table that mirrors `auth.users` with `on delete cascade`.
- Constraints that prevent impossible states: `users_admin_implies_verified`, `users_verified_xor_guest`, `users_deleted_not_suspended`, shirt-number range 1–3, `shirts_owner_or_group` (a shirt is owned **or** a group canvas, never both).
- Thoughtful indexing: partial indexes on unread notifications and non-hidden scribbles, composite indexes for hot queries.
- Phase machine + soft-degrade flags live in `platform_settings` as jsonb — flippable without a deploy, and backed by a DB trigger.
- Append-only `admin_audit_logs`; hashed delete OTPs; share-link attribution tables.
- Yearbook tables/columns shipped early (migration 010) so Phase 2 needs no migration.

### B.2 Issues & risks

| # | Severity | Issue | Detail / Fix |
|---|---|---|---|
| D-DB1 | Medium | **Divergent `avatar_config` writers** | Onboarding (`onboarding/page.tsx`) writes `avatar_config` with `skinTone.undertone`; `AvatarOnboardingFlow` → `/api/avatar/config` drops undertone and maps to 5 legacy skin IDs. Two shapes land in the same jsonb column. Pick one canonical schema, validate it with Zod on write, and migrate existing rows. (Ties to D1.) |
| D-DB2 | Medium | **`profile_slugs` may be unpopulated** | The table exists but I found no slug-generation on signup/onboarding. `/u/[slug]` (Phase 2) depends on it. Add slug generation at onboarding (or a backfill before the yearbook flip) and have `/u/[slug]` fall back to `user.id` until then. Verify before transition. |
| D-DB3 | Low | **Migration-state repair file present** | `migrations_repair_mark_001_to_008_applied.sql` implies the migration ledger was hand-repaired once. Confirm prod's `supabase_migrations` table matches the files so 009–011 are actually applied. Run a schema diff against prod. |
| D-DB4 | Low | **Computed yearbook stats are per-read** | Level, unique-signers, totals are computed on read. Fine for a profile page; for the grid (hundreds of cards) compute them once in the render job and cache (e.g. extra columns on `yearbook_renders` or a `yearbook_stats` view) to avoid N+1 aggregation. |
| D-DB5 | Low | **No DB feedback path for duplicate `enrollment_number`** | `enrollment_number` is `unique`; a collision surfaces as a generic save error in onboarding. Pre-check + a specific message (see D3). |
| D-DB6 | Info | **Dead/deprecated columns** | `scribbles.canvas_png_url` (deprecated) and `scribbles.is_anonymous` (never written — anonymous feature cut) are intentionally retained. Harmless; note them so future readers don't wire them up. |
| D-DB7 | Info | **`is_admin()` runs a subquery per row in RLS** | At cohort scale this is negligible; the column-grant layer is the real protection. If a table ever gets large and broadly readable, prefer a JWT claim or `security definer` cached lookup. |

### B.3 Bottom line

The database is **"perfectly settled up"** for what it does and for the yearbook ahead — no structural changes needed. Address D-DB1 (config consistency) and D-DB2 (slugs) before the yearbook flip; the rest are polish.

---

## C · UX / UI audit + theme improvements

**Verdict: the design system is a standout.** "Sunlit Lawn" (docs 17/18) is a genuinely coherent, well-reasoned visual language — a single metaphor (golden-hour campus, school instruments), a three-layer composition model, a typography ladder, a micro-interactions catalog, accessibility baked in (contrast checks, `prefers-reduced-motion`, ≥44px targets), and a mobile-first performance budget. Most apps never reach this level of intentionality.

### C.1 Strengths to keep

- One metaphor enforced by a "school-element vocabulary" table — every primitive maps to paper / pencil / ink / marker / sharpie / tape / stamp / whiteboard / doodle / halo. This is what keeps it from looking templated.
- Themed micro-interactions (pencil-shade button hover, ink-draw input underline, teacher's-stamp success) instead of generic SaaS hovers.
- Real empty/loading/error states (`EmptyState`, `Skeleton`, `PageError`, per-route `loading.tsx`/`error.tsx`).
- Restraint: panel-discipline rule (content sits on substrate, cards only for things that "move").

### C.2 Where it can get better (highest ROI first)

1. **Ship the real Place illustrations.** The campus illustrations (`lawn-golden-hour`, `classroom-hall`) are still **placeholders** (doc 18 §18 asset gap). This is the single biggest visual upgrade available — the whole theme is designed around them and currently runs on stand-ins. Generate them per the prompt in doc 18 §18 and drop them in. **Do this first.**
2. **Collapse the two avatar/onboarding systems into one** (see D1). The split is the biggest source of UI inconsistency in the app today.
3. **Reduce monolith components.** `components/shirt/ShirtView.tsx` is ~865 lines mixing drawing state, placement math, network, and render. It works, but it slows iteration and invites bugs. Extract the drawing-state machine, the suggested-spot finder, and the save flow into hooks. (Maintainability, not user-facing.)
4. **Add the sealing/transition moment.** The Phase 1→2 ceremony (doc 10) is the emotional peak of the whole product and isn't built yet. Even a small version (blur → gold border draw-in → scribbles fade → "sealed forever" → confetti) will define how the app is remembered.
5. **Sound + haptics (subtle, opt-out).** A faint pencil-scratch while drawing and a light haptic tap when a scribble is placed would make the core action feel physical. The seal `.mp3` is already planned (doc 10).
6. **Theme the system surfaces too.** Admin and settings are intentionally "quiet," which is right — but a few brand touches (the asterisk divider, a whiteboard header) would stop them feeling like a different app.

### C.3 How to change elements safely (the brief's "if I have to change elements, how")

The design system is token-driven, so changes are low-risk if you go through the tokens, not the components:

- **Colour / paper / ink / brand:** edit the CSS variables in `app/globals.css` `:root` **and** the mirror in `tailwind.config.ts` (`colors.*`). Every `bg-paper-100` etc. updates automatically. Never hard-code hex in components — the doc-18 sweep removed those; keep it that way.
- **Type:** the ladder lives as utility classes (`text-hero-name`, `text-handwritten-note`, …) — restyle in one place.
- **A whole new visual element:** run it through the doc-18 §15 "which school instrument is this?" test. If it maps to one, build it from that primitive; if it doesn't, either redesign it to fit or add a new row to the vocabulary table with a rationale. This is how the system stays coherent as it grows.
- **Per-surface composition:** doc 18 §3 has the canonical per-page map (which surfaces get the Place layer / whiteboard / hero composition). Update that table when you add a page.

---

## D · Onboarding flaws

Onboarding is the highest-leverage UX surface (every user passes through it once) and currently has the most friction in the app.

### D1 — Two divergent onboarding/avatar flows (the big one)

There are **two separate avatar-building implementations**:
- `app/onboarding/page.tsx` — a 4-step flow (Basics → Face → Body → Review) that writes `users` directly and stores `avatar_config` with a `skinTone.undertone` slider.
- `src/features/avatar/components/AvatarOnboardingFlow.tsx` (used at `app/onboarding/avatar/page.tsx`) — a 3-step flow (style → front-face → review) with a face-placement editor that POSTs to `/api/avatar/config` and **drops undertone**, mapping to 5 legacy skin IDs.

**Why it's a problem.** Divergent UI, divergent data shape in the same `avatar_config` column (D-DB1), double the maintenance, and a real risk that a user's avatar looks different depending on which path created it. **Pick one** (the API-backed `AvatarOnboardingFlow` is the more robust pattern — server validation, localStorage resume, face placement), delete or redirect the other, and standardize the `avatar_config` schema with a Zod validator.

### D2 — The face step makes users leave the app

Step 2 asks the user to copy an AI prompt, **go to ChatGPT/Ideogram**, generate a portrait, come back, and upload it. There's no placeholder bank (deliberately cut). This is a major drop-off point — leaving the app mid-onboarding is where you lose people, and "skip for now" leaves them faceless (the thing the product says is "the whole point").

**Fix options (pick 1–2):**
- Add **in-app photo upload / camera capture** as the primary path ("use a selfie") with the AI-generate route as a secondary "or make a cartoon you" option.
- If keeping AI-generate, make it feel in-flow: a deep link / QR to the prompt, and a clear "we saved your progress — come back and upload" state so leaving doesn't feel like losing.
- Offer a **tasteful default avatar** (not a bank of stock faces — a styled monogram/initial on the chosen body) so "skip" still looks intentional, with a persistent nudge to add a face.

### D3 — Batch selection is a wall of 52 unlabeled numbers

Step 1 shows a 6-column grid of buttons `01`–`52` with no context. Many students won't know their "batch number" as an abstract index, and there's no search/typeahead or section/wing labels.

**Fix.** Add a searchable/typeahead batch picker, show any human label you have (section, wing, mentor) alongside the number, and consider inferring a default from the enrollment number pattern if one exists. At minimum, a one-line "not sure? it's the group on your timetable / ID" helper.

### D4 — Required fields with weak validation & error feedback

- `enrollment_number` is required with only a placeholder example; a **duplicate** collides with the `unique` constraint and surfaces as a generic *"Could not save your profile — please try again,"* which is misleading (retrying never helps). Pre-check uniqueness and say *"that enrollment number is already registered."*
- No format validation/hint for enrollment, so typos pass silently and become the permanent ID.

### D5 — No resume / save-and-exit in the main flow

The 4-step `onboarding/page.tsx` keeps all state in component memory — a refresh mid-onboarding **loses everything**. (The other flow, `AvatarOnboardingFlow`, does persist to `localStorage` — another reason to standardize on it.) Meanwhile `proxy.ts` force-redirects verified users back to `/onboarding` until `onboarding_completed`, so a user who bails has to start over. Persist progress (localStorage or server draft) so onboarding is resumable.

### D6 — Sequencing & motivation

Step 1 asks for name + enrollment + batch before any payoff or "why." A short framing beat — *"set this up so your friends can find you and sign your shirt"* — plus showing the avatar forming as they go would raise completion. The welcome whiteboard is a nice start; lean into the payoff.

### D7 — Guest path parity

Guests get a separate `/onboarding/guest`. Make sure it has the same polish and a clear explanation of what guests can/can't do (can scribble via invite, can't own a shirt) so off-domain friends aren't confused about why they have fewer options.

---

## Prioritized action list

**Before the yearbook flip (do these):**
1. D1 / D-DB1 — unify the two onboarding/avatar flows + standardize `avatar_config` (consistency, blocks clean yearbook avatars).
2. D-DB2 — ensure `profile_slugs` are generated (or backfilled) so `/u/[slug]` works.
3. S1 — allowlist asset hosts before the render job fetches `head_front_url` in bulk.

**Soon (hardening + the visible wins):**
4. C2.1 — ship real Place illustrations (biggest visual ROI).
5. S2 — shared-store rate limiting on abuse-sensitive routes.
6. S3 — security headers / CSP.
7. D2 / D3 / D4 / D5 — onboarding friction fixes.

**Nice-to-have / Phase 2 polish:**
8. S4, S5, S6, D-DB3/4/5, C2.3–C2.6 — the sealing ceremony, sound/haptics, component refactors.

Nothing here blocks shipping the current scribble phase. The security posture is already strong; these make it sturdier and the experience smoother.
