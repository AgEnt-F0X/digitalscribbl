# 15 — Senior Engineering Review (Scribbl)

> Scribbl is closer to shippable than most "free-tier, solo founder, one-month-live" projects I've reviewed. The role model in `lib/utils/role.ts`, the phase machine, and the soft-degrade flag system are scaffolding that usually doesn't exist until v3. That said, there are two correctness bugs that will bite at 3am, a non-trivial amount of wiring that was *built* but not *consumed* (degrade flags, audit logs, phase comparison), and the dashboard fan-out will spend the Vercel Hobby budget faster than necessary. None of this is unshippable; all of it is fixable in a week.

## 1. Stack reality check

Next 16.2.6 App Router + TS, Tailwind v3, Supabase, Sharp, Fabric.js 7 (dynamically imported), Resend, `fflate`. `package.json` is clean. Two nits: `@types/sharp` is deprecated (Sharp 0.33 ships its own types — drop it), and the `test` script uses `--experimental-strip-types` which is Node-22-only while Vercel defaults to 20 (pin the engine).

Next 16 moved `middleware.ts` → `proxy.ts`; file is at the project root, matcher excludes static assets correctly. Solo founder + one cohort + free tier is right-scoped. The one decision to make pre-launch is whether to pre-approve Supabase Pro ($25) so the upgrade call isn't being made at 9pm on farewell day.

## 2. Schema & migrations health

`supabase/migrations/010_role_access_lifecycle.sql` is the strongest migration in the tree. Every `alter` / `add constraint` / `create policy` is wrapped in `if not exists` or a `do $$` existence check — re-running is genuinely safe. The role-flag CHECKs (`users_admin_implies_verified`, `users_verified_xor_guest`, `users_deleted_not_suspended`) push the invariants `getRole()` derives into the DB. Good defense-in-depth.

**(a) The phase trigger contradicts the API.** `scribbles_phase_guard()` in 010 line 341 raises `phase_locked` when `phase_val <> '"scribble_open"'`. But `lib/utils/phase.ts` line 49 (`isScribbleOpen`) treats `'countdown'` as also-allowed. The moment admin flips phase to `countdown`, the API accepts the scribble, validation passes, then the trigger rejects with `P0001`. User sees 500 (`SAVE_FAILED`). Fix: `phase_val not in ('"scribble_open"', '"countdown"')`. **Critical** — ships broken the day countdown is enabled.

**(b) RLS is thin for direct-client mutations.** `002_rls.sql` lets any authenticated user insert `scribbles` with `scribbler_id = auth.uid()` (lines 73–75). No RLS-level check on `shirt_id` ownership, permission, or bounds — that all lives in `app/api/scribble/place/route.ts`. The API uses `createServiceClient()` (bypasses RLS), and we trust no client ever calls `supabase.from('scribbles').insert(...)` directly. Either tighten to `with check (auth.role() = 'service_role')`, or accept the API is the only perimeter. **High**.

Index coverage in 010 is fine. Missing: an index on `scribbles(scribbler_id, created_at desc)` — both the digest and dashboard "signatures given today" filter on it.

## 3. Auth & middleware (`proxy.ts`) — role checks, service-role usage

`proxy.ts` does the right things: derive role via `getRole()`, kill session on `is_deleted`, redirect suspended, gate admin-only paths, allowlist guests. Composition is clean. Two issues:

**(a) Proxy skips all `/api/*` paths** (line 21). Standard Next pattern, but it means **deleted users with an unexpired access token can hit any `/api/*` route until token rotation**. `auth/callback/route.ts` (lines 35–39) does NOT select or check `is_deleted`. Sequence "admin deletes user → user keeps tab open → API writes continue" is reachable. Fix: select `is_deleted` in callback and refuse session, plus check it inside `requireApiUser`. **High**.

**(b) Service-role client is overused.** `rg createServiceClient app/api` returns 21 of 27 routes. Most need it (notifications inserts are service-role-only per RLS, storage uploads bypass by design). `/api/scribble/request` mixes correctly. Others default to service-role for everything (`/api/shirt/lock`, `/api/scribble/react`). `place` re-verifies ownership/role after auth — propagate that.

