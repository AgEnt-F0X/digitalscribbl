# 13 — Senior PM Review (Scribbl)

> External senior PM (15+ years, consumer social and memory products — early Instagram, Snapchat Memories, Locket, Beli). Read docs 01, 03, 05–11 plus `app/dashboard/page.tsx`, `app/onboarding/page.tsx`, `src/features/scribble/components/ScribbleStudio.tsx`, and migrations `009`/`010`. Review written 2026-05-21. Product critique only; design and dev are other people's jobs.

## 1. Executive summary

- **The product is good. Stop redesigning and start friend-testing.** Item I-1 of the ship checklist ("5 friends × 2 days stress test") is unchecked. Until that happens, every doc decision is theoretical.
- **The owner-written thank-you toast is your best feature.** No big-tech PM would think to ship that. Protect it; do not let it get demoted to a setting.
- **You have too many surfaces for 1,500 users.** Dashboard + Explore + Groups + Group Canvas + Activity + Daily Quest + Notifications + Yearbook + Guest Home + Admin + Settings. Pick three to be excellent; let the rest be functional.
- **The cuts have been consistently right.** Anonymous scribbles, multi-cohort, polaroid, profile song, early yearbook polish. Keep cutting — at least one more thing should go before launch.
- **The two-phase architecture (`scribble_open` → `transition` → `yearbook`) is genuinely senior thinking.** The "schema now, UI later" call in `docs/10` and `docs/11` is the most expensive-feeling, cheapest-shipping decision in the whole project. Trust it.

## 2. Feature ledger

| Feature | Verdict | Why |
|---|---|---|
| Avatar (face + body + skin slider) | **Good** | Curated slider + face upload solves the "everyone looks the same" problem. |
| Personal shirt + scribbles (core loop) | **Good** | Matches the offline ritual 1:1. |
| Voice notes (≤12s, owner+scribbler playback) | **Good** | Privacy gate via decision 3 of doc 08 round 2 is correct. |
| Owner thank-you message → toast on signing | **Good** | Single best feature in the product. |
| Thank-you popup moved out of onboarding | **Good** | `ThankYouMessagePopup` post-onboarding is friction reduction done right. |
| Daily Quest ("sign 3 batchmates today") | **OK** | One shape, no fallback. IST-day logic on dashboard is fragile. |
| Group Canvas (1 shared shirt per group) | **Cut-worthy** | Doc 06 already hedges this. Don't ship a feature you're pre-conceding. |
| Friend Groups | **OK** | Redundant with batches; most signing happens in WhatsApp batch chats. |
| Explore (batch grid + sign carousel) | **Good** | The real social discovery surface; dashboard should point here. |
| Activity feed / NotificationBell | **Good** | "Mark-all on close, not on open" is the right kind of small craft. |
| Multi-shirt (up to 3, cap in 009) | **Cut-worthy** | Solving for 5% of users. One shirt is the ritual. |
| Shirt lock + in-flight grace | **OK** | Grace logic earns trust; the lock itself is mostly invisible. |
| Permission modes (open/batch/request/locked) | **Risky** | Four modes is two too many; default is what 95% will use. |
| Phase Machine (`scribble_open`→`transition`→`yearbook`) | **Good** | Best architectural decision in the project. |
| 8 free-tier degrade flags in `platform_settings` | **Good** | More disciplined than 90% of seed-stage products. |
| Yearbook fields schema-ready, UI deferred | **Good** | Right call per doc 10's v1 scope. |
| Ceremony animation (sealed copy, gold border) | **OK** | Deferred correctly. Will be the most-screenshotted moment if shipped well. |
| Slug + invite split (`/u/[slug]` + `/i/[code]`) | **Risky** | Over-engineered for v1; attribution problem nobody will ask about. |
| Account deletion with email OTP | **Risky** | 30-day compliance flow for a 30-day product. |
| 52-batch grid, B.Tech CS only | **Good** | Best constraint decision in the codebase. |
| Curated skin tone slider | **Good** | "No HSV picker" avoids a moderation/identity disaster. |
| Anonymous scribbles (CUT in round 2) | **Good** | Right cut; column staying dormant is fine. |
| Email digest (Resend, weekly staggered) | **Risky** | Free-tier math doesn't work; pay $20/mo and stop pretending. |
| Admin panel + audit logs (SQL-only promotion) | **Good** | Decision 14 closes an entire class of attack surface. |
| Mobile bottom nav + compose-mode-default | **Good** | Mobile-first realism. Worth more than pixel-perfect desktop. |
| Drawing studio + handwriting font picker | **OK** | Nice differentiator. Test on a real phone before launch. |
| Stickers (inside vs outside shirt separation) | **OK** | Strict layering rule is right. 12 stickers is plenty. |
| Realtime presence ("Online now") | **Cut-worthy** | Costs connections you don't have. Start `disable_realtime_presence = true`. |
| Pending requests inline approve/decline | **Good** | Right place, right interaction. |
| Shirt level (color tier by unique signers) | **OK** | `level_override` admin field is a smart escape hatch. |
| Guest model (home + limited explore + activity) | **Cut-worthy** | Doc 05 lists every guest route as "deferred to next session." Honest call: invite-link-only for v1. |
| ChatGPT face-generation tutorial | **Risky** | Funnel killer. See section 4. |

## 3. What's working really well (top 5)

