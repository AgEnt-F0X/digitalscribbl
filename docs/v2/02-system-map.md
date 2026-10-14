# 02 — System map

> Draft 2026-08-14. The pictures we build against. Update when a surface or privacy rule changes.

## Phases

Two clocks. Don’t conflate them.

```text
scribble_open ──► countdown ──► yearbook (shirts frozen)
                                      │
                                      └── convocation_uploads: off → on → off
```

| Clock | Values | Meaning |
|---|---|---|
| `phase` | `scribble_open` \| `countdown` \| `yearbook` | Signing allowed in the first two. Shirts freeze in `yearbook` |
| `convocation_uploads` | `off` \| `on` \| `off` | 4th solo slot + group “convocation” photos. Flag, not a hardcoded month in the client |

`countdown` is still writable for scribbles (same as v1 patch 011). When `phase = yearbook`, scribble/note/mark writes stop. Media writes are allowed **only** while `convocation_uploads = on`, and only for convocation slots / tagged group photos.

After both are sealed: hide profile, delete account, admin moderation.

## End-to-end flow

```text
Google login
    ├─ campus CSE domain → verified
    │     onboarding: name, enrollment, avatar, quote
    │     get shirt #1 (primary)
    │     “Send this link to 5 people tonight”
    │     dashboard
    └─ other Google → guest home (sign if allowed; no yearbook)

Scribble months
    sign shirts · 3 solo photos · join groups · group photos · one-mark wall
    4th slot shown, locked (“opens at convocation”)

November
    shirts already sealed (or seal at countdown T-0)
    convocation slot unlocks
    yearbook public
    pick card style: gown photo | scribble avatar

Archive
    read + hide + delete
```

## Roles

Same as v1, smaller surface.

| Role | Shirt | Yearbook page | Albums / boards | Sign others |
|---|---|---|---|---|
| Verified CSE 2026 | Yes | Yes | Batch albums + own groups | Yes, per shirt permission |
| Guest | No | No | No | If shirt `open` or approved request |
| Suspended | Frozen | Hidden or frozen | No writes | No |
| Deleted | Memorial shirt stays unless opt-out (when we ship delete) | Hidden as person | — | No |
| Admin | As verified + tools | Yes | Yes | Yes |

## Privacy (locked intent)

| Surface | Who |
|---|---|
| Yearbook grid + `/u/[slug]` (name, card visual, quote, **primary shirt**, extra shirts TBD) | **Anyone with the link** |
| Solo album (3 + convocation) | Logged-in **same batch** |
| Group album + one-mark wall | **Group members only** |
| Dashboard, requests, signing studio | Logged-in |

Public archive + private family photos can coexist because they are **different URLs**. A scraper gets shirts and faces people opted to show. They do not get the group dump.

`yearbook_visibility`: `public` (default) | `hidden`. Hidden people vanish from the grid and their slug 404s (or “this page is hidden”).

**Open:** whether shirts 2–3 are on the public profile. See [06](./06-open-decisions.md).

## Multi-group (the “trouble”)

A user has **one batch** and **many groups**.

```text
user
 ├── batch: CSE 2026          → yearbook grid, solo-album audience
 ├── shirt 1 (primary)
 ├── shirt 2 / 3 (optional)
 └── groups[] (max 6)
       ├── members (max ~40)
       ├── photos
       └── marks (one per member)
```

Home feed = my shirt activity **union** activity from groups I belong to.  
Do **not** flatten all group photos into one personal Drive.

Caps (starting):

- Max **6** groups per user
- Max **~40** members per group
- A group is a circle, not a shadow batch. Don’t create “CSE 2026 official” as a friend group.

## Surfaces (routes we intend)

Keep names stable so v1 code can be rewritten in place later.

| Route | Phase | Notes |
|---|---|---|
| `/login` `/auth/callback` | always | Google; CSE domain gate |
| `/onboarding` | scribble | No school picker. Ends on share |
| `/dashboard` | scribble | Shirt, share, recent signers, groups preview, photo slots |
| `/shirts/[id]/scribble` | scribble + countdown | Studio |
| `/explore` | scribble | Batchmates |
| `/groups` `/groups/[id]` | scribble → archive | Album + marks, not a shirt canvas |
| `/groups/join/[token]` | scribble | Invite |
| `/u/[slug]` | especially yearbook; can exist earlier | Public profile |
| `/yearbook` | yearbook | Class grid |
| `/settings` | always | Primary shirt, card style, visibility, quote |
| `/admin/*` | always | Phase flags, hide, suspend |
| `/guest` | always | Guest home |

**Do not build in v2.0:** `/i/[code]`, `/transition` ceremony as a blocker, group canvas studio, voice routes.

## Growth loop

```text
I open your shirt link → I need Google → I get my own shirt → I send mine
```

Onboarding without that send step is a failed launch. QR can wait. WhatsApp copy is enough.

## Notifications (minimum)

If these don’t exist, the app dies after day three:

- Someone signed your shirt
- Sign request in / approved
- (optional) Added to a group

No digest email in v2.0.

## Moderation (minimum)

- Hide scribble
- Hide / remove photo
- Suspend user
- Report scribble / photo / user

Audit log those three. Skip the rest of v1 admin.

## Group board

Not a second Fabric shirt. Not a 1,400-person whiteboard.

**One mark per member:** a short sentence + optional tiny doodle **or** one photo. Editable until yearbook seals. Then frozen.

Batch has **no** board. The yearbook grid is the batch artifact.
