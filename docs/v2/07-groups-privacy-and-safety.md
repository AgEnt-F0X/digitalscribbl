# 07 — Groups, privacy and the one-door model

> Locked 2026-09-26. This doc settles the question the earlier drafts kept
> circling: **how much access control does a shirt need, and where does the
> complexity come from?**
>
> It replaces the `shirt_permission` matrix from v1 and supersedes the
> auto-seeded cohort-group plan in [02](./02-system-map.md) § Multi-group.
> Every claim about current behaviour below is cited to a file so a later
> session can verify it instead of trusting this prose.

## The problem in one line

Two access models coexist in this repo, and the more complex one is the live
one.

| | Model A — **live today** | Model B — **designed, unwired** |
|---|---|---|
| Home | `users.shirt_permission` | `shirts.visibility` |
| Modes | `open` \| `batch_only` \| `request_only` \| `locked` | `open` \| `circle` \| `approval` |
| Approval | request-**first** (`scribble_requests`) | draw-**first**, reveal-later (`scribbles.approval_status`) |
| Batch | **access gate** | browsing filter |
| Per-person block | does not exist | `shirt_blocks` |
| Private guest list | a friend group | `shirt_circle` (one per shirt) |

Model B is `supabase/migrations/v2/003_v2_shirt_visibility_and_approvals.sql`,
`lib/identity/signing.ts`, `lib/identity/signing-queue.ts` — pure functions,
covered by `tests/shirt-visibility.test.ts` and
`tests/grouping-scope-range.test.ts`, **and referenced by nothing in `app/`**.
`lib/supabase/types.ts` has no `visibility` column on `shirts`, so migration
003 has never run against the connected database.

Model A is read at four gates, all live:

- `app/api/scribble/place/route.ts:269` (`canAttemptScribble`)
- `app/profile/[userId]/page.tsx:174`
- `app/shirts/[shirtId]/scribble/page.tsx:58`
- `app/api/shirt/social-notes/route.ts:78`

**We build Model B.** Model A is deleted, not migrated.

## Why complexity caused the dropoff, precisely

Complexity here is not the number of options. It is **options multiplied across
objects** — a permission on the user, a kind on the group, a batch on the
profile, each interacting with the others. Four live consequences:

1. **Onboarding is a three-dropdown cascade.** `app/onboarding/page.tsx:92-94`
   loads `academic_groups` → `programs` → `batches` client-side. For CSE the
   last one is a **52-option list**, and `assertBatchSelection`
   (`lib/identity/enrollment.ts:109`) makes it mandatory: *"Select your batch to
   continue."* Pick wrong and `resolveGroupingScope` silently demotes the
   student to `course`. Then `lib/identity/verification.ts` returns
   `status: 'blocked', reason: 'no_provider'`, so the mailbox code can never be
   delivered. A tollbooth of three dropdowns and an impossible step, to gate
   something the new model does not gate at all.
2. **The safe default breaks the growth loop.** The settings UI offers two
   modes and steers to `batch_only` (`app/settings/ProfileForm.tsx:27`). With 52
   sections, most friend pairs are cross-section, so most incoming signers land
   on `permissionState = 'request'` and must wait for a dashboard approval they
   will never hear about. [02](./02-system-map.md) § Growth loop is *"I open
   your shirt link → I get my own shirt → I send mine."* A request wall severs
   the first link.
3. **The dashboard fabricates groups.** `app/dashboard/page.tsx:251-266` invents
   two cards — `"<n> batch"` and `"<program>"` — with member counts taken from
   unrelated queries (`signingQueue?.length`, `onlineBatch?.length`), both
   linking to `/groups`, which `v2/004` has emptied. Two doors to an empty room.
   This is the exact "wrong section → empty room" failure that killed the
   cohort-group idea, still shipping.
4. **Verification fails open.** `lib/utils/safetyAccess.ts:15` returns `true`
   when `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` is empty, so every Google account
   becomes a verified student. Flagged in Phase 2 notes, never fixed. Today
   "anyone can scribble" is true in the worst sense, not the college-fest sense.

## The model: one door, not four

**Only the shirt has a door.** Groups are no longer a permission mechanism. A
student configures at most one dropdown, and the default needs no configuration.

### The three modes (`shirts.visibility`)

| Mode | Who draws | When it appears | Use |
|---|---|---|---|
| `open` — **default** | anyone in the cohort | immediately | Scribble day. Most students, zero setup |
| `circle` | people the owner added | immediately | The private shirt |
| `approval` | anyone | after the owner approves each person | Anyone who wants an air-conditioned shirt |

Batch is a **filter chip in Explore**, never a gate. Nobody is refused for being
in a different section.

### The always-on primitive: block

`shirt_blocks` — one row, no expiry. It **beats every mode and survives every
mode change**, so switching a shirt from `approval` back to `open` never silently
re-admits someone who was blocked. Deliberately a separate table rather than a
property of a mode, because it is the one guardrail that must outlive a mode
switch.

