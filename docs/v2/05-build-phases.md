# 05 — Build phases

> This is the implementation queue. When a phase **starts**, lock the relevant bits of 01–04, then write SQL/code. When it **ends**, tick it here and note what drifted.
> Nothing below is in progress until so marked.

## Decision recorded 2026-09-01

**We build v2.** v1 is not shipped; its code is reference only (rule 4 in the [README](./README.md)).

**The September date is flexible. Convocation (November 2026) is not.**

That inverts the usual priority. The goal is not "ship early" — it is **ship something high quality that is genuinely ready in November.** Which means:

1. **The signing window is the product.** A yearbook full of signed shirts looks beautiful. A yearbook of 200 empty shirts looks broken, no matter how clean the schema is. Every week of signing we lose is quality we cannot get back.
2. **Therefore Phase 1 + 2 are the whole ballgame.** They must land by end of September or the signing window collapses.
3. **Scope, not speed, is how we get quality.** Cutting one feature well beats shipping three badly.

## Dated plan

Today is 2026-09-01. Convocation is November 2026. Roughly **9 weeks** to the hard wall.

| Phase | Window | Weeks | Why it sits there |
|---|---|---|---|
| **1** Backend skeleton | Sep 1 – Sep 14 | 2 | Blocks everything. Nothing else can start. |
| **2** Auth + onboarding + shirt #1 | Sep 15 – Sep 28 | 2 | **Signing window opens here.** Slip this and November suffers. |
| **3** Scribble studio | Sep 29 – Oct 19 | 3 | The product. **Port v1 — do not rewrite.** |
| **4a** Convocation slot only | Oct 20 – Oct 26 | 1 | Only the 4th slot. Solo slots 1–3 can wait. |
| **6a** Seal + public yearbook | Oct 20 – Oct 26 | 1 | Shirts seal late Oct. `/u/[slug]` + `/yearbook` go live. |
| **7a** Hardening minimum | Oct 27 – Oct 31 | 1 | Hide / report / suspend + audit log. A public archive needs this. |
| — **Buffer** | Oct 27 – Oct 31 | — | Assume Phase 3 overruns. It will. |
| **Nov** | Convocation window on | — | `convocation_uploads = on`. Photos go up. |
| **4b / 5 / 7b** | After convocation | — | Solo slots, groups, full hardening. |

### Critical path

```text
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 6a ──► convocation
                                        ▲
                                   Phase 4a
                                        ▲
                                   Phase 7a (must ship with 6a)
```

Phase 5 (groups) is **not** on the critical path. Phase 4b and 7b are not either.

## Recommended cut — needs your call

**Defer Phase 5 (groups) past convocation.** It is the only phase that is:

- not required for a shirt to be signed,
- not required for a convocation photo to be uploaded,
- not required for the public archive to exist,
- and the most work (create/join/leave, member cap, album, one-mark wall, invite tokens).

Groups are lovely. They are also the most likely reason this misses November. Shipping **shirts + convocation photos + a public archive**, done well, beats shipping shirts + photos + archive + a half-finished groups feature.

If you disagree, the alternative cut is Phase 3 reactions (D8) — but that is days of work, not weeks, so it buys far less.

---

## Phase 0 — Spec (current)

**Goal:** this folder exists and matches the 2026-08-14 discussion.

- [x] New docs tree
- [x] Compare to v1
- [x] System maps (flow, privacy, storage, schema draft)
- [ ] Lock remaining calls in [06](./06-open-decisions.md)
- [ ] Mark schema slices locked before Phase 1 SQL

**Exit:** open decisions that block a new database are closed.

> **This exit gate is now urgent.** Phase 1 is scheduled to start this week, and it cannot start until the identity + media slices of `04-schema.md` are locked. Close **D6, D7, D9** at minimum — they directly block the new project. The rest can stay open.

---

## Phase 1 — New backend skeleton

**Window:** Sep 1 – Sep 14 · **Status:** in progress (schema + identity written 2026-09-25).

**Goal:** empty, clean Supabase project + Cloudinary contract. No product UI rewrite yet.

- New project (throw away v1 schema; keep Google OAuth settings notes)
- Migration for identity + academic seed (CSE 2026 only) + `platform_settings` + `media_assets` stubs
- Generated types — `04-schema.md` says **generate, do not hand-type**
- Signed upload helper (**replace the unsigned preset** — see drift note)
- Env: URL, anon, service role, Cloudinary **signed** keys — no `DATABASE_URL` in the Next app

