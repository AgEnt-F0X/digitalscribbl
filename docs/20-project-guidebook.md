# 20 — Project Guidebook (re-onboarding manual)

> **Read this when you come back to the project and forgot where everything is.** It's the map: what the app is, how to run it, where every kind of thing lives, what assets go where, and how to do the common tasks. Skim the tables; they're built for "I need to change X — where do I go?"
>
> Last written: 2026-06-09. Stack snapshot: Next.js 16 · React 18 · Supabase · Tailwind · Fabric.js. App version 2.0.0.

---

## 1 · What Scribbl is (60-second refresher)

A **one-month digital farewell** for final-year students. Each student gets a virtual t-shirt; batchmates sign it with handwritten notes, doodles, voice notes, and stickers — the offline scribble-day ritual, online. After the deadline, every shirt **locks into a permanent yearbook**.

Two phases, one database:
- **Phase 1 — Scribble (now):** live signing. `/dashboard`, `/shirts/[id]/scribble`, `/explore`, `/groups`.
- **Phase 2 — Yearbook (later):** read-only archive. `/yearbook`, `/u/[slug]`. See [21-yearbook-figma-make-spec.md](./21-yearbook-figma-make-spec.md).

The cutover is a **phase flag**, not a data migration — everything stays in the same tables. See [10-scribble-to-yearbook-transition.md](./10-scribble-to-yearbook-transition.md).

**Design language:** "Sunlit Lawn" — golden-hour campus, school-instrument metaphor (paper / pencil / ink / marker / whiteboard / stamp / doodle). Canonical spec: [18-sunlit-lawn-theme-spec.md](./18-sunlit-lawn-theme-spec.md).

---

## 2 · Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 18, TypeScript |
| Styling | Tailwind 3 + CSS variables in `app/globals.css` |
| Drawing canvas | Fabric.js 7 (`components/scribble/DrawingCanvas.tsx`) |
| Backend / DB / Auth / Storage / Realtime | Supabase (Postgres + RLS, Google OAuth, Storage, Realtime presence) |
| Server image compositing | Sharp (yearbook/avatar card PNGs) |
| Forms / validation | react-hook-form + Zod |
| Animation | Framer Motion + CSS keyframes; `canvas-confetti` |
| Fonts (next/font/google) | Caveat (display), Patrick Hand (hand), Permanent Marker (marker), Inter (body), JetBrains Mono (mono) |
| Hosting (intended) | Vercel + Supabase free tier |

---

## 3 · Run it locally

```bash
npm install
cp .env.local.example .env.local     # then fill in the values (see §4)
npm run dev                          # http://localhost:3000
```

Other scripts (`package.json`):

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Node test runner over `tests/*.test.ts` (~60 tests) |
| `npm run validate:scribbl-assets` | Verify every avatar/shirt SVG has the right `viewBox` + required layer ids |

**First-time backend setup (Supabase):** run the migrations in `supabase/migrations/` in order (001→011) in the SQL editor, create the two storage buckets (§7), enable Google OAuth with callback `{SITE_URL}/auth/callback`, and schedule the two edge functions (§7). The `seed.sql` + migration 010 seed B.Tech CS with 52 batches.

---

## 4 · Environment variables

From `.env.local.example`. `NEXT_PUBLIC_*` are exposed to the browser; the rest are server-only.

| Variable | Purpose | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** admin key — bypasses RLS | NEVER prefix with `NEXT_PUBLIC`. Used by API routes + edge functions. |
| `NEXT_PUBLIC_SITE_URL` | Canonical app URL | Preferred over `APP_URL` |
| `NEXT_PUBLIC_APP_URL` | Legacy alias for site URL | Kept for old env files |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` | Comma-list of domains that become **verified** users | Off-domain Google logins become locked **guests** |
| `DEV_AUTH_BYPASS` | `true` enables fake-login in dev only | Hard-disabled when `NODE_ENV=production` |
| `DEV_AUTH_USER_1..4_ID` | Up to 4 real user IDs to impersonate locally | Use with `/dev/test-users` |

> Google OAuth keys live in the Supabase Auth config, not here.

---

## 5 · Repo map

```
app/                 Next.js App Router — pages + API routes (see §6)
components/          Shared UI (nav, avatar, shirt, scribble, brand, forms, feedback, marginalia, ui)
src/features/        Feature modules: avatar/, scribble/, dashboard/  (components + data + types)
src/assets/scribbl/  Source SVGs: avatar presets, shirt-editor, stickers
lib/                 Non-UI logic:
  ├ auth/            server auth context + dev bypass
  ├ supabase/        client / server / service clients + DB types
  ├ hooks/           React hooks (channel, notifications, toast, first-visit, …)
  └ utils/           pure logic (role, phase, rateLimit, sanitizeSvg, collision, shirtLevel, …)