### Why `approval` is a reveal queue, not a permission gate

This is the sentence that makes the whole design work, and it is the answer to
"what if someone scribbles something awful":

> The writer is **never stopped**. The owner **never has to look at anything she
> did not choose**. The queue is one tap and a decline names nobody.

- The scribbler draws immediately and keeps seeing her own work — she is never
  punished for using a feature she was invited to.
- The owner sees `3 waiting` and approves or declines in one tap, with no reason
  required.
- A rejection names no one and shows no timestamp
  (`buildApprovalSummary`, `lib/identity/signing-queue.ts:81`), so a private
  moderation decision cannot be quoted back as an argument.

Compare with `request_only` today, which stops the writer *before* she draws —
that is a door closed on the person you want to recruit, at the exact moment you
are begging for signatures.

## What the owner already has (verified, not assumed)

`app/api/scribble/remove/route.ts:42-47` lets the **shirt owner**, the original
author, or an admin hide a scribble, and it is wired to the UI at
`components/shirt/ShirtView.tsx:103-137` alongside per-scribble report. So the
owner is not helpless today.

What she lacks is exactly two things, which is a much smaller build than it
looked:

1. **Pre-reveal approval** — so she never has to see a thing in order to stop it.
2. **Block** — because today removing a scribble does not stop the same person
   drawing it again five minutes later, and her only escalation is a report into
   an admin queue with days of latency.

## A deliberate non-feature

**Moderation is never inferred from gender or any other profile field.** No
"auto-approval for female users", no per-gender default. It leaks who a person
is, it is discriminatory, and it is simply wrong when a girl signs a boy's shirt.
Safety comes from the block and the reveal queue being *available and one tap
away for everyone*, not from sorting people into who is allowed to be open.

## Friend groups, finally

A friend group keeps exactly one job: **shared photos + the one-mark wall**. A
memory container, not a permission container.

- The private shirt's guest list is `shirt_circle` — no invite token, no member
  cap, no feed, no album obligation. Adding friends is *adding people to a
  shirt*, which is the verb a student already understands.
- Batch is not a group and is never seeded (`v2/002`, `v2/004`).
- Because nothing about safety depends on groups any more, **D11 closes the easy
  way: Phase 5 stays deferred past convocation.**

## Journey verification

| Journey | Today | Under this model |
|---|---|---|
| First day | 3 dropdowns + 52-option required batch + a verification step that cannot send | Enrollment number → server-side roster lookup → shirt. Batch optional, editable later |
| Open a friend's shirt link | Likely a request wall (`batch_only`, cross-section) | Draws immediately. `open` is the default |
| Owner wants privacy | Pick `request_only`, which also shuts everyone out; hide after the fact; no block | One dropdown: `circle` or `approval`, plus block |
| Group browsing | Two fake cards → empty `/groups` | Real friend groups only, still deferred |
| Someone scribbles something awful | See it → hide it → they come back → report → wait for admin | Never revealed → decline → blocked permanently, one tap |

## Rollout — ordered by leak size, not tidiness

1. `isAllowedEmailDomain` fails **closed**. One line; a live security hole.
2. Default `visibility = 'open'`; apply `v2/003`; regenerate `types.ts`.
3. Replace all four gates with `canSignShirt()`. This alone converts batch from
   wall to filter.
4. Onboarding: delete the cascade, look the enrollment number up server-side,
   make batch optional, and let verification fall back to *provisional + admin
   review* instead of a dead end.
5. Owner chrome: `who can sign` chip + block on the shirt view, approval badge on
   the dashboard.
6. Delete `scribble_requests`, `ScribbleRequestActions.tsx`,
   `RequestScribbleButton.tsx`, the fake dashboard group cards, and
   `shirt_permission` from every read site.

**This deletes more code than it adds.** That is the test of whether it is
genuinely simpler: onboarding loses a screen, settings loses a radio pair, the
shirt gains one chip and one badge. Fewer screens than today.

### Three traps when the switch happens

- Every read that filters only on `is_hidden` leaks pending scribbles the moment
  `approval_status` exists — `app/profile/[userId]/page.tsx:85-96`,
  `app/explore/page.tsx:89-93`, dashboard counts. Pages using the user-scoped
  client get the filter free from the `scribbles_read` policy; `place` and
  `remove` use the **service client** and must filter explicitly.
- `place` returns a `thank_you_message` immediately
  (`app/api/scribble/place/route.ts:391`). For a pending scribble that copy must
  become "waiting for their okay" or it reads as a lie.
- Keep the phase guard in `v2/003:136` — approving is a write to the finished
  artifact and must stop when the shirts seal.

## Still open

The **rollout fork** is the only thing blocking code, recorded as D12 in
[06](./06-open-decisions.md): D6 ("fresh project, no data migrated") and the
v1-shaped live app pull in opposite directions.


