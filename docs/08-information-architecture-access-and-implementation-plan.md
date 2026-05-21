# 08 — Information Architecture, Role Access, Sharing, and Implementation Plan

> Status: review plan before implementation. This file corrects the current partially wired role/access model and locks the product logic before more UI work.
>
> **This doc supersedes conflicting sections of docs 01–06.** Where conflicts existed, the older doc is annotated with strikethroughs + a pointer back here. Doc 07 records the history. Docs 09 (free-tier fallback) and 10 (scribble→yearbook transition) extend this doc with operational + lifecycle plans.

## Decisions Locked On 2026-05-21 — Round 2 (afternoon)

> These resolve the 14 open audit points raised after the morning review. They override anything earlier in this file that contradicts them. Earlier text is kept for history; treat anything older as superseded.

### 1. Notifications + realtime by role
- **Verified students**: all current event types (`scribble_received`, `request_received`, `request_approved/rejected`, `scribble_reaction`, `shirt_unlocked`, `admin_broadcast`, `scribble_removed`).
- **Guests**: only events they caused or are the subject of — `request_approved`, `request_rejected`, `scribble_removed_on_their_scribble`. No batch / admin / level / unlock events.
- **Suspended**: no notifications fire; existing rows stay in DB until manual cleanup.
- **Realtime channels**: guests can subscribe to `shirt:<id>` only if they have an approved request for that shirt or an active `share_link_visit` for it.

### 2. Anonymous scribbles — CUT
Anonymous scribbles are removed from v1 entirely. Voice notes cover the emotional weight previously assigned to anonymous text. Reasons:
- `is_anonymous` + voice is contradictory (voice is identifying); supporting both means runtime branching everywhere.
- Moderation gets harder (admin must always see the real scribbler; the surface area for leaks grows).
- Email digest, exports, yearbook all needed special-case branches.

**Action**: keep the `scribbles.is_anonymous` column (migration 009 already shipped) but never read or write it from the app. Drop it in a future migration. Remove all UI toggles and route handling.

### 3. Voice-note access rules
| Viewer | Can play voice? |
|---|---|
| Shirt owner | Yes |
| Scribble's own scribbler | Yes (so they remember what they left) |
| Anyone else (visitor, batchmate, guest) | No — see only "voice attached" indicator |
| Admin | Yes (for moderation; logged in `admin_audit_logs`) |

Storage: voice clips live in `shirt-textures/voice/<shirt_id>/<scribble_id>.webm`. Bucket stays public for simplicity, but URLs are not enumerated in any public route output — only injected server-side for the two allowed viewers above. When a scribble is hidden by owner or admin, the voice blob is **kept** (in case of restore); when a scribble is permanently deleted, the blob is deleted too.

### 4. Group canvas — keeping; ownership + moderation rules
A friend group can have **one** shared shirt canvas:
- Row in `shirts` with `owner_id = NULL` and `group_id = <group>`.
- **Owner** = the group admin (one user, derived from `friend_groups.admin_id`).
- **Who can scribble**: group members only.
- **Lock**: the group admin can lock the canvas.
- **Moderation**: admin (Scribbl-level) can hide/remove scribbles same as any shirt. Group admin can remove scribbles from their own canvas.
- **Export**: group members can download a PNG of their group canvas. Yearbook also includes the group canvas as a group artifact.
- **Permission model**: the canvas has no `request_only` mode — it's group-members-only by default. Joining the group is the gate.

### 5. Slug churn protection
- Slug change limit: **once per 30 days** per user. Stored in `profile_slugs.updated_at`.
- Reserved slugs (system-only, blocked at creation): `admin`, `login`, `auth`, `api`, `dashboard`, `onboarding`, `settings`, `explore`, `groups`, `yearbook`, `activity`, `dev`, `i`, `u`, `g`, `help`, `terms`, `privacy`, `about`, `scribbl`, `support`.
- Old slug always 301-redirects via `profile_slug_history`. QR codes printed against an old slug keep working forever.
- Slug minimum length: 3 chars; max 40; lowercase `a-z 0-9 -` only; no leading/trailing hyphen.

### 6. Invite code alphabet
- `nanoid` with **custom alphabet**: `23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz` (no `0/O/1/I/l`, no underscore/hyphen).
- Length **10 chars** → ~57 bits entropy → infeasible to guess at rate-limited 5 attempts/minute per IP.
- Codes are case-sensitive; URL `/i/<code>` resolves only exact match.

### 7. Account deletion (NEW)
Required flow:
1. Settings → "Delete my account" button.
2. UI explains what gets removed and what stays.
3. Server sends a 6-digit OTP to the user's email (Resend).
4. User enters OTP within 15 minutes.
5. On confirm:
   - User row → `is_deleted = true`, `deleted_at = now()`, PII fields nulled (`email`, `display_name`, `enrollment_number`, `head_front_url`, `head_back_url`, `avatar_config`, `thank_you_message`, `yearbook_quote`).
   - **Scribbles they placed on other people's shirts STAY** (other users' memories matter more than the leaver's right to disappear). Author shows as "Removed user".
   - **Their own shirt + its scribbles STAY** as a "memorial" yearbook entry by default, since friends signed it. User can opt-out at delete time to nuke it.
   - Voice notes they left STAY but caption flips to "Voice from a removed user". Owner can still hear it.
   - Relationships / requests / reactions: anonymised but rows stay.
   - Storage: head image blobs deleted. Voice blobs kept unless opt-out.
6. Email confirmation: "Your account has been deleted."
7. OAuth re-login with same Google account → blocked (`is_deleted = true`); shows "This account was deleted on <date>." Cannot un-delete.

