# 03 — Product Flows

> Every user journey, end-to-end. If a screen is missing here, it's not in scope.
>
> **⚠ 2026-05-21 update**: sections of this doc were superseded by [`08-information-architecture-access-and-implementation-plan.md`](./08-information-architecture-access-and-implementation-plan.md). Superseded passages are kept inline with ~~strikethroughs~~ and pointers — they remain as history, not active spec.

## Account types

| Type | What they can do |
|---|---|
| **Verified student** | Full account. Owns a shirt, signs others, joins groups, gets in the yearbook. Restricted to allowed email domains (the user's university). |
| **Guest** | ~~Google login from outside the allowed domain. Cannot create an avatar or own a shirt. Can only sign shirts they were invited to via direct link from a verified student. Gets a basic "guest" badge.~~ **Superseded by doc 08 §"Guest Product Model" + Round 2 decision 1**: guest now gets a guest home + limited explore + activity. Still cannot own a shirt or appear in yearbook. |
| **Admin** | Verified student with `is_admin = true`. Sees admin panel, moderation queue, error logs, yearbook export. |
| **Suspended** | Cannot scribble, cannot sign in to active sessions. Existing scribbles by them are auto-hidden. |

## 1. Onboarding (verified student, first time)

> ~~Three steps. No more.~~ **Superseded by doc 08 §"Verified Student Onboarding"**: now **4 steps** in this order — basics → face → template + skin → review. The order matters because face is the emotional anchor; users evaluate templates against their face, not the other way around.

~~1. **Welcome + basics**~~ *(now step 1, unchanged contents)*
   - ~~"Hi! Let's set up your shirt."~~
   - ~~Name (display name, pre-filled from Google)~~
   - ~~Enrollment number (validated against batch roster if available)~~
   - ~~Academic group → program → batch (cascading dropdowns)~~
   - ~~One-time thank-you message they'll send to anyone who signs them later (textarea, max 200 chars, optional — defaults to "Thanks for signing my shirt ❤️")~~
~~2. **Your head**~~ *(now step 2, expanded — see doc 08)*
   - ~~Two paths:~~
     - ~~"Use my photo" — uploads a selfie, system shows the AI prompt template they need to paste into ChatGPT/Ideogram, returns to upload the stylized output~~
     - ~~"Upload directly" — for users who already have a stylized portrait~~
   - ~~Live preview: head circle on a sample body so they see the result~~
~~3. **Your body**~~ *(now step 3, split from skin in doc 08)*
   - ~~6 illustrated body poses (masculine and feminine variants) shown as a grid~~
   - ~~Tap one → preview updates~~
   - ~~Skin tone picker (5 swatches)~~ → **now a curated 0–100 slider, see doc 08 §"Step 3 — Choose Template and Skin"**
   - ~~"Looks good" button → user is created, dashboard opens with confetti~~ → now a separate **step 4 — Review**

After this: dashboard. Their shirt is empty. The empty state nudges them to share their link.

### What we cut from the previous onboarding
- The 6-step "style → preset → skin → front-face → back-hair → review" flow was too long
- "Back hair" upload is dropped; backs of avatars use the same head with a slight blur or hair-only crop
- The "shirt color" selector is moved to settings (not onboarding) — default white

### What was added in doc 08 round 2 (2026-05-21)
- **Yearbook content prompts** appear during scribble phase (not onboarding), 7/3/1 days before scribble phase ends. See doc 08 §10 and doc 10.

## 2. Owning your shirt (verified student, dashboard)

The dashboard is **the home page**. It shows:

### Mobile layout (top to bottom)
- Header: logo + notification bell (with unread dot) + avatar menu
- Greeting sticky-note: "Good afternoon, [name]"
- Avatar centerpiece: their full body + shirt + scribbles, big and centered
  - Tap → "Customize" / "Front/Back" / "Change face" / "Open canvas (full)" actions
- Progress strip: signatures count / pending requests / classes signed / countdown to farewell
- Quick share row: copy link / QR / WhatsApp / Instagram
- Today's quest: "Sign 3 batchmates today" or "Sign someone from another batch" — refreshes daily
- Activity feed: "On your shirt" — who signed, who reacted, who requested
- Sign next: "Sign 3 of your batchmates" — friction-free quick-sign carousel
- Your groups: 3-card preview + manage
- Bottom nav: Home / Explore / + Sign / Activity / Profile

### Desktop layout (1024px+)
- Three columns: tools/info | shirt | activity
- No bottom nav; top nav has full labels
- Hover affordances enabled

## 3. Signing someone else's shirt

The signing studio is a dedicated route: `/shirts/[shirtId]/scribble`

### Mobile (compose mode default)
- Top bar: back button + owner name ("Aditi's shirt") + permission status ("You can scribble")
- Shirt canvas takes top 55% of screen, front view by default, swipeable to back
- Bottom sheet (slides up) has:
  - Tool selector (pen, marker, pencil, eraser, text note, sticker)
  - Color picker
  - Brush size slider
  - Scratch canvas where you draw your scribble
  - Once you've drawn, tap "Place" → small floating preview appears on the shirt, drag to position → tap to confirm
- The scratch canvas is the default because mobile fingers can't draw at scale
- Direct-on-shirt mode is hidden behind a "switch to direct" toggle (advanced)

### Desktop
- Direct-on-shirt mode is the default — pencil draws straight on the shirt SVG
- Tool panel sits in a left rail, color and inspector in right rail
- The compose mode is still available, accessible via "Note mode" toggle at bottom

### Both
- Voice note is a mic button on the toolbar (10-sec cap, attached to current scribble). **Voice playback rules (doc 08 round 2 decision 3)**: only the shirt owner and the scribbler themselves can play the voice; everyone else sees a mute "🎙" indicator on the scribble. Admins can play in moderation.
- ~~"Sign anonymously" toggle: when on, scribbler name shows as "Someone" until deadline~~ **CUT — doc 08 round 2 decision 2**. Anonymous scribbles removed from v1 entirely. Voice notes cover the same emotional ground without the moderation + identity contradictions.
- "Send scribble" button finalizes
- After send: floating toast appears with the owner's pre-written thank-you message — "Thanks for signing my shirt ❤️ — Ananya"
- Outside-the-shirt area gets reactions and small social notes (separate layer, not part of shirt)

### Collision behavior
- **No collision blocking on placement.** Scribbles can overlap.
- The drawable region (shirt fabric) is the only constraint — you cannot draw outside it.
- A soft purple border appears around the user's *active* scribble while they draw, showing the size box. It disappears after placement.
- Min/max scribble dimensions are enforced server-side.

## 4. Public profile view (visiting someone else)

Route: `/profile/[userId]`

- Top: their avatar + shirt + accumulated scribbles
- Front/back toggle
- "Sign this shirt" CTA (button) → opens signing studio
- If permission is `request_only` → "Ask permission" → sends a request notification, owner approves/rejects
- If permission is `locked` → "This shirt is locked" message, but if the owner unlocks later, the requester gets a notification
- Scrollable scribble list: thumbnails + author + relative time + react button + (if owner) remove/hide
- "Other shirts" tab if they have multiple shirts unlocked

## 5. Activity (notifications)

A slide-out panel from the bell, mobile-friendly bottom-sheet on small screens.

Types:
- `scribble_received` — "Karan signed your shirt"
- `scribble_reaction` — "Mehak reacted ❤️ to your scribble"
- `request_received` — "Aman wants to sign your shirt" + approve/decline inline
- `request_approved` / `request_rejected` — fires to the requester
- `shirt_unlocked` — "Your shirt 1 is full — shirt 2 is ready"
- `admin_broadcast` — admin messages
- `scribble_removed` — "[admin] removed a scribble from your shirt"

Actions:
- Mark all read (tap the "mark all" button — does NOT auto-mark on open)
- Tap a notification → goes to relevant page

## 6. Explore (finding people to sign)

- Default tab: "Your batch" — grid of batchmates
- Search bar (name, enrollment, batch)
- Filters: batch / program / unsigned-by-me
- Each card: avatar circle + name + "Sign" button → goes straight to signing studio
- Empty states for "no batchmates yet" / "no search results"

## 7. Groups (friend circles)

- List of your groups (max 5 you can create, can join unlimited)
- Each group: 30–50 members
- Create group → name + invite token
- Group page: member grid + invite link + group canvas (shared signing surface — every member can scribble on a single shared canvas)
- Leave button

The shared group canvas is a separate `shirts` row with ~~`is_group = true`~~ `owner_id = NULL` + `group_id = <group>` (matches migration 009; corrected in doc 08 round 2 decision 4). All members can scribble on it. The **group admin** (from `friend_groups.admin_id`) controls lock + per-canvas moderation; the Scribbl-level admin can always intervene.

## 8. Settings

- Profile (name, enrollment, quote)
- Avatar (face image, body pose, skin tone)
- Privacy (shirt permission: open / batch-only / request-only / locked)
- Lock toggle: lock/unlock your shirt at any time. *If someone is mid-scribble when you lock, their in-flight scribble still goes through (it's the last one).*
- Multi-shirt management: see your unlocked shirts, optional per-shirt avatar override
- Thank-you message (the floating toast that fires to people who sign you)
- Account: log out

## 9. Yearbook (after deadline)

- All scribbling routes lock; UI flips into yearbook mode
- Each user's profile becomes a permanent shirt card
- PNG export for the user's own shirt (front + back + all scribbles flattened)
- Friend-group canvas export
- Class composite (admin-generated) — a single PNG grid of every shirt in the batch
- All edits are blocked; only viewing + re-downloading

## 10. Admin

- Dashboard: total users, total scribbles, occupancy stats, suspended users
- Moderation queue: flagged scribbles + reported users, with action buttons (hide, remove, suspend)
- Users table: search, suspend/unsuspend, make admin
- Errors log: client + server errors from the `error_logs` table
- Broadcast: send a message to all users (appears as admin notification)
- Yearbook export: ZIP of all shirts in a batch

## What's deliberately not in this product

- Direct messaging
- A feed of all activity across all shirts (privacy)
- A "for you" recommendation system
- Comments on scribbles (reactions only)
- Multi-batch / multi-university mode (cohort-scoped)
- A "premium" tier