Dev-bypass (lines 75–89) creates a service-role client to read profiles. Confirm `NEXT_PUBLIC_DEV_AUTH_BYPASS` is unset in Vercel prod.

## 4. API correctness sweep

`rg "rateLimit|createFixedWindowRateLimiter" app/api` → **4 routes**: `place`, `react`, `request`, `report`. `rg admin_audit_logs app/api` → **zero**. `rg "getPlatformFlags|isFlagOn" app/api` → **one** (`place`).

| Route | Auth | Input val | Rate limit | Phase/flag | Audit |
|---|---|---|---|---|---|
| `scribble/place` | ✅ | ✅ + sanitize + bounds | ✅ 8/60s | ✅ phase + 2 flags | n/a |
| `scribble/voice` | ✅ | ✅ file-type + size + duration | ❌ | ❌ `disable_voice_notes` | n/a |
| `scribble/react` | ✅ | ✅ emoji allowlist | ✅ 45/60s | ❌ | n/a |
| `scribble/request` POST | ✅ | ✅ self-check | ✅ 6/60s | ❌ | n/a |
| `scribble/request` PATCH | ✅ | ✅ action allowlist | ❌ | ❌ | n/a |
| `scribble/remove` | ✅ | partial | ❌ | n/a | ❌ |
| `shirt/lock` | ✅ owner | ✅ | ❌ | ❌ | n/a |
| `shirt/social-notes` | ✅ | partial | ❌ | ❌ | n/a |
| `avatar/upload-head` | ✅ | ✅ file-type + 5MB + Sharp | ❌ | ❌ `disable_head_uploads` | n/a |
| `auth/sync-user` | ✅ | ✅ | ❌ | ❌ `disable_new_signups` | n/a |
| `auth/callback` | n/a | ✅ next-path | ❌ | ❌ `disable_new_signups`, no `is_deleted` | n/a |
| `email/digest` | secret-or-admin | ✅ | n/a | ❌ `disable_email_digest` | n/a |
| `admin/users` | ✅ admin | partial | n/a | n/a | ❌ |
| `admin/moderation` | ✅ admin | ✅ | n/a | n/a | ❌ |
| `admin/settings` | ✅ admin | ✅ key allowlist | n/a | n/a | ❌ |
| `groups/*` | ✅ | partial | ❌ | ❌ | n/a |
| `yearbook/export` | ✅ admin | n/a | n/a | n/a | ❌ |

Three gaps:

- **`/api/admin/settings` allowlist (line 14) hard-codes 4 keys** (`scribbling_enabled, deadline_date, auto_hide_threshold, announcement`) and does NOT include `phase`, `scribble_ends_at`, or any of the 8 `disable_*` flags. **Admin cannot flip the soft-degrade switches via the API.** Doc 09's "single SQL flip" promise is unreachable. **Critical**.
- **No admin route writes `admin_audit_logs`**. Table + RLS exist; zero inserters. Every suspend/promote/hide/moderate is silent. **High**.
- **Voice + head upload have no rate limit.** A signed-in user can iterate POSTs to `/api/scribble/voice` and burn the 1 GB storage budget in an afternoon (1.5 MB × thousands). **High**.

## 5. Realtime + storage budget math vs free tier

Doc 09's numbers check out: 1,500 × ~80 KB heads = 120 MB; ~5,000 voice × 30 KB = 150 MB; ~470 MB against 1 GB. Holds *if* voice uploads stay bounded. With no rate limit on `/api/scribble/voice` and `MAX_VOICE_BYTES = 1.5 MB`, one motivated student fills storage in an afternoon. Rate-limit or re-encode to Opus-24kbps (~5× smaller).

Realtime: 200 concurrent ceiling, doc target 150 active tabs. `disable_realtime_presence` and `disable_realtime_broadcast` exist in DB but nothing on the server reads them when emitting. Verify `useShirtChannel.ts` honors the flags before launch.

Resend 100/day is too tight for 1,500 users. `/api/email/digest` has `MAX_DIGEST_BATCH = 100`, matching the ceiling — but the **hash-mod-7 weekly stagger** from doc 04 is NOT implemented. The query is `last_digest_sent_on != today LIMIT 100`, biasing to the first 100 by `id` until they catch up, then jumping. Users 101–1,500 think email is broken for a week. **Medium**.