Schema (added to migration 010):
```sql
alter table public.users
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists delete_opted_out_shirt boolean not null default false;

create table public.account_delete_otps (
  user_id     uuid primary key references public.users(id) on delete cascade,
  otp_hash    text not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
```
Auth callback must check `is_deleted` and refuse session.

### 8. Suspension semantics
- `is_suspended = true` immediately blocks all app access (proxy redirects to `/login?reason=suspended`).
- Their existing scribbles **stay visible by default**. Admin reviews each one in moderation queue and decides per-scribble.
- Their existing reactions, requests, relationships **stay** in DB.
- Their own shirt becomes view-only (no new scribbles can be placed on it; existing scribbles remain).
- Unsuspend restores full access; nothing was lost.

### 9. No fixed deadline yet — phased lock + yearbook handoff
- The product runs in **scribble phase** indefinitely until the admin manually sets `scribble_phase_ends_at` via admin settings.
- At T-72h, T-24h, T-1h: in-app banner countdown + (later) email reminder.
- At T-0:
  - All `shirts.is_locked` = true via background job.
  - All scribble write APIs return 410 Gone.
  - Site flips to a **"transition mode"** maintenance page: *"Scribble phase has ended. Yearbook is being prepared."* No user-facing content other than the message + return date.
- Transition mode duration is admin-controlled (could be 1 day, could be 2 weeks — whatever the yearbook needs to be ready).
- When yearbook opens: ceremony animation plays for the user the first time they open their own shirt. Gold border draws around the shirt, scribbles fade in one by one, copy: *"Your shirt is sealed. Forever."*, then routes to yearbook profile.
- See **doc 10** for the full transition + yearbook architecture.

### 10. Onboarding fields & yearbook content asks
Two separate data-collection moments. **Clarified 2026-05-21 afternoon (round 2.1)**.

**Onboarding (mandatory for verified students)**:
- Display name (pre-filled from Google, editable)
- **Program**: hard-coded `B.Tech Computer Science` for v1. No selector. (Other courses — Law, BBA, Media — added when requested; their batches are 60-person flat groups, so the schema is `program enum + batch int` for them too, just without the cascading group concept.)
- **Batch**: integer 1–52. Used as the cohort key.
- **Enrollment number** (validated to be unique within the same `batch`)
- Face image upload (step 2)
- Body template + skin slider (step 3)
- Review (step 4)

**Thank-you message moved OUT of onboarding** — appears as a one-time popup on the dashboard immediately after onboarding completes ("Before friends start signing — write the message they'll see after they sign you."). Skippable; default applies; editable forever in `/settings`.

**Academic-group concept dropped** — original idea was groups like `01-08`, `09-16` inside a B.Tech batch, but other courses don't have batches that big so the abstraction doesn't generalise. Keep it simple: program + batch only.

**Yearbook content (collected late in scribble phase, optional but encouraged)**:
- One-line "what I want to be remembered for" (max 140 chars) → printed on yearbook card
- "Where I'm headed next" (max 80 chars, optional) → printed under name
- Up to 3 favourite scribbles to feature on yearbook card (auto-picks top-reacted if user skips)
- Yearbook visibility toggle: public profile / batch only / hidden (`yearbook_visibility enum`)

Yearbook content prompts appear:
- 7 days before scribble phase ends (banner on dashboard)
- 3 days before (modal on first dashboard open)
- 1 day before (banner with strong CTA)
- After (settings tab only; can still be edited before yearbook is built)

States to design:
- Yearbook prompt never seen
- Skipped (defaults apply)
- Partially filled
- Completed
- Edited after completion

Schema (migration 010):
```sql
alter table public.users
  add column if not exists yearbook_legacy_line text,         -- "what I want to be remembered for"
  add column if not exists yearbook_next_step text,           -- "where I'm headed"
  add column if not exists yearbook_visibility text not null default 'public',  -- 'public' | 'batch' | 'hidden'
  add column if not exists yearbook_featured_scribble_ids uuid[] not null default '{}';
```

### 11. Free-tier capacity + fallback — **see doc 09**
Doc 09 is the master operational doc: live limits, threshold alarms, automatic soft-degrade behaviours, and upgrade path with costs. Summary lock here:
- Hard monitor at 80% of every free-tier limit; admin gets dashboard alarm.
- Pre-built soft-degrade flags in `platform_settings` (`disable_voice_notes`, `disable_realtime_presence`, `disable_email_digest`, `disable_new_signups`).
- Upgrade trigger: any single resource exceeds 90% with two days of growth headroom remaining.

### 12. Performance + indexing for new tables
- `share_link_visits`: indexes on `(share_link_id, first_seen_at desc)`, `(visitor_user_id)`, `(anonymous_visit_id)`. Weekly aggregation job into `share_link_visit_daily` if rows exceed 100k.
- `notifications`: partial index `where is_read = false` for unread counts (already in 001 if present; verify).
- `scribbles`: composite `(shirt_id, created_at desc) where is_hidden = false` (already exists from migration 009).
- `admin_audit_logs`: index on `(admin_id, created_at desc)` and `(target_type, target_id)`.
- `email_digest_runs`: index on `(digest_date, status)`.
- Run `EXPLAIN` on the dashboard's `Promise.all` once weekly during the live window; flag any seq scans above 10ms.

### 13. Role derivation — single source of truth
Computed at the API boundary, not stored:
```ts
type Role = 'suspended' | 'admin' | 'verified' | 'guest';

function getRole(user: Pick<User, 'is_suspended' | 'is_admin' | 'is_university_verified' | 'is_guest' | 'is_deleted'>): Role | null {
  if (user.is_deleted) return null;       // session refused
  if (user.is_suspended) return 'suspended';
  if (user.is_admin) return 'admin';      // implies verified
  if (user.is_university_verified) return 'verified';
  if (user.is_guest) return 'guest';
  return null;
}
```
Constraints in migration 010:
- `is_admin = true` → `is_university_verified = true AND is_guest = false`
- `is_university_verified` and `is_guest` are mutually exclusive
- `is_deleted = true` → `is_suspended = false` (deleted accounts aren't "suspended"; they're gone)

