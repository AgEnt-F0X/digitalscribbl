# 08 — Cleanup ledger and the rebuild plan

> Locked 2026-10-14. Two things live here, because they are the same decision
> seen from two ends:
>
> 1. **A verified cleanup ledger.** A `knip` run produced a dead-code list that
>    was wrong in six places, three of them build-breaking. The verified version
>    is below so nobody re-runs that mistake.
> 2. **The rebuild plan.** We are not writing a new app. We are **deleting the
>    old access model and wiring the one that is already designed, tested, and
>    sitting unused.** See [07](./07-groups-privacy-and-safety.md) for the model
>    itself; this is the build order.
>
> Decision recorded: **rebuild after cleanup** — which closes D12 as option (a).

---

## Part 1 — Cleanup ledger (verified, not tool-reported)

Every row below was checked against the code. The `knip` column records what the
tool claimed; **do not trust that column.**

### ✅ Genuinely dead — removed and verified

| Item | Where | Verified how |
|---|---|---|
| `PANEL_AREA` | `lib/constants.ts` | zero refs across `app lib components src tests` |
| `BOX_DEFAULT_SIZE` | `lib/constants.ts` | zero refs |
| `OCCUPANCY_WARNING_THRESHOLD` | `lib/constants.ts` | zero refs |
| `BOX_CLAIM_TTL_MINUTES` | `lib/constants.ts` | zero refs |
| `hasCollision` | `lib/utils/collision.ts` | zero refs |
| `getCollisions` | `lib/utils/collision.ts` | zero refs |
| `clampToCanvas` | `lib/utils/collision.ts` | zero refs |
| 10 stray root logs | repo root | build artifacts; already gitignored |
| `GhostBoxCanvas.tsx`, `ScribbleToolbar.tsx` | `components/scribble/` | pre-existing deletions; safe to commit |

`tsc --noEmit` clean and 23/23 test files green after removal.

### 🔴 Claimed dead but load-bearing — DO NOT DELETE

| Item | knip said | Actually imported by |
|---|---|---|
| `components/marginalia/AsteriskDivider.tsx` | "zero references, safe to prune" | `app/dashboard/page.tsx:36`, `app/groups/page.tsx:9` |
| `components/place/PlaceBackground.tsx` | "zero references" | **8 pages** — `dashboard:32`, `groups:7`, `groups/[groupId]:6`, `explore:7`, `profile/[userId]:22`, `onboarding:6`, `page.tsx`, `dev/sunlit-lawn:8` |
| `components/ui/Skeleton.tsx` | "unused" | `Skeleton` × 6 files; `PageLoading` (which imports `Skeleton`) × **9 `loading.tsx` routes** |

`PlaceBackground` and `Skeleton` are infrastructure for every page and every
route's loading state, not one-off design assets.

### 🟡 Claimed dead, actually a contract — DO NOT DELETE

`boxesOverlap` in `lib/utils/collision.ts`. `tests/scribble-contract.test.ts:41`
uses it as the **reference implementation** proving `normalizeScribbleBox`'s
integer rounding preserves edge-touching semantics. It documents a contract; it
does not gate a placement. Kept, with a comment saying so.

> This one bit during this cleanup: deleting it broke the build, and `tsc`
> caught it. Proof that the tool list is not a delete list.

### 🔴 Phantom items — they do not exist

| knip said | Reality |
|---|---|
| `DEFAULT_SKIN_DEPTH` / `DEFAULT_SKIN_VALUE` in `skinTone.ts` | Not in the file. `DEFAULT_SKIN_UNDERTONE` is, and it **is** imported by `AvatarOnboardingFlow.tsx` |
| `useShirtChannel.ts` "GhostBox & LivePresence exports" | The hook is live: `ShirtView.tsx:8,70`, `ScribbleStudio.tsx:45,185`, and `type StrokeEvent` in `DrawingCanvas.tsx:13` |

### Root cause of the false positives

knip is mis-resolving the `@/` path alias and the App Router graph, which is why
components with 6–9 direct importers read as unreferenced, and why two invented
export names appeared. **Fix the knip `entry`/`include` config for
`app/**/page.tsx` before trusting another run** — or don't run it and use
`git grep` per symbol instead.

### 🟠 Untracked and irreplaceable — `git clean -fd` would destroy these

`docs/v2/` is now safe (committed `fb5378d`). These are not:

- `lib/identity/` — `enrollment.ts`, `roster.ts`, `verification.ts`,
  `signing.ts`, `signing-queue.ts`
- `supabase/migrations/012_yearbook_mv.sql`,
  `013_bennett_schools_and_requests.sql`
- `supabase/migrations/v2/001–004` — the entire one-door schema
- `tests/` — `cloudinary`, `enrollment-identity`, `grouping-scope-range`,
  `roster-loading`, `roster-lookup`, `shirt-visibility`, `verification-provider`

Also: `git add -A` sweeps up ~80 in-flight changes. Stage by path.

---

## Part 2 — The rebuild plan

