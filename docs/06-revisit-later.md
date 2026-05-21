# 06 — Revisit Later

> Ideas we discussed but deliberately did not build for the first launch. Each entry has the rationale + the revisit trigger.

## In the build, but later in the build

These are queued for the final week of pre-launch testing, not in the first build pass.

### Deadline ceremony animation
- **What:** When the deadline passes, the first time a user opens their own shirt page, a one-time animation plays — scribbles fade-in with a pencil-stroke sound, gold border draws around the shirt, copy reads *"Your shirt is sealed. Forever."*, then transitions to yearbook mode.
- **Why deferred:** Needs careful timing, sound effect sourcing, and full integration testing. Not viable in early-build pass.
- **Revisit trigger:** Final week before deadline.
- **Effort:** ~1 day.

### Friendship graph (yearbook-only)
- **What:** A network visualization (SVG force-graph) where each node is a user and each edge is a mutual scribble. Renderable per-user. Becomes a downloadable poster.
- **Why deferred:** Only relevant after the scribble window closes; lives in yearbook mode, not scribbling mode.
- **Revisit trigger:** Yearbook phase, when scribbling lock is enabled.
- **Effort:** ~2 days. Pure client-side SVG, ~200 lines of JS.

## Cut from this release entirely

### Print-on-demand integration
- **What:** Pipe the final shirt PNG to a POD service (Printrove/Qikink/Printful) to ship a physical printed shirt.
- **Why cut:** The product is already a shirt with a design on it; printing that design *on another shirt* is conceptually confusing. Users said they'd want their *actual* scribbled shirt (physical signing), not a print of the digital one.
- **Revisit trigger:** Post-launch if multiple users explicitly ask for it.

### Pre-generated avatar head bank
- **What:** A bank of 50–80 pre-generated stylized portraits users could pick from to skip the ChatGPT upload step.
- **Why cut:** Personal profiles are core to the product. Two users picking the same head defeats the point. Users would also complain about looking like someone else.
- **Revisit trigger:** Never. This is a permanent design decision.

### Time-locked / sealed scribbles
- **What:** A scribble that stays sealed until a specific future date (e.g. opens at convocation, opens 5 years later).
- **Why cut:** The product is recreating real-world scribble day, where every signature is visible immediately. Sealed scribbles break the metaphor.
- **Revisit trigger:** Never (in this product).

### Signing party / real-time multiplayer rooms
- **What:** A timed multiplayer room (10 minutes, max 10 people) where multiple friends sign the same shirt with live cursors.
- **Why cut:** Friend groups + batches already provide the social structure. Coordinating availability for synchronous signing is harder than asynchronous signing. Free-tier Realtime budget is also tight.
- **Revisit trigger:** If groups don't drive enough engagement during the first week of launch.

### "Whisper" / mutually-gated scribbles
- **What:** A scribble that's hidden until the owner reciprocates.
- **Why cut:** Doesn't match the real-world ritual. Also creates layout conflicts (someone else might draw over the hidden region).
- **Revisit trigger:** Never (in this product). Anonymous-until-deadline scribbles cover the same emotional beat.

### Profile song / Spotify embed
- **What:** Each profile has one embedded Spotify track + a one-line "what defined me here" caption.
- **Why cut:** Adding *another* manual onboarding step in an already-friction-heavy flow is the wrong move. Spotify embed itself is cheap, but the human friction isn't.
- **Revisit trigger:** Post-onboarding, as a "polish your profile" prompt on the dashboard after the user has settled in. Not blocking launch.

### Polaroid moments / photo-on-shirt
- **What:** Phone-camera capture in-app, framed as a polaroid, placed on the shirt.
- **Why cut:** Each polaroid is ~100-500KB. Storage cost + per-shirt-render complexity is significant. Not worth the budget hit.
- **Revisit trigger:** If we move off Supabase free tier.

### Auto-DM after first scribble
- **What:** Auto-generated thank-you DM to anyone who signs your shirt.
- **Why cut:** Too much app-as-a-relationship-manager. **Replaced by** the owner pre-writing a single thank-you message that fires as a toast to anyone who signs — direction reversed, much warmer.
- **Revisit trigger:** Never (replaced).

### Anonymous voice notes
- **What:** Voice notes that don't reveal the speaker.
- **Why cut:** Voice is the most identifying signal you can leave. Anonymity + voice is a contradiction.
- **Revisit trigger:** Never.

### Anonymous scribbles (text/drawing) — added 2026-05-21
- **What:** A "Sign anonymously" toggle on a scribble; author hidden until deadline.
- **Why cut:** Originally in v1 plan. Removed in doc 08 round 2 (decision 2). Reasons:
  - `is_anonymous` + voice is internally contradictory.
  - Moderation surface gets messy — admins always need to see real author; UI has to never leak it.
  - Email digest, exports, yearbook all need special branches.
  - Voice notes cover the same emotional weight (a personal message with restricted playback — see doc 08 §3).
- **Schema impact**: `scribbles.is_anonymous` column stays (migration 009) but is unread/unwritten by the app. Drop in a future migration.
- **Revisit trigger:** Never (in this product).

### Shirt lock (was almost cut, kept with caveat)
- **Original status:** "Kill the lock code entirely."
- **Decision:** Kept. Users can lock/unlock anytime. **Caveat:** if a user locks their shirt while someone is actively signing, the in-flight scribble still goes through (it becomes the last one). Without this fallback, lock toggles would create rage moments.
- **Effort:** Trivial — one API check change.

### Voice notes (was deferred, brought back)
- **Original status:** "Defer to post-launch."
- **Decision:** Included in v1. Storage math (10s × 30KB × ~5000 clips = 150 MB) fits in the 1GB free tier. Emotional payoff is huge — voice is 10x more personal than text.

## Bigger ideas parked indefinitely

These are good ideas that are not the *right* idea for a one-cohort, one-month product. Saved here in case the product gets a different future life.

- A multi-cohort / multi-university platform (would need full re-architecture for tenant isolation)
- A standalone yearbook app that imports from Scribbl (post-mortem)
- AR shirt try-on (camera + 3D)
- A "looking back" newsletter that emails users one signature from their shirt every month for the next year
- Integration with university LMS (Moodle/Canvas)
- A photo-album feature where each shirt links to shared event photos

## How to use this doc

- If you find yourself building something that's in this doc, **stop and re-read the rationale**.
- If the rationale no longer holds, update this file with the new decision and the date.
- If a "revisit trigger" fires, move the item to the active build queue in [05-ship-checklist.md](./05-ship-checklist.md).