1. **The owner-written thank-you toast.** Replaces an auto-DM antipattern with one warm, pre-meditated moment. Makes the product feel human, not Growth-y.
2. **Two-phase architecture with deferred yearbook UI.** Doc 10's "v1 launch" table is textbook scoping. Migration 010 ships schema, phase guard trigger, and degrade flags; UI is a separate ship.
3. **52-batch grid + B.Tech CS lock.** Six taps to onboard, no cascading dropdowns. Compare to consumer apps' school/program/year hell.
4. **Voice notes with strict playback rules.** Only owner and scribbler can play. Broader playback would feel surveillance-y; restriction makes it intimate.
5. **Free-tier fallback playbook (doc 09).** Eight switches, named thresholds, named recipes. Most teams discover this discipline at $20M ARR after one outage. You've written it at zero users.

## 4. What's mediocre or unclear (top 5)

1. **The dashboard tries to do everything.** `app/dashboard/page.tsx` renders nine blocks (quote, DailyQuest, stats, QR, hero avatar with overlay stickers, requests, sign-next, groups, activity). On 375×667 mobile that's a long scroll before any action. The hero avatar is the right answer; trim the rest.
2. **ChatGPT face-generation step.** Step 2 of onboarding asks new users to leave the app, generate a portrait in ChatGPT/Ideogram, then return to upload. 5+ minute, multi-app journey. Doc 09 already references `public/heads/default/` — make the bank the default, ChatGPT the opt-in upgrade.
3. **Daily Quest is one quest with no fallback.** "Sign 3 batchmates today" with no streak, no variant, no reward beyond a counter. If it doesn't move signature counts in friend testing, kill it.
4. **Skin tone is one hex applied via one CSS variable.** Better than picker-anarchy, but real skin isn't monochrome. Fine for v1; add undertone for v1.1.
5. **Permission modes + lock + in-flight grace is too much surface.** Collapse to two modes: `open_to_batch` (default) and `request_only`. Drop `locked` from settings; expose it as a "Pause signing" button only.

## 5. What I'd cut or rethink (top 3)

1. **Cut Group Canvas (not Friend Groups — just the shared shirt).** Doc 06 already says you'd revisit it "if groups don't drive enough engagement." That's the founder pre-conceding the feature. Don't ship what you're already hedging on.
2. **Cut `/i/[code]` invite attribution for v1.** The five new tables in 010 are sound, but the invite/attribution half answers "who brought whom in?" — nobody will ask that in a 30-day, 1,500-person product. UUID profile URLs over WhatsApp work. Add slugs later if you regret it.
3. **Cut the email-OTP account deletion flow.** For a 30-day product, a `Hide my shirt` settings toggle + admin-handled hard deletes by request covers 95% of real need. OTP flow per decision 7 is real engineering — Resend send, OTP table, expiry, retry — that protects almost no one for almost no time.

## 6. Top 5 improvements before launch

| # | Improvement | Effort | Impact |
|---|---|---|---|
| 1 | Run the 5-friend stress test this week, not the last week. Watch students onboard + sign two shirts each, no help. | S | High |
| 2 | Compress the dashboard: collapse left rail (Stats + Link + QR + Quest) into one carousel; hide Groups behind a tab; default presence off. | M | High |
| 3 | Ship a default head bank (`public/heads/default/`, 8–12 stylized heads). ChatGPT becomes optional, not a blocker. | M | High |
| 4 | Replace `signatureCount / 150` with `uniqueSigners / batchSize`. "27 of 30 batchmates have signed you" is a story; "127 / 150" is a meter. | S | Med |
| 5 | Pay $20/mo for Resend Pro for the live month. Doc 09 already concedes this; stop engineering around 100/day. | S | Med |

## 7. Risk register

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| 1 | Resend free tier can't send to 1,500 verified students | H | M | Pay $20/mo for Resend Pro. Skip the staggered-weekly hack. |
| 2 | Asset polish anxiety eats the final week | H | M | Lock current SVGs today. Validator passes; that's the bar. |
| 3 | ChatGPT face step crashes the onboarding funnel | M | H | Default head bank as primary; ChatGPT as optional. Measure drop-off in friend test. |
| 4 | Supabase Realtime > 200 concurrent on launch evening | M | H | Start with `disable_realtime_presence = true`. Confirm flag actually skips channel subscription before launch. |
| 5 | Owner burns the final week on "one more polish" instead of monitoring | H | H | Feature freeze 7 days before launch. After that, only bug fixes. |

## 8. Post-launch roadmap

**Phase 1 — Stabilise (week 1–2 of live).** Watch `system_health_runs` daily; flip degrade flags before they bite. Personally moderate the first 50 scribbles to set tone. DM the 20 lowest-signed-count users by hand. Do not ship new features.

**Phase 2 — Yearbook handover (last week).** Build `/transition`, `/u/[slug]` per doc 10. Wire the ceremony animation. Surface yearbook content prompts at T-7d/T-3d/T-1d. Run the Sharp render job against a 50-user dummy batch first.

**Phase 3 — Post-graduation (3–6 months).** Friendship graph as static client SVG per doc 06. The "looking back" newsletter (one signature/month, parked in doc 06) is the highest-leverage retention idea in the product — revisit it. Do **not** ship multi-cohort; that's a different product with a different team.

## 9. Verdict

- **Ship confidence: 75 / 100.** Product is fundamentally right and the architecture is more disciplined than typical seed work. Remaining risk is self-imposed (last-week additions, no friend test yet).
- **Most important thing to fix today:** Get 5 students in a room and watch them onboard + sign two shirts each. Everything else is theory.
- **One thing the founder should not change:** The willingness to cut beloved features mid-flight (anonymous scribbles, multi-cohort, early yearbook polish, the 6-step onboarding). That instinct is the single biggest predictor of a successful launch. Protect it from the polish anxiety.