### 14. Admin provisioning
Admins are seeded directly by the operator running SQL on the production DB. There is **no in-app admin promotion UI** for v1. Admin demotion is also SQL-only. This eliminates a whole class of UI/permission attack surface.

Audit logs still get written for admin actions inside the app.

---

## Cross-doc reconciliation — what was superseded today

| Doc | Superseded passage | Replacement |
|---|---|---|
| `03-product-flows.md` line 10 ("Guest" row) | Guest restricted to invite links only | This doc — Guest gets home + limited explore + activity |
| `03-product-flows.md` line 17 ("Three steps. No more.") | 3-step onboarding | This doc — 4 steps: basics → face → template+skin → review |
| `03-product-flows.md` line 87 ("Sign anonymously toggle") | Anonymous scribbles UI | Cut entirely (decision 2 above) |
| `03-product-flows.md` line 143 (`is_group = true`) | Property name | Use `group_id` + null `owner_id` (matches migration 009) |
| `04-architecture.md` line 75 ("guest redirected to landing") | Guest hard-blocked outside `/shirts/*` | Guest allowed list expanded (decision 1) |
| `04-architecture.md` line 123 (`is_anonymous` column) | Active feature | Column kept for history, **not used** |
| `04-architecture.md` line 199 (`daily-digest` cron) | Daily digest | Weekly digest, staggered (matches doc 08 original) |
| `04-architecture.md` line 156 (realtime channels) | All authenticated users get all events | Role-based subscription (decision 1) |
| `06-revisit-later.md` "Anonymous voice notes" entry | Voice notes deferred or anonymous-contradictory | Voice is in; "anonymous + voice" never existed; doc 06 still accurate |
| `02-design-system.md` (skin tone section, implicit) | 5 hard swatches | Curated slider with 6 anchors |

## Goal

Build Scribbl as a connected role-based social product, not a set of isolated pages.

The core system must answer:

- Who is the user?
- What role do they have?
- How did they arrive?
- Which shirt/profile are they allowed to see?
- Which shirt/profile are they allowed to scribble on?
- What relationship should be remembered after login?
- What reminders should be sent later?
- What can admin control without breaking trust or leaking data?

## Product Roles

Scribbl has three active roles and one blocked state.

| Role | Identity | Core access |
|---|---|---|
| Admin | Verified student with `is_admin = true` | Full regular-user access plus audited control panel for moderation, users, groups, settings, exports, errors, and support actions. |
| Verified student | Google account from allowed university domain | Owns shirt/profile, dashboard, explore, groups, yearbook data, signing, requests, notifications, settings. |
| Guest | Google account outside allowed domain | Cannot own a shirt or yearbook profile. Can access a guest home, profile pages they are allowed to see, limited explore, and signing flows. |
| Suspended | Any user with `is_suspended = true` | Block active use. Existing content hidden or marked according to admin action. |

Important: admin is not a fourth product experience. Admin is a verified student with extra powers. Admin can still scribble, own a shirt, join groups, and use dashboard like everyone else.

## Current Corrections Needed

The current code moved in the right direction, but these product corrections are required:

1. Guest access is currently too restrictive. Guests need a home/resting page and limited explore, not only a dead-end guest landing.
2. Onboarding order is wrong for the intended avatar experience. The avatar portion should upload/place face first, then choose body/template, then adjust skin tone.
3. Basic student details must not disappear. Verified student onboarding still needs name, enrollment, academic group, program, batch, and thank-you message.
4. Skin tone should be CSS-variable driven from a slider or controlled tone selector, not hard-coded as only a hidden data preset experience.
5. Share links should not expose long UUID URLs as the primary public link.
6. Link attribution must survive OAuth login, so a guest who opens a shared profile is still connected to the inviting profile after signing in.
7. IP address must not be the source of identity. Use it only as a hashed anti-abuse signal.

## Decisions Locked On 2026-05-21

These decisions override the earlier open questions in this document.

1. Guest explore can show all verified students, but only limited public fields. Guests need permission to scribble, same as any other out-of-batch user.
2. Invite links open the profile/signing context and preserve attribution. They do not grant direct scribbling by themselves. Guests must still request permission or already have approval.
3. Public profile URLs should use human-readable slugs, but slugs are identity/navigation only. They never grant special access.
4. Invite URLs should use opaque unguessable codes. The code is the authority; any human-readable name segment is cosmetic and must be ignored or canonicalized.
5. Skin tone should use a continuous slider across a realistic curated human range from light warm tones to deep brown. It should not allow pure black, pure white, saturated fantasy colors, or arbitrary HSV output.
6. Avatar lock means the user's shirt/signing state can be locked, but the avatar/profile remains editable through settings until deadline unless admin freezes it for safety. Users need fallback paths for harassment, batch mistakes, or unsafe class assignment.
7. Email digest starts with verified students only. Guest digest can be added later after guest home and attribution are stable.

## Route Information Architecture

### Public / Unauthenticated

| Route | Purpose | Access |
|---|---|---|
| `/` | Redirect based on auth state | Public |
| `/login` | Google OAuth entry | Public |
| `/auth/callback` | OAuth callback and role/link attribution | Public callback |
| `/i/[code]` | Short invite/share link resolver | Public, stores attribution then redirects |
| `/u/[slug]` | Canonical public profile URL | Public shell, content depends on auth/link permissions |
| `/groups/join/[token]` | Group invite resolver | Public shell, requires login to complete |