**Docs to update when this starts:** `04-schema.md` (lock identity + media), `03-storage.md` (lock sign route).

### Written 2026-09-25 — what exists now

| Artifact | What it does |
|---|---|
| `supabase/migrations/v2/001_v2_launch_schema.sql` | Fresh-project schema. Enrollment-anchored `users` with `verification_status`; configurable `programs` (`key`, `level`, `batches_enabled`, `batch_count`); `batches`; shirts/scribbles/notes/reactions; `friend_groups` with `kind ∈ {free,course,batch}` and one-group-per-course/batch uniqueness; `platform_settings` + phase trigger; RLS on every table; column grants that withhold `email`/`is_admin` from the browser. |
| `supabase/migrations/v2/002_v2_programs_and_groups.sql` | Seeds Bennett + 28 roster programs. Only `btech-cse` is batch-enabled with 1..52. Batch rows and cohort groups are **generated** from each program's config, so enabling batches elsewhere is a data change. |
| `lib/identity/enrollment.ts` | Pure rules: enrollment normalization, institutional mailbox construction, masked display, batch validation, batch-vs-course grouping fallback. |
| `lib/identity/roster.ts` | Server-only roster loader. Exact-key lookup only, drops nameless rows, fails closed via a sentinel (not `null`) so a broken deploy can't masquerade as "not on the list". |
| `lib/identity/verification.ts` | Provider boundary. With no mail sender configured, sending is **blocked**, not simulated. |
| `tests/enrollment-identity.test.ts`, `tests/roster-lookup.test.ts`, `tests/verification-provider.test.ts`, `tests/grouping-scope-range.test.ts`, `tests/roster-loading.test.ts` | 39 tests covering the three modules. Suite: 102 passing. |

### Audit fix 2026-09-26 — 5 defects found and fixed

Self-review of the Phase 1 work. All five were caught by reading the code and
SQL against the intent, not by the tests passing.

| # | Defect | Severity | Fix |
|---|---|---|---|
| A1 | `resolveGroupingScope` hardcoded the CSE range of 52 for **every** program, so a 4-section course would accept batch 20 and create an empty batch group | High — silently splits cohorts, the exact failure the v1 audit found | `batchMax` param sourced from `programs.batch_count`; regression test `tests/grouping-scope-range.test.ts` |
| A2 | `platform_settings` was the only one of 18 tables with **no RLS**. `current_phase()` reads it, and default Postgres privileges would have let any anon key flip the phase (open or freeze signing) via PostgREST | High — anyone with the public anon key could end the signing window | RLS enabled, no policies (denies anon/authenticated), explicit revokes, plus `alter default privileges` so a *future* migration can't re-expose a table |
| A3 | `enforce_user_academic_shape()` never checked the batch belongs to the user's own program, so a BBA student could point at a CSE batch row and land in the wrong cohort | High — wrong cohort | Trigger now rejects unknown batches and any batch whose program ≠ the user's program |
| A4 | `loadRosterIndex()` memoized `null` on failure for the life of the process, so one transient read error silently disabled verification until restart | Medium | `resetRosterCache()` documented as a production API, not a test seam; `tests/roster-loading.test.ts` covers recovery |
| A5 | `import 'server-only'` was a **dead guard** — the package isn't installed, so the statement was silently dropped rather than protecting the roster from client bundling | Medium — false sense of safety | Replaced with a documented real guard: the module imports `node:fs`, which cannot be bundled for the client. `import 'server-only'` must not be reintroduced without adding the dependency. |

Self-inflicted error caught mid-audit: the A2 patch briefly changed
`grant insert` to `grant select` on `user_reports`, which would have broken the
report-insert policy. Reverted and re-verified.

Suite: **102 passing** (was 95), `tsc --noEmit` clean, lint 0 errors.

**Still needed for Phase 1 to close:**

1. Create the fresh Supabase project and run `001` then `002` in the SQL editor.
2. Point the server at the roster: set `SCRIBBL_ROSTER_PATH` to the dataset path
   (currently `C:\Users\rudra\AppData\Local\scribbl-private\roster\students.json`,
   deliberately outside the repo).
3. Configure the institutional mail sender + verified domain so OTP can leave
   `blocked`. Until then no student can complete verification.
4. Reconcile the app's Supabase clients to the new project (URL/anon/service role).


### Drift found 2026-09-01 — fix during this phase

