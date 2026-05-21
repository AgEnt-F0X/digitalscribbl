# 12 — Friend Test Runbook (Scribbl)

> Two days. Real friends. Real phones. Real signing.
>
> This runbook is **for the people you're testing with as much as for you**. Send them a link to it on day 0. It is intentionally written to be readable by a non-developer friend, not just by the founder.

---

## What we are testing

Scribbl in its full living form. Onboarding through signing through reactions through admin. Not a unit-test pass — a *people-test* pass. We want to find:

1. **Blockers**: anything that stops a user from completing a flow.
2. **Friction**: anything that confuses or annoys.
3. **Magic moments**: anything that makes someone smile.
4. **Surprises**: anything that does not match what the screen suggested would happen.

The goal of two days is not to fix everything. It is to know *what* to fix.

---

## Test cast

Recruit at least **5 friends**:

| Slot | Persona | Why this slot exists |
|---|---|---|
| F1 | Same batch as you | Will be the "main signer" — most realistic user |
| F2 | Same batch as you | Another batchmate so two-tab realtime works |
| F3 | Different B.Tech batch | Tests batch-only permission edge cases |
| F4 | Non-university Gmail | Forces the **guest path** |
| F5 | Friend with a low-end Android (≤4GB RAM) | Mobile performance reality |
| (optional) F6 | Friend on iOS Safari | Browser parity sanity |

For each: collect their phone model, browser, and account email up front. Put it in the bug report template at the bottom.

---

## Environment setup (founder, before day 1)

Before anyone touches it, you should be green on these:

- [ ] `npm run type-check` exits 0
- [ ] `npm run build` succeeds locally
- [ ] Production deployment is live on the URL you intend to share (Vercel domain or custom)
- [ ] Supabase migrations 001 → 010 confirmed applied (use the verifier block in your notes)
- [ ] Storage buckets `avatar-heads` and `shirt-textures` exist and are public
- [ ] `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` is set to your real university domain
- [ ] Google OAuth callback URL points to **prod**, not localhost
- [ ] At least one admin user is set in DB: `update users set is_admin = true where email = 'you@uni.edu';`
- [ ] `platform_settings.phase` is `"scribble_open"` (verifier query)
- [ ] All `disable_*` flags are `false`
- [ ] You have a way to receive bug reports (Google Form, Discord channel, anything)

If any of those are red, **stop**. Two days of feedback on a broken deploy is wasted feedback.

---

## Severity scale (paste into your bug form)

- **S1 — Blocker**: cannot complete a core flow at all.
- **S2 — Broken**: flow completes but with wrong result, lost data, or wrong permission.
- **S3 — Friction**: works, but confused or slow the user.
- **S4 — Polish**: visual quirks, copy issues, small layout offsets.
- **MAGIC**: something the user spontaneously praised. **Log these too.**

---

## Day 1 — Solo Smoke (each friend, alone, ~30 minutes)

Send each friend their device list of scenarios and the bug form. They run through it on their own, at their own pace. No live calls yet.

### S1. First login & onboarding

Each friend runs through their assigned path.

#### F1, F2, F3 — Verified student path

1. Open the production URL on phone.
2. Tap "Sign in with Google", choose their **university Gmail**.
3. Land on `/onboarding`. Confirm the 4-step indicator shows at the top.
4. Step 1: enter display name, enrollment number, pick batch 1–52.
   - **Check**: program shows "B.Tech Computer Science" and is not editable.
   - **Check**: every batch number 01–52 is tappable.
