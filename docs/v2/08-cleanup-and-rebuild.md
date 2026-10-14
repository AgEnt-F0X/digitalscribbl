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