`lib/utils/cloudinary.ts` already exists (dated 2026-07-29) and is wired into `app/api/avatar/upload-head/route.ts`. It uses an **unsigned preset**, which [`03-storage.md:45`](./03-storage.md) explicitly says not to keep. Rewrite it as signed, or delete it and start clean. Do not carry it forward silently.

Also: seed **one** academic hierarchy. v1 shipped three competing seeds (two of them migrations, so both run in production) and ended up with duplicate program names and two disjoint batch sets — which silently broke batchmate signing. That is exactly what `04-schema.md:8` warns against. Seed the real CSE 2026 sections and nothing else.

---

## Phase 2 — Auth, onboarding, shirt #1

**Window:** Sep 15 – Sep 28 · **Status:** not started.

**Goal:** CSE student can log in, onboard, share a shirt link, see an empty shirt.

- Domain gate, guest fork
- Onboarding without school picker; slug; shirt 1 = primary
- WhatsApp share as last step (**non-negotiable** — `01-product.md:48`: "Explore does not recruit 500 people")
- `proxy.ts` role gate on the new columns
- **Ship `/guest`.** v1's proxy redirects guests to `/guest`, but that route was never built — the redirect 404s today.
- **Fail closed on the domain allowlist.** v1 returned "verified" when `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` was empty. One-line fix; without it every Google signup becomes a verified student.

**This phase opens the signing window.** Protect these dates over everything else in this document.

---

## Phase 3 — Scribble studio (the product)

**Window:** Sep 29 – Oct 19 · **Status:** not started.

**Goal:** place / remove / report / react / lock / occupancy / second and third shirts with primary picker.

**Port v1 — do not rewrite.** The v1 studio is the most-polished thing in the repo: all six P0 bugs from `docs/23-scribble-studio-audit.md` were fixed and verified (canvas rebuild per stroke, retina scaling, draft persistence, eraser cursor, keyboard shortcuts, publish-clears-canvas). Rewriting it from scratch risks shipping something worse than you already have, which is the opposite of this year's goal.

Copy patterns, not tables:

- `components/scribble/DrawingCanvas.tsx` — Fabric setup
- `src/features/scribble/components/ScribbleStudio.tsx` — state, shortcuts, publish
- `app/api/scribble/place/route.ts` — sanitization + occupancy + rate limit

No voice. No `box_claims`.

---

## Phase 4 — Photos

**Goal:** PFP + 3 solo slots, batch-only album on profile, replace-in-slot, caps, transcode.

**Split in two:**

**4a — Convocation slot (Oct 20 – Oct 26).** The 4th slot, visible but locked until `convocation_uploads` flips on. **This is the one that matters for November.** Ship it with Phase 6a.

**4b — PFP + 3 solo slots (after convocation).** Nice at launch, not required for it.

---

## Phase 5 — Groups

**Goal:** create / join / leave, member cap, group album, one-mark wall. No group shirt.

**Status:** not started. **Recommended: defer past convocation** — see the cut note above. Decide before Phase 3 starts so the schema can skip or stub `friend_groups` / `friend_group_members` / `group_marks` accordingly.

---

## Phase 6 — Yearbook + convocation window

**Goal:** phase flags, seal shirts, public `/u/[slug]` + `/yearbook`, card style toggle, unlock 4th slot + group convocation tag, then freeze media.

**Window for 6a:** Oct 20 – Oct 26.

D9 leans **server-rendered** public profiles so email and enrollment can never leak. Do that — it is both safer and simpler than fighting RLS column grants.

---

## Phase 7 — Hardening

**Goal:** hide/report/suspend, audit log, PNG download of primary shirt, empty states, friend test.

**7a (Oct 27 – Oct 31) — minimum for a public archive:** hide scribble, hide photo, suspend user, and `writeAdminAuditLog` **actually called**. v1 wrote the helper and never wired it — do not repeat that.

**7b (after convocation):** PNG download, empty states, friend test runbook.

---

## Explicitly after v2.0 (not a phase until we say so)

Other schools, voice, polaroids on the shirt, share-link attribution, email digest, account-delete OTP, group canvas, 1,400-person batch whiteboard.

## How to use this file in later chats

Start of a phase: set **Status: in progress**, paste the locked decisions, then implement.
End of a phase: Status complete, list "drift from spec" in 3 bullets, patch 01–04 if the product changed.

**One more rule for this year:** if a phase is going to slip, cut its scope — do not push the date. The November wall does not move, and a smaller thing done well is the entire point.