proxy.ts             Next 16 middleware — auth + role + onboarding gate (the "middleware")
public/              Static assets served as-is (bodies, illustrations, stickers, favicon)
supabase/
  ├ migrations/      001–011 SQL — the schema, run in order
  ├ functions/       Edge functions (cron jobs)
  └ seed.sql         Seed data
docs/                All project docs (this is one of them) — index in §13 + docs/README.md
tests/               node --test suites for the pure utils
scripts/             validate-scribbl-assets.ts
```

---

## 6 · Where things live ("I need to change X")

| I want to change… | Go to |
|---|---|
| Colours / paper / ink / brand tokens | `app/globals.css` `:root` **and** `tailwind.config.ts` `colors.*` (keep them in sync) |
| Fonts | `app/layout.tsx` (next/font) + `tailwind.config.ts` `fontFamily` |
| The shirt size / drawable region | `lib/constants.ts` (`SHIRT_W/H`) + `lib/utils/shirtTemplate.ts` (drawable polygon) |
| Drawing tools / brush behaviour | `components/scribble/DrawingCanvas.tsx` + `ScribbleToolbar.tsx`; tool ids in `lib/constants.ts` |
| Canvas colour palette | `CANVAS_COLORS` in `lib/constants.ts` (mirror of `scribble.*` in Tailwind) |
| The scribble studio (sign flow) | `components/shirt/ShirtView.tsx` (the big one) + `src/features/scribble/` |
| Avatar rendering (head + body + skin) | `components/avatar/Avatar.tsx`, `src/features/avatar/components/AvatarRenderer.tsx`, `lib/utils/avatarResolve.ts` |
| Avatar presets list | `src/features/avatar/data/avatarPresets.ts` + `lib/utils/avatarResolve.ts` (`HERO_PRESETS`) |
| Onboarding | `app/onboarding/page.tsx` (main 4-step) **and** `src/features/avatar/components/AvatarOnboardingFlow.tsx` (⚠ two flows — see §12) |
| Who can do what (roles/routes) | `lib/utils/role.ts` (single source of truth) + `proxy.ts` |
| Auth / session / admin checks | `lib/auth/server.ts`, `lib/supabase/server.ts` |
| Phase logic (scribble↔yearbook) | `lib/utils/phase.ts` + `platform_settings` rows + `proxy.ts` |
| Free-tier degrade switches | `lib/utils/platformFlags.ts` + `platform_settings` (`disable_*`) — see [09](./09-free-tier-fallback.md) |
| Rate limits | `lib/utils/rateLimit.ts` (⚠ in-memory — see §12) |
| SVG safety | `lib/utils/sanitizeSvg.ts` |
| Nav / app shell | `components/nav/AppShell.tsx`, `TopNav.tsx`, `BottomNav.tsx` |
| DB schema | `supabase/migrations/` (add a new numbered migration; never edit old ones) + mirror types in `lib/supabase/types.ts` |

---

## 7 · Assets — where they live & what's still needed

This is the part that's easy to forget. There are **two asset roots**: `src/assets/` (build-time source SVGs) and `public/` (served directly).

| Asset | Location | Count / format | Notes |
|---|---|---|---|
| **Avatar body presets** | `src/assets/scribbl/avatar-presets/{masculine,feminine}/{preset}/{preset}-{front,back}.svg` | 20 presets × 2 sides | Each must have `viewBox="0 0 400 600"` + ids `skin-fill`, `shirt-base`, `shirt-drawable`, `shirt-overlay`. Validate with `npm run validate:scribbl-assets`. |
| **Shirt editor base** | `src/assets/scribbl/shirt-editor/shirt-editor-{front,back}.svg` | 2 | The canonical white shirt drawable surface (Route 1). |
| **Stickers (source)** | `src/assets/scribbl/stickers/*.svg` | 12 | arrow, bear-doodle, crown, fire, flower, heart, lightning, paper-plane, smile, sparkle, speech-bubble, star |
| **Stickers (served)** | `public/scribbl/stickers/*.svg` | 12 | Duplicate of the above (consolidation deferred — doc 18 §17). Used as drifting-doodle marginalia. |
| **Legacy bodies** | `public/bodies/{m1..m3,f1..f3,placeholder}.svg` | 7 | Old body-style system. Kept for back-compat reads of `users.body_style`; new code uses presets. |
| **Place illustrations** | `public/illustrations/place/{lawn-golden-hour,classroom-hall}-{desktop,tablet,mobile}.svg` | 6 | ⚠ **These are placeholders.** The real campus art (WebP, golden-hour) is still to be produced — see [19-handoff-checklist.md](./19-handoff-checklist.md) + doc 18 §18. Biggest visual upgrade available. |
| **Brand / meta** | `public/favicon.svg`, `public/og-image.svg`, `public/manifest.webmanifest` | — | PWA manifest + social card |

**Outstanding asset work** (what "still needs assets"): tracked in **[19-handoff-checklist.md](./19-handoff-checklist.md)** — the real place illustrations and any avatar SVGs flagged by the validator. Run `npm run validate:scribbl-assets` to see exactly which avatar/shirt SVGs are missing or malformed.

**Storage buckets (Supabase, not in repo):**

| Bucket | Holds | Path convention | Access |
|---|---|---|---|
| `avatar-heads` | uploaded face photos (re-encoded WebP, ≤512px) | `heads/{user_id}/{front\|back}.webp` | public read |
| `shirt-textures` | voice notes, (legacy) scribble PNGs | `scribble-pngs/…` | public read |
| _(Phase 2)_ yearbook renders | flattened shirt PNGs | — | to be created at yearbook flip |

Constants for these: `BUCKET_HEADS` / `BUCKET_TEXTURES` in `lib/constants.ts`.

---

## 8 · Data model (quick reference)

Full schema: `supabase/migrations/001_schema.sql` … `011`. TypeScript mirror: `lib/supabase/types.ts`. RLS: `002_rls.sql` + `008_security_hardening.sql`.

| Table | What it is |
|---|---|
| `users` | Mirrors `auth.users`. Profile + avatar_config + permissions + yearbook_* fields. |
| `academic_groups / programs / batches` | The hierarchy (University → B.Tech CS → Batch 01–52). |
| `shirts` | 1–3 per user (or a group canvas if `group_id` set). Occupancy + lock state. |
| `scribbles` | Individual marks. `canvas_svg` is the renderable vector + `x,y,w,h,panel`. |
| `box_claims` | Ephemeral "I'm drawing here" locks. Cleaned by the box-expiry cron. |
| `scribble_requests` | Permission-to-sign requests. |
| `scribble_reactions` | Emoji on scribbles (❤️😂🥹🔥✨🫶). |
| `shirt_social_notes` | Off-shirt sticky notes. |
| `friend_groups` / `friend_group_members` | Groups + membership + invite tokens. |
| `notifications` | In-app notifications (service-role insert only). |
| `scribble_reports` / `user_reports` | Moderation. |
| `platform_settings` | Phase machine + feature/degrade flags (jsonb). |
| `profile_slugs` | `/u/[slug]` public URLs. |
| `share_links` / `share_link_visits` | Invite-link attribution. |
| `admin_audit_logs` | Append-only record of admin actions. |
| `yearbook_renders` | Pre-flattened shirt PNGs for the yearbook (Phase 2). |
| `error_logs` / `system_health_runs` | Ops. |
| `account_delete_otps` | Hashed OTPs for account deletion. |

**Derived, not stored:** shirt level (`lib/utils/shirtLevel.ts` — 6 levels by unique-signer count), scribble counts, unique signers.

---

## 9 · Auth & access model

- **Login:** Google OAuth → `app/auth/callback/route.ts`. Email domain decides **verified** (in `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`) vs **guest** (everyone else).
- **Roles** (`lib/utils/role.ts`, derived from flags, never stored): precedence `deleted > suspended > admin > verified > guest`.
- **The gate:** `proxy.ts` (Next 16 middleware) runs on every page nav — validates the token server-side, refuses deleted/suspended, redirects non-admins off `/admin`, sends guests to their allowlist, and forces verified users through `/onboarding` until complete.
- **API boundary:** `requireApiUser()` re-checks account status so a deleted-but-tokened user can't keep writing. `requirePageAdmin()` / `getUserIsAdmin()` gate admin.
- **Three Supabase clients:** `createClient()` (anon, RLS-bound, for user actions), `createServiceClient()` (service role, bypasses RLS — server only), and the browser client (`lib/supabase/client.ts`).
- **Dev login:** with `DEV_AUTH_BYPASS=true`, visit `/dev/test-users` to impersonate seeded users (one per browser). Disabled in production.

---

## 10 · Route inventory

**Pages** (`app/**/page.tsx`):

| Route | Purpose |
|---|---|
| `/` | Entry redirect (by phase/auth) |
| `/login` | Google sign-in (brand front door) |
| `/onboarding`, `/onboarding/avatar`, `/onboarding/guest` | Profile + avatar setup (⚠ two flows, §12) |
| `/dashboard` | Home hub — your avatar + shirt + activity |
| `/shirts/[shirtId]/scribble` | The signing studio |
| `/profile/[userId]` | A person's profile (301→`/u/[slug]` in yearbook phase) |
| `/explore` | Find classmates |
| `/groups`, `/groups/[groupId]`, `/groups/join/[token]` | Friend groups |
| `/activity` | Recent events feed |
| `/settings` | Account + profile settings |
| `/yearbook`, `/u/[slug]` | Phase 2 (to build — doc 21) |
| `/admin`, `/admin/{users,moderation,groups,errors,yearbook}` | Admin console |
| `/dev/{test-users,sunlit-lawn}` | Dev-only (gated) |

**API routes** (`app/api/**/route.ts`) — all server-side, mostly service-role:

| Group | Routes | Purpose |
|---|---|---|
| scribble | `place`, `remove`, `report`, `react`, `request`, `voice` | Core signing lifecycle |
| shirt | `lock`, `release-box`, `social-notes` | Shirt state + sticky notes |
| avatar | `config`, `upload-head`, `export` | Avatar build + face upload + PNG card |
| yearbook | `export` | Admin batch ZIP of profile cards (Phase 2 render job seed) |
| groups | `create`, `join`, `leave`, `remove-member` | Group management |
| auth | `sync-user` | Reconcile user row + role at sign-in |
| admin | `users`, `moderation`, `settings`, `errors` | Admin actions (audited) |
| misc | `settings/update`, `export-requests`, `users/report`, `errors/report`, `email/digest` | Settings, requests, reporting, email |

---

## 11 · The phase machine + ops crons

**Phases** live in `platform_settings.phase`: `scribble_open` → `countdown` → `transition` → `yearbook`. Read via `lib/utils/phase.ts` (cached ~30s). Scribble writes are blocked past `countdown` at both the API and a DB trigger (`scribbles_phase_guard`). Full playbook: [10](./10-scribble-to-yearbook-transition.md).

**Edge function crons** (`supabase/functions/`, scheduled in Supabase):

| Function | Schedule | Does |
|---|---|---|
| `box-expiry` | every minute | Deletes stale `box_claims` (abandoned draw locks) |
| `storage-cleanup` | daily 3 AM | Removes orphaned scribble PNGs for hidden/deleted scribbles |

**Degrade flags** (`platform_settings.disable_*`, read via `lib/utils/platformFlags.ts`): kill switches for voice notes, realtime, email digest, signups, scribble writes, head uploads, share links — flip without a deploy if you hit free-tier limits. See [09](./09-free-tier-fallback.md).

---

## 12 · Gotchas you probably forgot

- **Two onboarding/avatar flows exist.** `app/onboarding/page.tsx` (4-step, writes `users` directly) and `src/features/avatar/components/AvatarOnboardingFlow.tsx` (3-step, posts to `/api/avatar/config`) store **different `avatar_config` shapes**. Unify before the yearbook. (Detail: [22-audit-and-security-review.md](./22-audit-and-security-review.md) §D1.)
- **Route 1 lock:** there is **one canonical white shirt**. The shirt-colour picker and the 6 body-styles (`M1–F3`) are **legacy**. `users.shirt_color` and `BODY_STYLES`/`SHIRT_COLORS` in `lib/constants.ts` are kept for back-compat reads only — don't branch on them in new code. Use `HERO_PRESETS` / avatar presets.
- **Dead columns (intentional):** `scribbles.canvas_png_url` (deprecated; SVG is the source of truth) and `scribbles.is_anonymous` (feature cut, never written). Don't wire them up.
- **Rate limiting is in-memory** (`lib/utils/rateLimit.ts`) — resets per serverless instance, so it's best-effort. (See [22](./22-audit-and-security-review.md) §S2.)
- **Place illustrations are placeholders** (SVG). Real campus art is outstanding ([19-handoff-checklist.md](./19-handoff-checklist.md)).
- **`profile_slugs` population** — confirm slugs are generated before the yearbook phase or `/u/[slug]` has nothing to resolve ([22](./22-audit-and-security-review.md) §D-DB2).
- **Don't edit old migrations.** Add a new numbered one; the ledger was hand-repaired once (`migrations_repair_*`), so verify prod is in sync before relying on 009–011.
- **Two `08-` docs** in `docs/` (IA + avatar assets) — not a typo, both are canonical for their topic.

---

## 13 · The doc set (what each covers)

Index also in [docs/README.md](./README.md). **Canonical** = the source of truth for its topic.

| # | Doc | Use it for |
|---|---|---|
| 01 | Product overview | The pitch / scope |
| 02 | Design system (v1) | UI basics — *partly superseded by 18* |
| 03 | Product flows | User journeys |
| 04 | Architecture | DB / auth / realtime / storage / routes |
| 05 | Ship checklist | Deploy / E2E test |
| 06 | Revisit later | Why X wasn't built |
| 07 | Changelog | What changed between plans |
| 08 | IA, roles, sharing, plan | **Canonical** roles/routes/sharing/onboarding/deletion |
| 08 | Avatar & shirt assets | Stuck on shirt/avatar SVGs |
| 09 | Free-tier fallback | Supabase/Vercel/Resend limits + degrade flags |
| 10 | Scribble→Yearbook transition | Phase logic + cutover + yearbook profile |
| 11 | Decision documentary | How/why each call was made |
| 12 | Friend-test runbook | 2-day friend testing |
| 13–16 | PM / PD / Dev reviews + synthesis | Pick-up points from the round-3 reviews |
| 17 | Design-system v2 conversation | *Why* Sunlit Lawn |
| 18 | Sunlit Lawn theme spec | **Canonical** design system (tokens, components, vocabulary) |
| 19 | Founder handoff checklist | **What's left for you** (outstanding assets + ship gates) |
| **20** | **Project guidebook** | **This doc — re-orientation map** |
| 21 | Yearbook Figma Make spec | Building Phase 2 + scribble→yearbook data binding |
| 22 | Audit & security review | Security findings, DB audit, UX audit, onboarding flaws |

---

## 14 · If you only do three things this session

1. Run `npm install && npm run dev`, open `/dev/test-users`, and click into the app to reload your memory of the live flow.
2. Run `npm run validate:scribbl-assets` and `npm test` to see current health.
3. Skim [19-handoff-checklist.md](./19-handoff-checklist.md) (what's left) and [22-audit-and-security-review.md](./22-audit-and-security-review.md) §"Prioritized action list" (what to fix).