### Verified Student

| Route | Purpose |
|---|---|
| `/onboarding` | Student basics + face-generation tutorial + upload/place face + template/skin + review |
| `/dashboard` | Avatar-first home, shirt status, requests, activity, groups, share tools |
| `/profile/[userId]` | Legacy internal profile route; should redirect or resolve to `/u/[slug]` later |
| `/shirts/[shirtId]/scribble` | Signing Studio |
| `/explore` | Find verified students and sign/request |
| `/groups` | Group list, create, join |
| `/groups/[groupId]` | Group members, invite, group canvas |
| `/activity` | Notifications and recent activity |
| `/settings` | Profile, avatar, privacy, thank-you message, shirt lock, account |
| `/yearbook` | Yearbook mode after deadline |

### Guest

| Route | Purpose |
|---|---|
| `/guest` or `/onboarding/guest` | Guest home/resting page |
| `/u/[slug]` | View allowed public/linked profiles |
| `/shirts/[shirtId]/scribble` | Sign shirts only after permission is approved |
| `/explore` | Limited guest explore |
| `/activity` | Guest activity: scribbles they made, requests they sent, profiles they were linked from |
| `/settings` | Minimal account settings: name, logout, email state |

Guest must not access:

- `/dashboard`
- `/yearbook`
- `/admin`
- full private student details
- private group management
- owner-only shirt controls

### Admin

| Route | Purpose |
|---|---|
| `/admin` | Admin overview |
| `/admin/users` | Search users, suspend, verify, promote/demote admin |
| `/admin/moderation` | Scribble reports, user reports, hide/remove/restore |
| `/admin/groups` | Group oversight, abusive group cleanup |
| `/admin/yearbook` | Export and deadline controls |
| `/admin/errors` | Error logs |
| `/admin/audit` | Required new route for admin action history |
| regular user routes | Admin still uses the product as self |

Admin actions must be audited. Admin should not silently impersonate users in production. Dev impersonation stays dev-only.

## Onboarding Architecture

### Verified Student Onboarding

The verified onboarding flow should be one coherent flow, not two unrelated onboarding routes.

Recommended route:

`/onboarding`

Recommended steps:

### Step 1 — Student Basics

Required fields:

- display name
- enrollment number
- academic group
- program
- batch
- thank-you message shown after someone signs

States:

- empty
- prefilled from Google
- invalid enrollment number
- duplicate enrollment number
- no academic groups loaded
- no programs for selected group
- no batches for selected program
- save failed
- user is already onboarded

### Step 2 — Create / Upload Face

This is the first avatar step.

Primary actions:

- "Generate my Scribbl face"
- "I already have a cutout"

The page should explain:

- Use a clear front-facing photo.
- Generate a stylized but recognizable head.
- Keep hair included in the face/head image.
- Use a transparent or clean background.
- Upload PNG/WebP.
- The head should be intentionally slightly oversized.

Include a copyable AI prompt:

```text
Create a stylized 2D cutout portrait head for a warm handmade farewell-shirt app called Scribbl. Use the uploaded face as reference. Keep the person recognizable, friendly, and expressive. Slightly oversized head proportions, clean front-facing angle, soft pencil/illustration texture, transparent background, no body, no text, no frame, no accessories unless visible in the original photo.
```

For back view:

- Do not require a back-hair upload during onboarding.
- If the product needs back view later, use a generated/simplified rear hair layer from the same head or a future optional settings tool.

Face placement controls:

- drag x/y in SVG coordinate space
- scale
- rotation
- reset to template default
- preview on neutral sample template

Failure states:

- wrong file type
- file too large
- upload failed
- non-transparent background warning
- face not loaded
- image transform out of bounds

### Step 3 — Choose Template and Skin

After the face is placed, user chooses the body/shirt template.

Why after face:

- The user evaluates whether the body template matches their face.
- The face is emotionally primary.
- Template changes can reuse the same face transform with adjusted defaults.

Controls:

- masculine/feminine/neutral style categories, if kept
- preset card grid
- live preview with face
- skin tone slider or controlled slider-like scale

Skin tone implementation:

- Keep CSS variable strategy: `--skin-tone`.
- Store a normalized slider value plus computed hex.
- Use a continuous slider, but map it through a curated gradient of realistic skin tones.
- Do not expose a raw color picker. Users should not be able to choose pure black, pure white, neon, green, blue, or saturated fantasy colors.
- Suggested range anchors:
  - 0: `#F6D7BF` light warm
  - 20: `#E8BD92` fair/wheat
  - 40: `#C98F63` medium tan
  - 60: `#9F6747` medium brown
  - 80: `#72442F` deep brown
  - 100: `#4A2A1F` very deep brown
- Interpolate between these anchors in code and store the final hex for stable rendering.
- Suggested model:

```ts
type SkinToneConfig = {
  mode: 'slider'
  value: number // 0..100
  hex: string
}
```

Use a curated gradient instead of a raw HSV color picker so users cannot create broken/unrealistic skin colors accidentally.

Comparable product pattern:

- Games and avatar apps usually give either fixed swatches or a constrained skin-tone slider. They do not usually give an unrestricted RGB picker for skin because it causes broken identity output, accessibility issues, and moderation problems.
- Scribbl should feel flexible, but not like a fantasy avatar creator. The slider should represent human skin tone range only.

### Step 4 — Review and Lock

Review:

- front avatar
- shirt preview
- display name and batch
- thank-you message
- share CTA disabled until complete

Actions:

- lock avatar and enter dashboard
- go back to edit face
- go back to edit template

Implementation note:

