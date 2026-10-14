# 00 — From v1: what we keep, cut, reverse

> Compared against `docs/01`–`23` and the live `supabase/migrations` tree (001–013).
> Written 2026-08-14 at the start of the rebuild.

v1 was a **one-month in-college farewell** on **Supabase-only storage (1 GB)**. The schema grew faster than the app: share links, delete OTPs, group canvases, voice, yearbook render jobs, and three academic seeds exist in SQL but are half-wired or unused. v2 does not patch that tree. It starts a clean project and only rebuilds what the new story needs.

## Story change (doc 01, 10, 21)

| v1 | v2 |
|---|---|
| Last month of college, scribble day online | Already graduated (May 2026). Ritual is **post-grad signing** into **convocation (Nov 2026)** |
| Yearbook = sealed shirts + illustrated avatars | Yearbook = public archive. Card can be **graduation photo or scribble avatar**. Shirt stays the hero of the opened profile |
| Phase flip is read-only (doc 10, 21: “nothing new in the DB”) | After shirts seal, a **short convocation photo window** still writes media, then archive |
| Target 1,000–2,000 at one university | **CSE 2026 only** first (~1,400). Success is 500–1,000. Other schools later |
| “There is no v2” (doc 01) | This folder *is* v2 — same product noun (the shirt), different calendar and storage |

## Storage change (doc 04, 09, 06)

| v1 | v2 |
|---|---|
| Supabase Storage: `avatar-heads`, `shirt-textures` | **Cloudinary** holds every binary |
| 1 GB budget; polaroids **cut** (doc 06) because of that | Polaroid-on-shirt still **out**. Profile + group **photos are in**, with hard caps |
| Voice in `shirt-textures` (doc 08 §3) | **Voice dropped** for this ship |
| Email digest on Resend (already 503 in code) | Still out until a provider is chosen |
| Soft-degrade flags for storage/voice/share links | Keep the **flag pattern** (`platform_settings`). Drop flags for features we are not shipping |

## Product surfaces (doc 03, 08)

**Keep**

- Google Auth, campus domain → verified, off-domain → guest (no shirt, no yearbook page)
- Shirt as the ritual (draw / text / stickers). Up to **3 shirts**, user picks **primary**
- Thank-you toast when someone signs you
- Explore to find batchmates
- Notifications that someone signed you
- Admin: hide scribble, hide photo, suspend
- Sunlit Lawn visual language (doc 18)
- Next.js API as the write path; service role; RLS for reads
- Phase idea: scribble → countdown → yearbook

**Cut / do not rebuild**

| v1 thing | Why |
|---|---|
| Voice notes | Product + moderation, not storage. Boys-abuse / empty-mic problem |
| Anonymous scribbles | Already cut in doc 08; drop the column this time |
| Group **shirt canvas** (`shirts.group_id`) | Replaced by group **album + one-mark wall** |
| `/i/<code>` share-link graph + visit attribution | Growth is **shirt URL + WhatsApp**, not an attribution product |
| Account-delete OTP table | Soft-delete can return later; not a launch table |
| System health runs, export-request queue, email digest | Ops theater. One PNG download of my shirt is enough |
| `box_claims` table | Presence is enough for live signing |
| Quests, digest dates, level-override admin UX | Not the story |
| Cascading school picker for all Bennett schools | **Hardcode B.Tech CSE 2026**. `program_requests` stays as a mailbox |
| `/u/[slug]` unimplemented while slugs insert | Ship slugs **with** the public profile, or don’t insert them |

**Reverse (doc 06 said later / never)**

| Item | v1 | v2 |
|---|---|---|
| Photos / polaroids | Cut (storage) | **In** — profile solos + group albums, **not** composited onto the shirt |
| Public yearbook | Schema-ready, UI deferred | **In** — grid + profile, timed to convocation |
| Friendship / group artifact | Shared shirt canvas | **One memorable mark** per member + photos |

## Schema / repo reality (migrations vs app)

v1 SQL is **ahead of** the app. Do not migrate it forward.

Unused or half-wired in the current repo (do not port):

- `share_links`, `share_link_visits`
- `account_delete_otps`
- `yearbook_renders` (no job)
- `system_health_runs`
- `refresh_yearbook_grid()` never called
- `is_anonymous` ignored on purpose
- `box_claims` never inserted
- `shirts.group_id` never written
- Three seeds: `seed.sql` vs migration 010 (52 CS batches) vs 013 (Bennett schools)

`lib/supabase/types.ts` is hand-typed and already missing `program_requests` and `yearbook_grid_stats`. v2 types are generated from the new schema, once.

## What we still steal from v1 code (as reference)

When a build phase starts, copy patterns — not tables:

- `proxy.ts` role gate (deleted / suspended / guest / admin / onboarding)
- `/api/scribble/place` sanitization + occupancy
- Fabric studio + shirt template
- `writeAdminAuditLog` (wire it this time)
- Avatar preset + Sharp re-encode of heads, then **upload to Cloudinary**
- Thank-you message on place

## Doc 18 / 02 / 17 (design)

Unchanged for now. v2 does not start with a visual rewrite. If the yearbook grid needs a convocation-specific layout, that gets its own UI section later under this folder — not by editing doc 18 in place.
