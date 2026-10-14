# 04 — Schema (draft)

> Not SQL. Do not create tables until a build phase marks this section **locked**.
> Principle: if it isn’t on a screen in `02-system-map.md`, it doesn’t get a table.

## Academic (frozen for CSE 2026)

Seed **one** group, **one** program, **one or N CSE batches** — whatever the real CSE 2026 sections are. Not 52 dummy batches and not five Bennett schools.

- `academic_groups`
- `programs`
- `batches`
- `program_requests` (mailbox only; no admin workflow required for launch)

Onboarding does not cascade schools. It may still pick **batch/section** if CSE has more than one.

### Locked 2026-09-25 — roster-driven, configurable programs

Superseded by the decision below. Programs are now seeded from the official
convocation roster and **batches are a per-program switch, not a hardcoded 52**.

**Identity source:** the convocation roster (2,563 students; 1,510 CSE) is the
authoritative list of who may own a profile. A student types only their
**enrollment number**; name and program are looked up server-side from the
roster. The roster is private PII and is never shipped to the browser or Git.

**`programs` gains three columns:**

| Column | Purpose |
|---|---|
| `key` | stable identifier used by app code and URLs (`btech-cse`) |
| `level` | `UG \| PG \| DIPLOMA \| PHD`, taken from the roster |
| `batches_enabled` + `batch_count` | when true, students pick batch 1..`batch_count` |

**Launch configuration:** only `btech-cse` is batch-enabled, `batch_count = 52`.
All other programs are course-wide. Enabling batches for another course is a
single `UPDATE` on its row plus re-running the batch-group generation in
`supabase/migrations/v2/002_v2_programs_and_groups.sql` — no new code, no new
dummy rows.

**Grouping rule** (implemented in `lib/identity/enrollment.ts`): a student is
`batch`-scoped only when their program has batches enabled *and* they chose a
batch in range. Otherwise they fall back to `course`. A missing or out-of-range
batch must never create a phantom batch group, because that silently splits a
cohort that should be able to sign each other.

**Verification:** the roster proves a student *exists*; it does not prove
*messaging them* works. Ownership is proven with a one-time code sent to the
institutional mailbox `<enrollment>@bennett.edu.in`. Until a mail sender is
configured, sending is **blocked** (`lib/identity/verification.ts`) rather than
simulated — a stub that reported success without sending mail would let anyone
claim any enrollment number.

**Guests:** non-roster Google accounts are visitors/signers. They authenticate
with Google only, never enroll, and never own a shirt. There is no
"request manual verification" route for them; manual review is reserved for
roster students whose mailbox cannot be reached.


## Identity

`users` (id = `auth.users.id`)

> **Locked 2026-09-25.** `enrollment_number` is now `NOT NULL UNIQUE` and is the
> identity anchor: a profile cannot exist without a roster-matched enrollment.
> `verification_status` (`unverified`/`pending`/`verified`/`rejected`) and
> `verified_at` were added so a student who matches the roster but has not yet
> proven mailbox access is not treated as verified. Guests are non-roster
> Google accounts and are excluded from the enrollment requirement by role,
> not by leaving the column nullable.


Keep flags: `email`, `display_name`, `enrollment_number`, `batch_id`, `program_id`, `academic_group_id`, `avatar_config` (json, no URLs), `yearbook_quote`, `thank_you_message`, `shirt_permission`, `is_admin`, `is_suspended`, `is_university_verified`, `is_guest`, `is_deleted`, `onboarding_completed`, `yearbook_visibility`, `yearbook_card_style` (`graduation_photo` | `scribble_avatar`), `primary_shirt_id`.

**No** `head_front_url` / `head_back_url` / raw Cloudinary URLs.

`profile_slugs` — one current slug per user. Public profile is `/u/[slug]`. Insert when onboarding completes.

## Media

```text
media_assets
  id
  uploader_id
  kind            -- pfp | solo | convocation | group_photo | shirt_render
  cloudinary_public_id
  resource_type   -- image
  bytes, width, height, format
  created_at

user_media
  user_id
  media_id
  slot            -- pfp | solo_1 | solo_2 | solo_3 | convocation | featured
  unique (user_id, slot)

group_media
  group_id
  media_id
  tag             -- general | convocation
  created_at
```

`featured` points at an existing solo/convocation/pfp row (or a slot enum). Don’t upload a sixth file for the yearbook card.

## Shirts and scribbles

`shirts`

- `owner_id` always set. **No `group_id`.**
- `shirt_number` 1–3
- **`visibility`: `open` | `circle` | `approval`** (default `open`)
- occupancy, lock, texture **media ids** (front/back/sleeves) not URLs
- uniqueness `(owner_id, shirt_number)`

`users.primary_shirt_id` → one of their shirts. Yearbook and share use this.