- A strict "lock forever" is risky before launch. Avatar/profile remains editable until deadline unless admin freezes it for safety.
- Shirt lock means "stop new scribbles" or "require requests", not "delete the user from the social system".

### Onboarding Fallback and Safety Cases

Users may need escape routes because this is a real social product.

| Scenario | Product fallback | Admin requirement |
|---|---|---|
| User picked wrong batch | Let user submit "change batch" request | Admin approves and logs change |
| User is being harassed by batchmates | User can lock shirt, switch to request-only, block/report users | Admin can hide content, suspend users, move user to safe/manual state |
| User belongs to no clear batch | Allow profile with `batch_id = null` but limited explore until admin resolves | Admin assigns batch or marks as verified exception |
| User changes program/batch after onboarding | User requests change from settings | Admin audit log required |
| User uploaded bad face image | User can replace face from settings | Admin can reset avatar if abusive |
| User wants to pause signing | Lock shirt from settings | No admin needed |
| Admin freezes profile for safety | Profile remains visible but avatar/settings locked | Admin audit reason required |
| Suspended user had existing scribbles | Hide or mark scribbles depending on severity | Admin audit required |

## Role-Based Access Matrix

| Capability | Admin | Verified student | Guest | Suspended |
|---|---:|---:|---:|---:|
| Own shirt | Yes | Yes | No | No active use |
| Dashboard | Yes | Yes | No | No |
| Guest home | Optional | No | Yes | No |
| Explore | Full | Full | Broad but limited public fields | No |
| View linked profile | Yes | Yes | Yes | No |
| View arbitrary profile | Yes | Yes | Limited public fields | No |
| Scribble on own shirt | No, same as users | No | No | No |
| Scribble on open shirt | Yes as self | Yes | No, request first unless approved | No |
| Open invite/profile context | Yes | Yes | Yes | No |
| Scribble after approved permission | Yes as self | Yes | Yes | No |
| Request scribble permission | Yes | Yes | Yes | No |
| Create group | Yes | Yes | No | No |
| Join group | Yes | Yes | Limited only if explicitly invited and allowed | No |
| Group canvas | Yes | Yes if member | No by default | No |
| Yearbook | Yes | Yes | No | No |
| Admin panel | Yes | No | No | No |
| Moderate content | Yes, audited | No | No | No |
| Export all data | Yes, audited | Own/batch/group request only | No | No |

## Guest Product Model

Guest users are real authenticated users, but they are not members of the university cohort.

They need a resting page because after login they need somewhere to land.

### Guest Home

Route:

`/guest` or keep `/onboarding/guest` and rename UI language to "Guest home".

Content:

- "You are signed in as a guest."
- Profiles you were invited to.
- Shirts you have signed.
- Pending permission requests.
- Recently viewed linked profiles.
- CTA: paste/open another invite link.
- CTA: use university email for full access.

Guest home data:

- linked profiles from `user_relationships`
- scribbles made by guest from `scribbles.scribbler_id`
- pending requests from `scribble_requests.requester_id`

### Guest Explore

Guest explore should exist and can show all verified students, but it must be privacy-limited.

Allowed:

- search verified students by display name
- show public card: display name, avatar thumbnail, broad program/batch label if public-safe
- request-to-scribble CTA
- show "permission required" state clearly
- link to profile preview

Not allowed:

- enrollment number
- email
- online presence
- private group membership
- yearbook export
- admin or moderation info

Product rule:

Guests can browse verified profiles in a limited way, but they cannot directly scribble just because they found someone. The default action is request permission. If approved, they can sign.

Invite links do not bypass permission. They preserve context and attribution: "this guest came through Ananya's link", "this guest requested to sign Ananya", and "this guest later signed Ananya after approval."

## Sharing and Link Attribution

The current `/profile/[userId]` UUID link is not the final sharing model.

### Slug and Invite Link Decision

Using a slug is a good idea for public profile identity, but a slug should not be used as the security mechanism.

Common large-product pattern:

- Human profiles use readable handles/slugs: `/username`, `/in/name`, `/@handle`.
- Invitations, password resets, magic links, and shared access grants use opaque random tokens.
- The readable part helps humans recognize the destination; the opaque token is what grants or tracks special context.

For Scribbl:

- `/u/[slug]` is the canonical public profile URL.
- `/i/[code]` is the canonical invite/attribution URL.
- `/profile/[userId]` remains internal/backward-compatible.
- Do not make `/i/[name]-[code]` the core parser. If we ever add friendly invite URLs, parse the code only and treat the name as cosmetic.

### Recommended Link Types

| Link type | Example | Purpose |
|---|---|---|
| Public profile slug | `/u/ananya-25` | Human-friendly canonical profile |
| Invite/attribution link | `/i/k7P4Qx` | Tracks source, opens profile/request context, survives login |
| Group invite | `/g/hostel-wing-a8f2` or existing `/groups/join/[token]` | Join group |
| Internal profile route | `/profile/[userId]` | Keep for compatibility, not primary sharing |

Do not use a third-party link shortener for core product logic.

Use first-party short routes on the Scribbl domain. This keeps attribution, QR, OAuth return, abuse control, and analytics under our control.

### Share Link Flow

1. Verified user taps share.
2. App creates or reuses a `share_links` row.
3. User copies `/i/[code]`.
4. Visitor opens link.
5. Server records a `share_link_visits` row with:
   - share link id
   - anonymous visit id from signed cookie
   - hashed IP
   - hashed user agent
   - referrer/channel if available
6. If visitor is not signed in:
   - store `pending_invite_code` in an HTTP-only cookie
   - redirect to login or show profile shell with login CTA
7. After OAuth callback:
   - read `pending_invite_code`
   - attach visitor user id to the visit
   - create/update `user_relationships`
   - redirect back to the invited profile with request/sign CTA based on permission

