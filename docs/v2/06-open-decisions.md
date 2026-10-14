# 06 — Open decisions

> Close these by moving the answer into 01–04 and deleting the row. Don’t implement on a guess.

| ID | Question | Lean | Blocks |
|---|---|---|---|
| D1 | Is `/u/[slug]` viewable **with zero login** (shirt + card + quote)? | **Yes** — that’s the public archive. Albums still login | Yearbook phase, RLS vs server-rendered public page |
| D2 | Are shirts 2–3 on the public profile? | Lean **yes** as extra pages | Schema isn’t blocked; profile UI is |
| D3 | Private notes (only owner + writer)? | Unlocked. Public notes are enough to ship | `shirt_notes.visibility` |
| D4 | Max groups / max members | **Closed 2026-09-26 — moot for access.** A friend group is no longer a permission container (see [07](./07-groups-privacy-and-safety.md)); `shirt_circle` has no cap. The 6 / ~40 caps only ever apply to the deferred photo group | Phase 5 |
| D5 | After shirts seal, can group photos still go up until convocation window ends? | **Yes**, only `tag = convocation` and the 4th solo slot | Phase 6 flags |
| D6 | Any data on the current Supabase project to keep? | **Closed 2026-09-25 — no. Fresh project, v2 schema, no data migrated** | Phase 1 |
| D7 | How many CSE **sections/batches** to seed? | **Closed 2026-09-25 — 1..52 for `btech-cse` only, via `batches_enabled`/`batch_count`; every other program is course-wide** | Phase 1 seed |
| D8 | Reactions on scribbles in v2.0? | Lean **keep** (cheap, already loved if used) | Phase 3 |
| D9 | Public profiles via PostgREST or only Next.js server render? | Lean **server render** so email/enrollment can never leak | Phase 6 |
| D10 | Guest: still allowed to sign `open` shirts without a request? | **Yes — and now unconditional.** `open` is the default mode and the request flow is being deleted, so a guest with a link signs like anyone. `shirt_blocks` still applies | Onboarding copy |
| D11 | **Defer groups (Phase 5) past convocation?** | **Closed 2026-09-26 — yes.** Safety no longer depends on groups once `circle` + `approval` + block exist, so nothing on the critical path needs them | — |
| D12 | **Rollout fork for the one-door model.** | **Closed 2026-10-14 — option (a): rebuild after cleanup.** Apply v2 `001`–`004` to a fresh project and wire the gates properly. Rationale: the two models were fighting in one repo and the faster additive route kept the v1 debt that caused the dropoff. Build order in [08](./08-cleanup-and-rebuild.md) | — |


## Blocking code this week

**D4, D6, D7, D10 and D11 are now closed** (2026-09-25 / 26) — see the table
above and [`04-schema.md`](./04-schema.md). The access model itself is no longer
an open question: it is locked in [07](./07-groups-privacy-and-safety.md).

What remains:

- **Nothing** — the access model is locked in [07](./07-groups-privacy-and-safety.md)
  and the rollout fork (D12) is closed. The build order is
  [08](./08-cleanup-and-rebuild.md).

## Locked in discussion (already in 01–04)

- Cloudinary for binaries, Postgres for operations + scribble vectors
- Throw away v1 schema; don’t migrate 001–013
- CSE 2026 only; no school picker
- 1 PFP, 3 solos, 1 convocation slot
- Group album + one-mark wall; no group shirt; no batch whiteboard
- Up to 3 shirts, user-chosen primary
- Voice out
- Photos not composited onto the shirt
- Yearbook card: graduation photo **or** scribble avatar; opened profile is shirt-first
- Unsigned Cloudinary preset out; signed uploads in
- Recompress to ~1600px WebP or 25 GB is a lie
- Growth = WhatsApp shirt link at end of onboarding
- **One door, not four** — only the shirt carries access (`open` / `circle` /
  `approval`), block is a separate always-on primitive, and a friend group is a
  memory container rather than a permission container. Batch is a browsing
  filter and never a gate. See [07](./07-groups-privacy-and-safety.md)
- `scribble_requests` is **deleted, not migrated** — approval becomes a reveal
  queue on the scribble, so no writer is ever stopped before drawing
- Moderation is never inferred from gender or any other profile field