`scribbles` — panel, bbox, `canvas_json`, `canvas_svg`, flags, scribbler. **No voice columns. No is_anonymous.**
- **`approval_status`: `pending` | `approved` | `rejected`** (default `approved`)

`scribble_requests` — pending / approved / rejected
`scribble_reactions` — same emoji set as v1 if we keep reactions
`scribble_reports`

`shirt_notes` (rename of social notes)

- public by default
- optional `visibility: public | private` **only if we lock private notes in 06**

Phase trigger: block scribble + public-note inserts unless `phase` in (`scribble_open`, `countdown`).

### Locked 2026-09-26 — visibility, not a permission matrix

Supersedes the `shirt_permission` model (`open` / `batch_only` / `request_only` /
`locked`) and the seeded cohort groups. Two rules replace them:

**1. `users.shirt_permission` is retired.** Access lives on the shirt, not the
user, because a student may want one shirt open to the whole college and one
shirt private. A single user-level switch cannot express that.

| Mode | Who can sign | Lands as | Use it for |
|---|---|---|---|
| `open` *(default)* | anyone with the link | immediately | real scribble day |
| `circle` | only people the owner added | immediately | the private shirt |
| `approval` | anyone may draw | `pending`, owner reviews | full control, no moderation burden beyond one tap |

**2. Batch is a browsing filter, never an access gate.** Nobody is ever refused
for being in a different batch. The old `batch_only` mode did exactly that, and
the v1 audit already found the same class of bug in the academic seeds.

**New tables:** `shirt_circle` (the private shirt's guest list — not a "group",
no member cap, no invite token, no feed) and `shirt_blocks` (one row per
blocked person, no expiry).

**Blocks are unconditional and outlive mode changes.** A block is its own table,
not a property of a mode, so switching a shirt from `approval` back to `open`
never silently re-admits someone who was blocked. This is the one guardrail that
must survive a mode change, so it deliberately sits outside the mode.

**Approval is a queue on the scribble, not a lock on the shirt.** A pending
scribble is visible to its author and to the shirt owner and to nobody else
(RLS policy on `scribbles_read`). The author keeps her work; only the public
reveal waits. A decline names no one and shows no timestamp, so a private
moderation decision cannot be quoted back as an argument.

**Why this is less complex, not more:** the student configures at most one
dropdown, and the default needs no configuration. Nothing is auto-created for
her, and there is no section to get wrong. The v2 docs previously required an
auto-join into a batch group; that is now removed, because a student in the
wrong section saw an empty room — the fastest way to lose a signer.

Implemented in `lib/identity/signing.ts` (access) and
`lib/identity/signing-queue.ts` (approval), migration
`supabase/migrations/v2/003_v2_shirt_visibility_and_approvals.sql`.

## Groups

> **Locked 2026-09-26 — groups are opt-in and unseeded.** The earlier plan
> created one course group per program and one batch group per section, and
> auto-joined every student. That is removed. What remains is a free-form
> friend group the student creates herself and people she invites. Batch is a
> browsing filter, not a group. The private shirt uses `shirt_circle`, which is
> a guest list for one shirt, not a group.

`friend_groups` — name, admin, invite token
`friend_group_members`

`group_marks`

- unique `(group_id, user_id)` — **one mark**
- `body` text
- optional `doodle_svg` (small) **or** `media_id`
- editable until yearbook phase

No group shirt row.

## Yearbook / ops

`notifications` — service-role insert only  
`platform_settings` — `phase`, `scribble_ends_at`, `yearbook_opens_at`, `convocation_uploads`, degrade flags  
`user_reports`  
`error_logs`  
`admin_audit_logs`

**Optional later:** `yearbook_renders` as cache of shirt PNG media ids. Can also store those ids on `shirts` and skip a table until the flatten job exists.

**No materialized view** until the yearbook grid is slow. 1,000 rows is a query, not an MV.

## Explicitly not in v2.0

`share_links`, `share_link_visits`, `account_delete_otps`, `system_health_runs`, `box_claims`, `export_requests`, `yearbook_grid_stats`, voice columns, `is_anonymous`, `shirts.group_id`.

## RLS (intent)

- Reads: authenticated for app; public select for the **yearbook profile columns + primary shirt scribbles** (or serve public profiles only through a server route — safer, decide in the yearbook build phase).
- Writes: **API + service role** for shirts, scribbles, media joins, notes, marks. Same lesson as v1 migration 008.
- Column grants: never expose `email`, `enrollment_number`, `is_admin` to the browser client.

## Types

Generate `lib/supabase/types.ts` from the new project. Do not hand-type. Do not leave clients untyped.

## Apply strategy

New Supabase project. New migration `001` that is this schema in one pass (or a short numbered set written together). Do not replay v1 001–013. Do not run the old `seed.sql`.