### Link Tampering and Edge Cases

The system must be designed so changing a readable name in a URL never grants access to another profile.

Rules:

1. Profile slug route `/u/[slug]`
   - Resolves by exact slug.
   - Shows only public/profile-safe content based on viewer role.
   - Does not create invite attribution.
   - Does not grant signing rights.
   - If slug changed, old slug should redirect through `profile_slug_history`.

2. Invite route `/i/[code]`
   - Resolves by opaque random `code`.
   - Code points to exactly one `share_links` row.
   - If code is invalid, revoked, expired, or over abuse limits, show safe error.
   - Code opens the intended owner/profile context but does not grant direct signing.
   - Guest still sees "Request to scribble" unless already approved.

3. Friendly invite route, if ever added
   - Example: `/i/ananya-25/k7P4Qx` or `/i/ananya-25-k7P4Qx`.
   - Server must resolve only by code.
   - If name segment mismatches the owner, redirect to canonical `/i/[code]` or canonical friendly URL.
   - Never resolve owner from the editable name segment.

4. Changing `/u/ananya-25` to `/u/rahul-25`
   - This simply attempts to view Rahul's public profile under normal access rules.
   - It does not carry Ananya's invite attribution.
   - It does not grant scribble permission.

5. Changing `/i/k7P4Qx`
   - Random guessing should be infeasible.
   - Codes should be generated with at least 96 bits of entropy or a sufficiently long `nanoid`.
   - Rate limit invalid code attempts by hashed IP + anonymous visit id.

6. Logged-out visitor opens invite, then logs in
   - Store invite code in signed HTTP-only cookie.
   - OAuth callback consumes the cookie exactly once.
   - If login fails or user returns later, keep cookie short-lived, for example 24 hours.

7. Existing logged-in visitor opens invite
   - Attach immediately to `share_link_visits`.
   - Create/update `user_relationships`.
   - Redirect to profile/request CTA.

8. Same guest opens many links
   - Keep all relationships.
   - Guest home lists invited profiles and requests.

9. Owner revokes share link
   - Existing relationships stay as history.
   - New visits through revoked link are blocked.
   - Existing approved scribble requests are not automatically revoked unless owner/admin explicitly revokes them.

### Why IP Is Not Enough

IP address cannot be the identity source because:

- mobile networks rotate IPs
- multiple students share Wi-Fi/NAT
- VPNs distort identity
- privacy laws make raw IP storage sensitive

Use IP only as:

- hashed abuse signal
- rate-limit input
- suspicious fake-account heuristic

Identity source should be:

1. OAuth user id after login
2. pending invite cookie before login
3. share link code
4. optional hashed IP/user-agent for abuse detection only

### Proposed Tables

Create migration `010_role_access_links_and_digest.sql`.

```sql
create table public.profile_slugs (
  user_id uuid primary key references public.users(id) on delete cascade,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_slug_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  old_slug text not null unique,
  replaced_by_slug text not null,
  created_at timestamptz not null default now()
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  shirt_id uuid references public.shirts(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  link_type text not null default 'profile',
  access_scope text not null default 'profile_request_context',
  channel text,
  is_revoked boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.share_link_visits (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  visitor_user_id uuid references public.users(id) on delete set null,
  anonymous_visit_id text,
  hashed_ip text,
  hashed_user_agent text,
  referrer text,
  intended_path text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.user_relationships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  related_user_id uuid not null references public.users(id) on delete cascade,
  source_share_link_id uuid references public.share_links(id) on delete set null,
  relationship_type text not null default 'share_link_guest',
  first_seen_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  unique(owner_id, related_user_id, relationship_type)
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.email_digest_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  digest_date date not null,
  status text not null,
  sent_to text not null,
  event_counts jsonb not null default '{}',
  error_message text,
  created_at timestamptz not null default now(),
  unique(user_id, digest_date)
);
```

Security notes:

- Enable RLS on all tables.
- Guests can read only their own visit/relationship rows through server routes, not directly.
- Share link resolution should happen through server route using service role plus explicit checks.
- Admin audit logs are admin-readable only.

## Scribble Permission Model

Inputs:

- viewer role
- owner role
- shirt lock state
- owner `shirt_permission`
- same batch
- approved request
- invite/link context
- guest status
- suspension status
- deadline/yearbook mode

Decision order:

1. Suspended user: deny.
2. Suspended owner: profile hidden or restricted.
3. Shirt locked: deny unless in-flight grace applies.
4. Deadline passed: deny all new scribbles.
5. Owner signing own shirt: deny.
6. Admin signing: allowed as regular self, not as admin override.
7. Invite link context: create relationship and show profile/request CTA. Do not allow scribble by invite alone.
8. Owner permission `open`: allow verified users. Guests still request permission unless a future explicit guest-open setting is added and approved.
9. Owner permission `batch_only`: allow same batch verified users.
10. Owner permission `request_only`: allow approved requests.
11. Guest or out-of-batch user with approved request: allow.
12. Otherwise show request CTA.

Failure states:

- login required
- guest needs link or permission
- request pending
- request rejected
- shirt locked
- deadline passed
- owner suspended
- scribbler suspended
- user trying to sign own shirt
- invalid invite
- revoked invite
- expired invite
- invite opened but permission not yet requested
- invite relationship exists but request still pending
- slug changed or no longer exists
- profile exists but viewer only has limited public access

## Email Reminder Architecture

Email should summarize activity without spamming.

### Email Types

| Email | Recipient | Timing |
|---|---|---|
| Weekly digest | Verified students | Weekly or staggered daily batches |
| Guest digest | Guests | Not v1 launch; revisit after guest home is stable |
| Request received | Shirt owner | Optional immediate or digest-only |
| Request approved/rejected | Requester | Optional immediate |
| Deadline reminder | Verified students | 7 days, 3 days, 1 day before lock |
| Yearbook ready | Verified students | After export mode is ready |