### The reframe

This is not "write a new app." Most of the app is good and stays. The rebuild is
one surgical job:

> **Delete the v1 `shirt_permission` matrix and wire the v2 model that is
> already designed, tested, and unused.**

`supabase/migrations/v2/003`, `lib/identity/signing.ts` and
`lib/identity/signing-queue.ts` exist, are pure, and are covered by
`tests/shirt-visibility.test.ts`. `git grep visibility -- app` returns **zero
hits**. The schema is written; the wiring is missing. That is the whole gap.

### Reality check on the calendar — read this before planning

`05-build-phases.md` put the signing window (Phase 2) at Sep 15–28. It is now
mid-October and that window has **not opened**: onboarding is a three-dropdown
cascade with a mandatory 52-option batch list, mailbox verification is hard
blocked (`no_provider`), and the settings default is `batch_only` — so a friend
opening your shirt link hits a request wall. Phase 6a (seal + public yearbook) is
Oct 20–26.

So the schedule is not "nine weeks left." It is **the signing window and the seal
are colliding.** Two consequences for this plan:

1. The order below is fixed by the November wall, not by tidiness. The signatures
   are the artifact; an archive of empty shirts is a failed launch.
2. If a phase slips, **cut its scope — do not move the seal.** That rule is
   already in `05-build-phases.md` and it is the only way this lands.

### Inventory

**KEEP — this is the polished half, do not rewrite it**

| Asset | Why it stays |
|---|---|
| `src/features/scribble/*` — `ScribbleStudio`, `ScribbleWorkspace`, `ZoomViewport`, `ScribbleMobileSheet`, `OutsideNotesCanvas` | All six P0 studio bugs fixed and verified (`docs/23`). Rewriting risks shipping worse than you have |
| `components/shirt/ShirtView.tsx` | Working, incl. per-scribble hide + report wired at `:103-137` |
| Sunlit Lawn design system — `app/globals.css`, `components/brand/*`, `components/marginalia/*`, `components/place/*` | The portfolio-grade half. `AsteriskDivider` / `PlaceBackground` are load-bearing, not dead |
| Avatar system, test harness (vitest, 23 files) | Green and useful |

**DELETE — the old access model, and only that**

| Item | Note |
|---|---|
| `scribble_requests` table + `app/api/scribble/request/route.ts` | **Deleted, not migrated** — approval becomes a reveal queue |
| `app/dashboard/ScribbleRequestActions.tsx` | Caller 1 |
| `app/profile/[userId]/RequestScribbleButton.tsx` | Caller 2 |
| `components/notifications/NotificationBell.tsx:33` | ⚠️ Caller 3 — easy to miss, `git grep scribble/request` finds it |
| `shirt_permission` at 4 gates | `place:269`, `profile/[userId]:174`, `shirts/[id]/scribble:58`, `shirt/social-notes:78` |
| `app/settings/ProfileForm.tsx` radio pair + `PERMISSION_OPTIONS` | Replaced by one dropdown |
| `app/settings/update` allowlist entry | plus `sync-user` + `auth/callback` defaults |
| Onboarding cascade `app/onboarding/page.tsx:92-94` + `api/onboarding/request-program` | Replaced by server-side roster lookup |
| Fake group cards `app/dashboard/page.tsx:251-266` | Two doors to an empty room |
| `lib/utils/safetyAccess.ts` `canAttemptScribble` | Superseded by `canSignShirt` |
| Cohort-group seeding | Already retired in `v2/002` + `v2/004` |

**BUILD — deliberately small**

| Item | Why it is required |
|---|---|
| `isAllowedEmailDomain` fails **closed** | Live security hole; one line; do it before anything else |
| Enrolment → roster server-side lookup | Removes 3 dropdowns; name and program come from the roster, not the student |
| `who can sign` chip on the shirt view | One dropdown, replaces the settings radio pair |
| Block button + block list | Without it, removing a scribble does not stop the same person redrawing it |
| Approval inbox on dashboard | A count badge, never a list of names |

---

### Build order — fixed by the November wall

Each step is independently shippable. Steps 1–4 are what open the signing window;
5–6 are what make it safe to be open by default.

**Step 1 · Close the hole (minutes, unblocked, do first)**
`safetyAccess.ts:15` — `return allowedDomains.length === 0 || ...` returns `true`
when `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` is empty, so every Google account is a
verified student. Fail closed. Flagged in the Phase 2 notes since September and
never fixed.

**Step 2 · Land the schema**
Apply `v2/001` → `004` to the new project. Regenerate `lib/supabase/types.ts` —
do **not** hand-type it (all the `as unknown as X` casts in the app are the cost
of doing that last time). `visibility` must appear on `shirts`.

**Step 3 · Swap the gates (this alone is the product change)**
Replace `canAttemptScribble` with `canSignShirt()` at the four gates, reading
`shirts.visibility` + `shirt_circle` + `shirt_blocks`. Default `open`.
Consequence: **batch stops being an access gate and becomes a filter.** Most of
the dropoff in [07](./07-groups-privacy-and-safety.md) disappears at this step.