## 6. Free-tier degrade flag consumption audit

Flags table built, `lib/utils/platformFlags.ts` reader correct and cached. Wiring into routes is mostly missing:

| Flag | Read by | Verdict |
|---|---|---|
| `disable_voice_notes` | `scribble/place` only (blocks save with voice attached) | ⚠️ `/api/scribble/voice` still accepts upload |
| `disable_realtime_presence` | nowhere (server) | ❌ |
| `disable_realtime_broadcast` | nowhere (server) | ❌ |
| `disable_email_digest` | nowhere — digest runs unconditionally | ❌ |
| `disable_new_signups` | nowhere — callback + sync-user always create | ❌ |
| `disable_scribble_writes` | `scribble/place` + DB trigger | ✅ |
| `disable_head_uploads` | nowhere — upload-head always accepts | ❌ |
| `disable_share_link_creation` | unknown (not in read list) | verify |

**Six of eight flags are read-only DB rows with no enforcement.** Single biggest gap between docs and reality. Fix: one `assertFlagOff(db, key)` helper, called from 7 routes. ~30 minutes.

## 7. Performance hotspots

**Dashboard fan-out.** `app/dashboard/page.tsx` is `force-dynamic` and runs **11 parallel Supabase queries** in `Promise.all` (lines 103–196), then **4 sequential queries** depending on the first batch (`queueScribbles`, `memberCounts`, `pendingRequesterUsers`, `activityUsers`). Each round trip is ~50–150 ms; sequential adds 200–600 ms on top. Wins: move `update last_seen` (line 195) to fire-and-forget post-response; collapse `signing queue` + `online batch` + same-batch `users` (lines 120–138) into one query partitioned in JS; push `signaturesGivenToday` + `reactionsGivenToday` into one RPC. Realistic target: ~6 queries.

**Fabric.js dynamic import** keeps the dashboard bundle clean. **Sharp** in `/api/avatar/upload-head` is correct. The yearbook export is the documented 10s-timeout risk on Vercel Hobby — don't run it synchronously; move off-Vercel.

**Phase + flag caches** are module-level `let cached` in `phase.ts` / `platformFlags.ts`. Each warm Lambda has its own copy; flips propagate over up to 60s. `invalidatePhaseCache()` only clears the current instance. Acceptable for v1 — publicly state the lag.

## 8. Code quality