### Weekly Digest Content

For verified students:

- new scribbles on your shirt
- new outside notes/reactions
- pending requests count
- approved/rejected requests
- new friends/guests who joined from your links
- group joins
- group canvas activity
- shirt level progress
- countdown to farewell deadline
- CTA: open dashboard

For guests later:

- shirts you signed
- requests pending/approved
- profiles you were invited to
- CTA: continue signing

Do not ship guest digest first. Guest email requires more careful consent and content rules because they are outside the university cohort.

### Email Template / Mail System Design

Email should have its own small design system, not raw text pasted into route handlers.

Create:

- `src/features/email/templates/BaseEmail.ts`
- `src/features/email/templates/WeeklyDigestEmail.ts`
- `src/features/email/templates/RequestReceivedEmail.ts`
- `src/features/email/templates/DeadlineReminderEmail.ts`
- `src/features/email/templates/YearbookReadyEmail.ts`

Email visual style:

- clean cream background
- Scribbl handwritten wordmark as text or hosted image
- compact stat cards
- shirt/activity summary
- one primary CTA
- no heavy images by default
- no private student details beyond what recipient can already see

Weekly digest sections:

1. Header: "Your Scribbl week"
2. Shirt stats:
   - new scribbles
   - new outside notes/reactions
   - unique people who signed
   - shirt level progress
3. Requests:
   - pending requests
   - approved/rejected requests
4. Social growth:
   - friends/guests who joined from your links
   - new group members
5. Countdown:
   - days left before farewell lock
6. CTA:
   - open dashboard

Email edge cases:

- No activity: skip email or send a very lightweight reminder only near deadline.
- ~~Anonymous scribbles: show "Someone signed your shirt", never reveal name early.~~ (anonymous scribbles cut — decision 2)
- Suspended scribbler: exclude or show "A removed scribble was hidden".
- Hidden/reported content: do not include body preview.
- Guest-created scribble: show guest display name and "Guest" badge if still visible.
- User locked shirt: digest should say shirt is locked and show pending requests if any.
- User has no shirt due to onboarding failure: do not send digest; send onboarding reminder only if explicitly added later.
- Resend failure: log to `email_digest_runs`, do not retry infinitely.
- Rate limit: batch sends by user hash/day, never all users at once on free tier.

### Digest Data Source

Use existing event tables first:

- `notifications`
- `scribbles`
- `shirt_social_notes`
- `scribble_requests`
- `friend_group_members`
- `user_relationships`
- `share_link_visits`

Do not create a second generic event stream unless queries become too expensive.

### Sending Rules

- Respect `last_digest_sent_on` for existing users.
- Add user-level email preferences later if needed.
- Use `EMAIL_DIGEST_SECRET` for cron route authorization.
- Batch by deterministic user hash so free tier does not send all users in one day.
- Never include private content from other users beyond what the recipient is allowed to see.
- ~~For anonymous scribbles, digest should say "Someone signed your shirt" until reveal.~~ (anonymous scribbles cut — decision 2)

### Free Tier Reality

Resend free tier is tight for 1,000–2,000 users.

Recommended launch mode:

- In-app notifications are primary.
- Email digest is weekly and staggered.
- Critical transactional emails are optional and rate-limited.
- If the cohort grows, move to paid Resend or use Brevo fallback.

## Implementation Plan

### Phase 1 — Lock Role and Access Rules

Files:

- Modify `lib/utils/safetyAccess.ts`
- Modify `proxy.ts`
- Modify `app/auth/callback/route.ts`
- Modify `app/api/auth/sync-user/route.ts`
- Add tests in `tests/safety-access.test.ts`

Tasks:

- [ ] Define `UserRole = 'admin' | 'verified' | 'guest' | 'suspended'`.
- [ ] Add a pure `getRouteAccess(role, pathname)` helper.
- [ ] Add a pure `canViewProfile(viewer, target, context)` helper.
- [ ] Add a pure `canScribbleOnShirt(input)` helper with invite-context support, where invites create attribution/request context but do not bypass approval.
- [ ] Update proxy to allow guest home, limited explore, activity, linked profile, and signing routes.
- [ ] Keep admin access as verified-user access plus `/admin`.
- [ ] Add tests for every row in the role matrix.

Verification:

- `npm run type-check`
- `npm test`
- Manual route checks with admin, verified, guest, suspended dev users.

### Phase 2 — Add Share Links and Attribution

Files:

- Create `supabase/migrations/010_role_access_links_and_digest.sql`
- Update `lib/supabase/types.ts`
- Create `lib/utils/shareLinks.ts`
- Create `app/i/[code]/route.ts`
- Create `app/u/[slug]/page.tsx`
- Modify `app/auth/callback/route.ts`
- Modify dashboard/profile share components
- Add tests in `tests/share-links.test.ts`

Tasks:

- [ ] Add `profile_slugs`, `share_links`, `share_link_visits`, `user_relationships`, `admin_audit_logs`, `email_digest_runs`.
- [ ] Generate stable slugs for existing users.
- [ ] Generate short invite codes with `crypto.randomUUID()` or `nanoid`.
- [ ] Store pending invite in secure HTTP-only cookie before OAuth.
- [ ] Attach pending invite to user after OAuth callback.
- [ ] Create relationship row after login/signing.
- [ ] Make primary share link `/i/[code]`, not `/profile/[uuid]`.
- [ ] Keep `/profile/[userId]` as internal compatibility.
- [ ] Add slug mismatch handling: profile slug history redirects, invite friendly-name mismatch resolves by code only.
- [ ] Rate-limit invalid invite code attempts by hashed IP + anonymous visit id.