**Step 4 · Unblock onboarding**
Delete the cascade. One enrolment-number field → server-side roster lookup fills
name + program. Make batch optional (an Explore filter, editable later, never
required). Verification falls back to *provisional + admin review* rather than a
dead end, because `no_provider` is still true and a student must be able to get a
shirt today. Keep the WhatsApp share step — it is the growth loop and
non-negotiable.

**Step 5 · Owner safety chrome (this is what makes step 3 acceptable)**
- `who can sign` chip on the shirt view: `open` / `circle` / `approval`
- Block button on any scribble + a short block list
- Approval inbox on the dashboard: a count badge, approve/decline, no reason
  field, no timestamp on a decline

**Step 6 · Retire the old model**
Delete everything in the DELETE table, including the third request caller in
`NotificationBell.tsx:33`.

**Then, and only then:** 6a seal + public yearbook, 7a hardening (hide / report /
suspend + `writeAdminAuditLog` actually called — v1 wrote the helper and never
wired it). Groups stay deferred (D11).

### Traps — all three have bitten or will

1. **Pending scribbles leak into public counts.** Every read filtering only on
   `is_hidden` — `profile/[userId]:85-96`, `explore:89-93`, dashboard counts —
   must add `approval_status = 'approved'` the moment the column exists. Pages on
   the user-scoped client get it free from the `scribbles_read` policy; **`place`
   and `remove` use the service client and must filter explicitly.**
2. **`place:391` returns a `thank_you_message` immediately.** For a pending
   scribble that copy must read "waiting for their okay" or it is a lie.
3. **Keep the phase guard** (`v2/003:136`). Approving reveals content, so it is a
   write to the sealed artifact.

### Definition of done

Status recorded at the pause — 2026-10-14. **Code-complete for all six steps,
runtime-unverified**: the Supabase project is deleted (`dvqdwvzvfxlqwdxmakao.supabase.co`
no longer resolves), so nothing has been clicked through.

- [x] A Google account that is not on the allowlist **cannot** reach a shirt
      — `isAllowedEmailDomain` fails closed, regression-guarded in
      `tests/safety-access.test.ts`
- [x] A student gets a shirt having typed **one** number, no dropdowns
      — `app/onboarding/page.tsx` + `/api/onboarding/lookup` + `/api/onboarding/complete`
- [x] A friend opening a shared link **draws immediately** on a default shirt
- [x] An owner can hide, block, and switch mode in **one place, one tap each**
      — `app/settings/ShirtAccessPanel.tsx`
- [x] Nobody outside the author and owner ever sees a pending scribble
- [x] Batch appears only as an Explore filter; no code path refuses a signer for
      being in a different section
- [x] `git grep shirt_permission -- app` returns nothing
- [x] `tsc --noEmit` clean, `npm test` green (116/116), `npm run build` passes
      (`✓ Compiled successfully in 16.3s`), `eslint` 0 errors
- [ ] **Runtime end-to-end** — blocked. Needs a fresh Supabase project with
      migrations `v2/001`–`005` applied and `lib/supabase/types.ts` regenerated
      from it. See the note on hand-typing below.

### Where this paused

| Step | State |
|---|---|
| 1 · Fail closed allowlist | ✅ shipped (`ced33df`) |
| 2 · Schema + types | ✅ migration `v2/005` + hand-extended `types.ts` (`a1947ee`) |
| 3 · Four gates through one resolver | ✅ `lib/identity/access.ts` (`31927d5`) |
| 4 · Onboarding rewrite | ✅ code done, **not runtime-tested** |
| 5 · Owner chrome | ✅ `ShirtAccessPanel`, `ApprovalInbox`, `/api/shirt/access`, `/api/scribble/approve` |
| 6 · Retire the old model | ✅ `canAttemptScribble` deleted, 3 request-flow files removed, `shirt_permission` gone from `app/` |

**On hand-typing `types.ts`:** doc 08's working rule 2 says regenerate rather
than hand-type. That was forced exception this session — with no live project
there is no source to generate from. **The moment a project exists, run
`supabase gen types typescript` and diff against `lib/supabase/types.ts`**, then
drop this note. Until then treat every column in that file as unverified against
the real schema.

**First thing next session:** create the Supabase project, apply `v2/001`–`005`
in order, set `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` (it is empty, and now fails
closed — so nobody verifies until it is set), regenerate types, then click the
journey: sign up → dashboard → sign someone else's shirt → approve/decline →
block → settings mode switch.

### Working rules for the rebuild

1. Stage by path. Never `git add -A`, never `git clean -fd` (see Part 1).
2. `npm run build` before any push — typecheck and vitest are not enough, and
   `.env.local` points at a deleted Supabase project, so runtime needs a fresh
   one before the flows can be clicked through.
3. Update this doc in the same session as the change. Do not let chat outrun the
   spec.
4. If a step slips, cut its scope. The seal does not move.