TypeScript strictness is on. The role/phase/flag libraries have docstrings naming the doc + decision they implement — genuinely excellent. `lib/utils/role.ts` (derive-don't-store, predicates over strings) is the cleanest abstraction in the codebase.

**Anon-scribble dead code is correctly removed at runtime.** `rg is_anonymous` returns only `lib/supabase/types.ts` (auto-derived from DB — keep) and two comments in `app/api/scribble/place/route.ts` explicitly noting "intentionally ignored: doc 08 round 2 decision 2". No consumer in `src/` or components. ✅ Clean cut.

**Proxy vs middleware**: `proxy.ts` is the Next 16 name. No leftover `middleware.ts`. Clean.

**Auth duplication**: `auth/callback/route.ts` and `api/auth/sync-user/route.ts` both upsert the user row + create shirt-1. Both check `existingUser` so there's no insert race, but update paths can race if both fire. Kill `sync-user`, do it all in `callback`.

**Legacy fields in `place`**: lines 270–290 still read `platform_settings.scribbling_enabled` and `deadline_date` despite the new phase machine being authoritative. Two paths to "paused" with different error codes (`PAUSED` vs `PHASE_LOCKED`). Drop the legacy branch.

## 9. Security quick scan

- **SVG sanitisation** (`lib/utils/sanitizeSvg.ts`): regex blocks `<script>`, event handlers, `javascript:`, external `href/src`, CSS `url()` to external. 500 KB cap. Fine for v1. Regex won't catch namespaced handlers (`xlink:onload`) or SVG `<style>` with `@import`. If rendered SVG reaches an open-internet page, prefer `<img src="data:image/svg+xml,...">` over inlining.
- **XSS in email**: `/api/email/digest` line 113 interpolates `${recipient.display_name}` into HTML without escaping. A user with `<img onerror=...>` in their display name self-XSSes. Add `escapeHtml()`. **Medium**.
- **File upload validation**: `upload-head` uses `file-type` magic bytes + Sharp re-encode to WebP. `voice` uses `file-type` against an allowlist, paths use `crypto.randomUUID()`. Good.
- **Rate-limit matrix / audit-log writes**: see §4.
- **Service-role exposure**: dev bypass reads profiles via service role. Confirm `NEXT_PUBLIC_DEV_AUTH_BYPASS` and `SUPABASE_SERVICE_ROLE_KEY` env scoping in Vercel before launch.

## 10. Top 5 things that will break at 3am during live month

1. **Admin flips phase to `countdown`. Every scribble POST returns 500.** Trigger blocks anything but `"scribble_open"`; API thinks countdown is fine. Users see "Failed to save scribble". Request path is otherwise healthy, so the root cause is non-obvious.
2. **Storage hits 1 GB because someone iterated `/api/scribble/voice`.** No rate limit, no flag check. `disable_voice_notes` doesn't stop *uploads* — only the `place` write. Storage fills with orphaned voice files.
3. **Admin tries to flip `disable_email_digest` from `/admin/system-health`.** `admin/settings` allowlist rejects the key. Admin is now flipping rows via the Supabase SQL editor — exactly what doc 09 promised they wouldn't have to.
4. **Deleted user keeps writing because they have an open tab.** Proxy skips `/api/*`; `auth/callback` doesn't check `is_deleted`. Deletion sticks only once they navigate to a page.
5. **Daily digest delivers to the same 100 users every day for two weeks**, then jumps to the next 100 once `last_digest_sent_on` catches up. Users 101–1,500 think email is broken. Hash-mod-7 stagger is documented but not coded.

## 11. Production readiness scoring

| Dimension | Score | Notes |
|---|---|---|
| Migration parity (docs ↔ DB) | **90%** | 010 is excellent. Phase trigger has the countdown bug. |
| API contract (auth + validation + rate limit + flags) | **62%** | Auth ✅, validation ~80%, rate-limit 4/27, flags 2/8. |
| Realtime headroom | **75%** | Math is honest. Degrade flags exist; nothing on the server reads them. |
| Storage headroom | **70%** | Budget fine on paper. No upload rate limit = exposed. |
| Observability / audit | **35%** | `error_logs` exists; `admin_audit_logs` has zero writers; no flag-flip / phase / realtime concurrency metrics. |
| **Overall** | **66%** | Ship-able after the 5 fixes below. |

### Top 5 must-fix items

1. **[Critical]** Fix `scribbles_phase_guard()` in `010_role_access_lifecycle.sql` line 341 to allow `countdown`. Add a regression test that inserts a scribble with `phase = 'countdown'` and expects success.
2. **[Critical]** Expand the allowlist in `app/api/admin/settings/route.ts` line 14 to include `phase`, `scribble_ends_at`, `yearbook_opens_at`, `transition_message`, and the 8 `disable_*` flags. Admin UI is the only way to flip these without SSH-into-Supabase.
3. **[High]** Consume the degrade flags in the 6 routes that ignore them: `email/digest`, `scribble/voice`, `avatar/upload-head`, `auth/sync-user`, `auth/callback`, and the realtime broadcast path. ~30 minutes; biggest correctness win.
4. **[High]** Rate-limit `/api/scribble/voice` and `/api/avatar/upload-head` (5/min, 50/day per user) via `createFixedWindowRateLimiter`. Storage is the most fragile resource and currently undefended.
5. **[High]** Block deleted users at the API layer: select `is_deleted` in `auth/callback` and refuse session; add the same check inside `requireApiUser`. While you're there, write the first row in `admin_audit_logs` (`user_suspended`, `user_deleted`, `scribble_hidden`, `setting_changed`).

If item 1 isn't fixed before phase ever moves to `countdown`, I'd refuse to ship. Everything else is recoverable in flight.