Verification:

- Open invite while logged out → login → return to invited profile.
- Open invite while logged in as guest → relationship row persists.
- Revoked/expired invite shows safe error.
- Guest home lists invited profiles.

### Phase 3 — Rebuild Onboarding in Correct Order

Files:

- Modify `app/onboarding/page.tsx`
- Modify `src/features/avatar/components/AvatarOnboardingFlow.tsx`
- Modify `src/features/avatar/components/FacePlacementEditor.tsx`
- Modify `src/features/avatar/components/SkinTonePicker.tsx`
- Modify `src/features/avatar/data/skinTones.ts`
- Modify `app/api/avatar/config/route.ts`
- Add tests in `tests/avatar-onboarding.test.ts`

Tasks:

- [ ] Keep student basics as the first required step.
- [ ] Add face-generation tutorial and copyable prompt.
- [ ] Move face upload/placement before template selection.
- [ ] Add live preview with face on neutral template.
- [ ] Move template selection after face placement.
- [ ] Replace 5-only hidden skin tone behavior with CSS-variable slider config.
- [ ] Store `skinTone: { mode, value, hex }` in `avatar_config`.
- [ ] Keep backward compatibility for old `skinToneId`.
- [ ] Review/lock sends user to dashboard.

Verification:

- New verified user cannot reach dashboard before completing basics/avatar.
- Upload face → change template → face remains visible and adjustable.
- Skin slider updates SVG `--skin-tone`.
- Old avatar configs still render.

### Phase 4 — Guest Home and Limited Explore

Files:

- Create or modify `app/guest/page.tsx`
- Modify `app/onboarding/guest/page.tsx` to redirect or become guest home
- Modify `app/explore/page.tsx`
- Modify `app/activity/page.tsx`
- Add guest-specific components under `src/features/guest/`

Tasks:

- [ ] Guest home shows invited profiles.
- [ ] Guest home shows shirts signed by guest.
- [ ] Guest home shows pending requests.
- [ ] Guest explore shows all verified students as limited public cards.
- [ ] Guest cannot see enrollment, email, full batch directory, private group data, or online presence.
- [ ] Guest can request permission from profiles found through explore.
- [ ] Guest cannot directly sign from invite alone; invite opens profile/request context.

Verification:

- Guest direct route checks.
- Guest limited explore checks.
- No private fields in guest query select lists.

### Phase 5 — Admin God Mode With Audit

Files:

- Modify `app/admin/users/page.tsx`
- Modify `app/admin/moderation/page.tsx`
- Modify admin API routes
- Create `app/admin/audit/page.tsx`
- Create `lib/utils/adminAudit.ts`

Tasks:

- [ ] Add admin audit logging to suspend/unsuspend, promote/demote, hide/remove scribble, resolve report, update level, export.
- [ ] Add admin profile support action: view user status, repair onboarding, resend invite, reset avatar config, lock/unlock shirt.
- [ ] Add admin safety actions: approve batch change, detach user from unsafe batch, freeze profile editing, reset abusive avatar, and document reason.
- [ ] Do not allow silent production impersonation.
- [ ] Keep dev-only user switching under `/dev`.

Verification:

- Every admin mutation creates an audit row.
- Non-admin cannot call admin APIs.
- Admin can still use normal dashboard/signing as self.

### Phase 6 — Email Digest Completion

Files:

- Modify `app/api/email/digest/route.ts`
- Create `lib/utils/emailDigest.ts`
- Create email template helpers under `src/features/email/`
- Add tests in `tests/email-digest.test.ts`

Tasks:

- [ ] Aggregate weekly counts from notifications, scribbles, social notes, requests, group joins, relationships.
- ~~[ ] Respect anonymous scribble visibility.~~ (anonymous scribbles cut — decision 2)
- [ ] Keep guest digest disabled for first implementation.
- [ ] Add verified-student email templates first; guest digest remains a documented future extension.
- [ ] Add deterministic batching.
- [ ] Add `email_digest_runs` logging.
- [ ] Make route callable only by admin or `EMAIL_DIGEST_SECRET`.
- [ ] Add dry-run mode for testing.

Verification:

- Dry run returns counts without sending.
- Users with no activity are skipped or get no email.
- Digest logs are written.
- Failed Resend calls are captured without retry loops.

### Phase 7 — Full Security Review

Files:

- Review all API routes under `app/api/`
- Review all Supabase migrations
- Update `docs/05-ship-checklist.md`

Tasks:

- [ ] Verify no service role code runs in client components.
- [ ] Verify route-level role checks match this document.
- [ ] Verify RLS exists on all exposed public tables.
- [ ] Verify guest queries do not expose private directory data.
- [ ] Verify admin mutation APIs require admin.
- [ ] Verify share link route does not leak owner email/enrollment.
- [ ] Verify storage uploads validate type and size.
- [ ] Verify report/error logs sanitize metadata.

Verification:

- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run build`
- Supabase RLS manual review before production.

## Decisions Resolved

These choices are now locked for the next implementation pass:

1. Guest explore shows all verified students, but only limited public fields.
2. Guests need permission to scribble, including when they arrived by invite link.
3. Canonical public profile URL is `/u/[slug]`.
4. Canonical invite/attribution URL is `/i/[code]`.
5. Invite codes are opaque random tokens; readable names are cosmetic only.
6. Skin tone is a continuous curated slider from light warm to very deep brown.
7. Avatar/profile remains editable until deadline; shirt lock controls signing, not identity existence.
8. Harassment, unsafe batch membership, or wrong batch assignment require admin-supported fallback states.
9. Email digest starts with verified students only.