5. Step 2: upload front face. (You can hand them a sample portrait if they don't have one ready.)
6. Step 3: pick a body pose, drag the skin tone slider, pick a shirt colour.
7. Step 4: confirm.
8. **Confetti must fire.** If not, log it.
9. Land on `/dashboard`. **Thank-you popup should appear once.** Write something custom and save.
10. Refresh the page. **Popup must NOT come back.**

#### F4 — Guest path

1. Open the production URL.
2. Sign in with **personal Gmail** (not university).
3. Should redirect to `/onboarding/guest` (or the guest landing — whatever exists today).
4. Try to manually navigate to `/dashboard`, `/settings`, `/groups`. Should bounce them away.
5. Try a profile URL of one of the verified students (F1). They should be able to view it.
6. Try to sign F1's shirt. If F1 has `shirt_permission = 'open'`, it should work. Log the experience.

### S2. Dashboard scan (verified friends)

1. Confirm avatar renders with their face + body + shirt colour + skin tone.
2. Confirm Daily Quest module visible.
3. Confirm shirt level, signatures counter, share link, QR placeholder.
4. Confirm notification bell renders (icon top right).
5. Confirm bottom nav appears **only on mobile**.
6. Confirm online batchmates / sign-next column populates with at least the other testers (because you're all online).

### S3. Profile sanity

1. Tap own avatar → land on `/profile/{your_id}` (or `/u/{slug}` if shipped).
2. See own shirt with no scribbles yet (assuming fresh).
3. Tap another friend's avatar from "Sign next". Confirm their shirt loads.
4. Confirm the request-or-sign button is in the right state for the permission combo.

### S4. Solo errors (deliberately try to break it)

For each friend, ask them to:

1. Tap their browser back button **repeatedly** during onboarding. Does the flow recover or break?
2. In the scribble studio, **rotate the phone** mid-draw. Does the canvas survive?
3. Force-quit the browser tab mid-onboarding. Reopen — do they resume where they left off?
4. Turn airplane mode **on** for 10 seconds, then off. Does any UI explode? (Look for unhandled Promise rejections in the console if a friend is dev-curious.)
5. Try to sign their **own** shirt. Should be blocked with a clear message.

### S5. Self-report

At the end of day 1, every friend answers these 4 in their own words:

1. What is Scribbl in one sentence, in your words?
2. What was the moment you first felt "ah, this is for me"? (If ever.)
3. What was confusing or annoying enough that you almost stopped?
4. Would you send this to a batchmate today? Why / why not?

These four answers are **more valuable than any bug list**. Save them.

---

## Day 2 — Multi-player live session (90 minutes total)

Everyone online on the call/group at the same time. Founder runs commentary, friends run actions.

### Block A — Signing real shirts (40 min)

1. F1 opens F2's shirt in scribble studio.
2. F1 draws something simple, types a short note, attaches a voice clip (~5 sec).
3. F1 hits publish.
4. **Verify**:
   - F2's dashboard shows the new scribble within a few seconds (realtime).
   - F2 gets a notification.
   - F2 opens the scribble and **can play** the voice.
   - F3 opens F2's profile in another tab and **sees** the scribble but **cannot play** the voice (the play button must be hidden or a mute icon must be shown).
   - F1 opens F2's profile and **can replay their own** voice note.
5. Repeat with F1 → F3 and F3 → F1 so the pairing matrix grows.

### Block B — Permission gates (20 min)

1. F1 sets `shirt_permission = 'request_only'` (via Settings).
2. F2 attempts to sign F1's shirt. Should be blocked with a "request to sign" CTA.
3. F2 sends a request.
4. F1 sees the request in the dashboard "Pending requests" card.
5. F1 approves.
6. F2 retries and now signs successfully.
7. Repeat with `batch_only`:
   - F1 sets `batch_only`.
   - F3 (different batch) attempts to sign — should be blocked with batch reason.
   - F2 (same batch) attempts — should succeed.

### Block C — Groups (15 min)

1. F1 creates a friend group (Settings or wherever the CTA lives).
2. F1 invites F2 and F3 via the group invite link.
3. F2 and F3 join.
4. Open the group canvas. All three should be able to draw on the **shared** shirt.
5. Confirm only group members can see / draw. F4 (guest) should not be able to access.

### Block D — Moderation (15 min, founder + 1 friend)

1. Founder logs in as admin.
2. A friend posts a deliberately silly-but-flag-worthy scribble (an emoji, not actually offensive — we're testing the mechanism).
3. Another friend reports it.
4. Admin sees it in the moderation queue at `/admin/moderation`.
5. Admin hides it.
6. Reporter sees the scribble is gone on refresh.
7. Confirm an `admin_audit_logs` row exists (run a quick SQL in Supabase).

### Block E — Suspension drill (5 min, founder only)

1. From SQL editor: `update users set is_suspended = true where id = '<F3_id>';`
2. F3 refreshes any page. Should bounce to `/login?reason=suspended`.
3. F3's existing scribbles on F1's shirt **should still be visible** (this is the documented behaviour).
4. Reverse it: `update users set is_suspended = false where id = '<F3_id>';`

---

## Phase 2 — Mobile audit (30 min, parallel to day 2)

Each friend on their own phone walks through this checklist with their actual thumb:

- [ ] Every button is reachable with one thumb in the lower 60% of screen.
- [ ] No horizontal scroll on any page.
- [ ] Touch targets feel ≥44px (no "did I tap that?" moments).
- [ ] Inputs in onboarding don't get covered by the keyboard.
- [ ] Modals (thank-you popup, request actions) dismiss easily and don't trap focus.
- [ ] Scribble studio: drawing feels accurate; pinch-zoom doesn't fight the canvas.
- [ ] Notification bell panel is usable — not hidden behind the nav.
- [ ] Voice recording works on iOS Safari (this is the most likely platform to break).
- [ ] Confetti, animations, and transitions don't cause visible jank on a mid-range Android.

---

## Phase 3 — Soft-degrade smoke (founder only, 10 min)

You ship with `platform_settings` flags built in. Confirm they actually do something:

1. In SQL editor: `update platform_settings set value = 'true'::jsonb where key = 'disable_voice_notes';`
2. Wait 60 seconds (cache TTL) and refresh the scribble studio. Mic button should be gone or the upload should respond 503.
3. Reverse: `update platform_settings set value = 'false'::jsonb where key = 'disable_voice_notes';`
4. Repeat for `disable_scribble_writes` — every scribble POST should return 503 within ~60s.
5. Reverse.

If a flag doesn't take effect after the cache TTL, that's an S2 bug.

---

## Phase 4 — Lifecycle drill (founder only, 10 min)

Test the *plumbing* for phase transitions even though the UI is deferred:

1. In SQL editor: `update platform_settings set value = '"transition"'::jsonb where key = 'phase';`
2. Wait 30 seconds (cache TTL).
3. Try to publish a scribble. The API must return `410 PHASE_LOCKED`. The DB trigger must also block direct inserts.
4. Reverse: `update platform_settings set value = '"scribble_open"'::jsonb where key = 'phase';`

This is the dress rehearsal for yearbook day. We don't have to like the UI yet — we just have to know the locks work.

---

## Bug report template (paste into your form)

```
TESTER NAME:
DEVICE / OS / BROWSER:
NETWORK (wifi / 4G):
SCENARIO (e.g. "S2 — Dashboard scan"):
WHAT I EXPECTED:
WHAT HAPPENED:
SEVERITY (S1 / S2 / S3 / S4 / MAGIC):
SCREENSHOT OR VIDEO URL:
TIME (HH:MM):
```

Tell friends: **screenshots > words**. A 5-second screen recording is the most useful thing they can send.

---

## Triage rules (founder, at the end of each day)

End of day 1:
- Cluster all S1s. Each must have a fix or a documented workaround **before day 2 starts**.
- Cluster S2s. Pick the 3 most-reported. The rest go in `06-revisit-later.md`.
- Don't touch S3/S4 yet.

End of day 2:
- Re-cluster. The S1/S2 list from yesterday should be down to zero new instances.
- S3s become the polish list for the rest of launch week.
- S4s only get fixed if you have time AND they're visible on the landing page.
- The **MAGIC** entries become your launch tweet copy and your post-graduation memory.

---

## What "passing" looks like

You don't need everything green. You need:

- **0 S1s on any flow that a real user must complete.**
- **≤3 S2s, all with known root cause.**
- **At least 1 MAGIC moment** spontaneously reported by ≥2 testers. (If nobody felt the magic, the product needs more soul, not more features.)

If you hit that bar, you're cleared to send the link to your batch.

---

## Founder's day-after journal (5 minutes, end of day 2)

Don't skip this. Open a markdown file and write — in plain prose, no bullets:

1. What scared you most about today.
2. What surprised you most about how your friends used Scribbl.
3. The one thing you'd remove right now if you could.
4. The one thing you'd ship more of.
5. Whether you'd let your future self read this. (Yes or no, no fluff.)

Save it next to this runbook. After graduation, this file becomes part of your story, not just your bug log.

---

**You are not testing a product. You are testing whether your friends feel something. Keep score of the second one harder than the first.**
