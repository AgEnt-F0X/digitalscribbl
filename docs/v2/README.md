# Scribbl v2 — Rebuild docs

> **Status:** planning. Canonical for product + backend from 2026-08-14 onward.
> **v1 docs** (`docs/01`–`23`) are history. Do not implement from them unless this folder explicitly keeps a decision.
> **Design language** still lives in [`../18-sunlit-lawn-theme-spec.md`](../18-sunlit-lawn-theme-spec.md) until v2 has its own UI spec.

This folder is the living spec for the **clean rebuild**: new Supabase schema, Cloudinary for all binaries, convocation-timed yearbook. We update these files as each build phase starts — schema and routes are not done until the matching section here is marked **locked**.

## Read order

| # | Doc | What it is |
|---|---|---|
| 00 | [From v1](./00-from-v1.md) | What we keep, cut, and reverse from the old doc set |
| 01 | [Product](./01-product.md) | Story, audience, timeline, what this is not |
| 02 | [System map](./02-system-map.md) | Phases, user flow, privacy, roles, surfaces |
| 03 | [Storage](./03-storage.md) | Supabase vs Cloudinary, caps, 25 GB math |
| 04 | [Schema](./04-schema.md) | Tables and flags (discussion-level until a build phase locks SQL) |
| 05 | [Build phases](./05-build-phases.md) | Implementation order. Update this when a phase starts. |
| 06 | [Open decisions](./06-open-decisions.md) | Unlocked calls. Empty this as we lock them into 01–04. |
| 07 | [Groups, privacy & the one-door model](./07-groups-privacy-and-safety.md) | **Locked 2026-09-26.** Who may sign what, the approval reveal queue, blocks, and the audited dropoff journeys |
| 08 | [Cleanup ledger & rebuild plan](./08-cleanup-and-rebuild.md) | **Locked 2026-10-14.** Verified dead-code ledger, and the build order for wiring the v2 model in |

## One-line product

We missed scribble day in May. Sign the shirts before convocation. In November, drop the gown photos and lock a public Class of 2026 CSE archive — shirt still in the center of every profile.

## Working rules

1. **Docs first.** If a discussion changes the product, edit this folder in the same session. Do not let chat outrun the spec.
2. **No SQL until schema is locked** in `04` for that slice.
3. **No new table** unless a screen in `02` reads or writes it.
4. **v1 code is reference, not source of truth.** The live Supabase project/schema is thrown away. New project + new migrations.
5. **Sunlit Lawn stays** until we explicitly respec UI.

## Current lock state

| Area | State |
|---|---|
| Story + timeline | Draft — see 01 |
| Privacy split (public profile vs batch/group albums) | Draft — see 02 |
| **Shirt access (open / circle / approval + block)** | **Locked 2026-09-26 — see [07](./07-groups-privacy-and-safety.md)** |
| **Groups are opt-in, unseeded, never a permission container** | **Locked 2026-09-26 — see 04 + 07** |
| Storage split + photo caps | Draft — see 03 |
| Schema | Draft — see 04 |
| **Schedule** | **Set 2026-09-01 — see [05](./05-build-phases.md)** |
| SQL / new Supabase project | Not started (Phase 1 window opens Sep 1) |
| UI respec | Not started (still doc 18) |

## 2026-09-01 decisions

- **We build v2.** v1 is not shipped; its code is reference only (rule 4).
- **September is flexible. Convocation (November 2026) is not.** The hard wall is ~9 weeks out.
- **Quality comes from scope, not speed.** If a phase slips, cut its scope — do not push the date.
- **The signing window is the product.** Phase 1 + 2 must land by end of September or the yearbook ships empty.
- **Closed 2026-09-26:** groups (Phase 5) do defer past convocation — D11. The
  access model is locked in [07](./07-groups-privacy-and-safety.md), and safety no
  longer depends on groups once `circle`, `approval` and block exist.
- **Open:** the rollout fork only — D12 in [06](./06-open-decisions.md).

## 2026-09-26 audit note

The one-door model was already written as SQL (`supabase/migrations/v2/003`),
pure functions (`lib/identity/signing.ts`, `signing-queue.ts`) and unit tests —
but **no file in `app/` reads it**, and `lib/supabase/types.ts` has no
`shirts.visibility` column. The live app still enforces the v1
`users.shirt_permission` matrix at four gates. Doc 07 records both the model and
that gap, with file:line citations, so the next session fixes the wiring rather
than rediscovering the design.

