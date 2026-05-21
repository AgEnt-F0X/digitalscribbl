# 16 — Synthesis of the Three Senior Reviews

> Three independent senior reviewers (PM, PD, Dev) read the project without talking to each other. This doc surfaces where they **converged** (treat as facts), where they **disagreed** (needs your call), and the smallest set of actions that satisfies all three.
>
> Source docs: `13-pm-review.md`, `14-pd-review.md`, `15-dev-review.md`.

## The verdicts side by side

| Reviewer | Confidence | Headline |
|---|---|---|
| PM | **75 / 100** | Product is fundamentally right. Risk is self-imposed (no friend test, last-week additions). |
| PD | **6 / 10** | System has a point of view; drift is concentrated in scribble flow + second avatar route. |
| Dev | **66 / 100** | Architecture is more disciplined than typical; 2 critical bugs + degrade-flag wiring gap. |

The three numbers come from different yardsticks but land in the same neighborhood: **shippable, not ship-ready.** A week of focused fixes — not features — closes the gap.

---

## Where ALL three converged (treat as facts, not opinions)

### 1. The onboarding flow is broken end-to-end
- **PD**: `.card` is undefined → step panels render as bare divs. `/onboarding` → `/onboarding/avatar` is a *second* avatar flow after confetti has already fired. Thank-you popup is gated on `onboarding_completed = true`, but the first flow saves `false` (line 189), so the popup waits behind the second flow.
- **PM**: the ChatGPT face step is a funnel killer — a 5-minute multi-app journey for a 30-day product. The default head bank exists in doc 09 but isn't wired as the primary path.
- **Dev**: doesn't comment directly but flags that `auth/sync-user` + `auth/callback` both upsert (race risk).

**This is what your first 5 friends will hit first. It is the #1 thing to fix.**

### 2. The dashboard is too dense on mobile
- **PM**: 9 blocks competing for attention; hero avatar should be primary, the rest secondary.
- **PD**: 7 `font-display text-2xl font-bold` headlines on one screen; the eye lands on the Trophy badge, not the avatar; fake interactives (Front/Back `<span>` "tabs", 5×5 div "QR", raw UUID profile URL).
- **Dev**: 11 + 4 sequential Supabase queries on every dashboard hit.

### 3. The free-tier story is mostly architecture, not implementation
- **Dev**: 6 of 8 degrade flags have no enforcer. Email digest stagger documented but unimplemented. `/api/admin/settings` allowlist doesn't include `phase` or any `disable_*` flag — admin can't flip the switches doc 09 promises.
- **PM**: just pay $20/mo for Resend Pro; stop engineering around 100/day.
- **PD**: doesn't comment.

Either build the wiring or buy the upgrade. The middle path (write the docs, leave the wires dangling) is the current state and the worst option.

### 4. The cuts you made were correct
- **PM**: "The cuts have been consistently right. Keep cutting."
- **Dev**: confirmed anonymous-scribble runtime code is genuinely gone; only intentional comments + auto-generated types remain.
- **PD**: agrees implicitly — no review mentions a missing feature.

### 5. The architecture moves are praised
All three independently called out as strong:
- Two-phase machine + deferred yearbook UI (PM #2, Dev §2)
- 52-batch + B.Tech CS lock (PM #3, PD §3)
- Voice playback restriction (PM #4, Dev §4 row)
- `role.ts` / `phase.ts` / `platformFlags.ts` abstractions (Dev §8)

**Do not touch any of these to "improve" them.**

---

## Critical bugs — all 1-line / 1-paragraph fixes

These three were the biggest surprises in the reviews. Each is bounded and small.

### CRIT-1 — Phase trigger blocks `countdown` (Dev §2a)
**File**: `supabase/migrations/010_role_access_lifecycle.sql` line ~341.
**Symptom**: the moment admin flips phase to `countdown` (the documented "T-7d banner" state), every scribble POST returns 500. The API allows countdown (`lib/utils/phase.ts:isScribbleOpen`), the trigger doesn't.
**Fix**: change `<> '"scribble_open"'` to `not in ('"scribble_open"', '"countdown"')`.
**Why it matters**: the "scalable yearbook transition" you explicitly asked for is broken before it's used.

### CRIT-2 — Admin can't flip the soft-degrade switches (Dev §4)
**File**: `app/api/admin/settings/route.ts` line 14.
**Symptom**: the allowlist permits 4 legacy keys (`scribbling_enabled`, `deadline_date`, `auto_hide_threshold`, `announcement`) and **omits** `phase`, `scribble_ends_at`, `yearbook_opens_at`, `transition_message`, and the 8 `disable_*` flags. Doc 09's "one-click switch" promise is unreachable; admin would have to SSH into Supabase SQL editor.
**Fix**: extend the allowlist.

### CRIT-3 — `.card` is undefined (PD §1)
**File**: `app/onboarding/page.tsx`. Class used 4 times; no matching rule in `app/globals.css`.
**Symptom**: every onboarding step renders without its frame. First visible regression in the first 60 seconds of any new user's journey.
**Fix**: add `.card { @apply sketch-panel; }` to `globals.css`, or replace the 4 usages with `sketch-panel`.

I can fix all three of these right now in this same turn if you want. Say the word.

---

## This-week action board (ordered by convergent evidence)

| # | Action | Who flagged it | Effort | Convergence |
|---|---|---|---|---|
| 1 | Fix CRIT-1, CRIT-2, CRIT-3 (above) | Dev + PD | S | direct critical bugs |
| 2 | Collapse `/onboarding` + `/onboarding/avatar` into one flow; gate popup correctly; inline the AI prompt; default head bank as primary | PM #3 + PD §3 | M | strongest signal — both reviewers said this independently |
| 3 | Wire the 6 unconsumed degrade flags (email/digest, scribble/voice, avatar/upload-head, sync-user, callback, realtime broadcast) | Dev #3 + PM #5 (or pay Resend Pro) | M | either build or buy, not neither |
| 4 | Rate-limit `/api/scribble/voice` + `/api/avatar/upload-head` | Dev #4 | S | uncontested |
| 5 | Block deleted users at API layer + add `admin_audit_logs` writes | Dev #5 | S | uncontested |
| 6 | Compress the dashboard (one hero above fold; remove fake QR/tabs/UUID URL) | PM #2 + PD §3 | M | strong |
| 7 | Run the 5-friend stress test (`docs/12`) | PM #1 | M | PM's #1, also gates fix-vs-feature decisions |
| 8 | Token cleanup: one cream, one purple, replace hex literals in `ScribbleStudio*` and sticker SVGs | PD §1 | S | PD-only, but mechanical |

If you do **#1, #2, #3, and #7 this week**, you will hit launch with PM's verdict moving from 75 → ~88 and Dev's from 66 → ~85. Everything else is polish.

---

## Where the PM disagrees with decisions YOU already made

I'm calling these out as honestly as I can — the PM is a credible outside voice, but you have context they don't.

### A. PM proposes cutting Group Canvas
- **You already said**: keep it.
- **PM's argument**: doc 06 already pre-concedes it would be revisited; don't ship what you're hedging on.
- **Your context**: schema is shipped (migration 009), code exists, and group canvas is the *only* artifact for friend-group memory in the yearbook later.
- **Recommendation**: keep it. PM is right that it's a candidate for cutting if friend testing shows nobody uses it. Don't pre-cut; let evidence decide.

### B. PM proposes cutting email-OTP account deletion
- **You already said**: keep it, with OTP, "good catch."
- **PM's argument**: 30-day compliance flow for a 30-day product is over-engineered.
- **Your context**: yearbook means data lives forever, not 30 days. The deletion flow protects a user 5 years from now, not next month.
- **Recommendation**: keep the spec, but **don't ship the OTP-via-email UI in v1**. Ship `is_deleted` + admin-handled hard deletes by email request. OTP flow becomes a v1.1 follow-up. (Schema is already in migration 010.)

### C. PM proposes cutting `/i/[code]` invite attribution
- **You haven't explicitly defended this** — it was pair-recommended and accepted.
- **PM's argument**: solves a "who brought who?" analytics problem no 1,500-user product asks.
- **Recommendation**: agreed. Keep the schema (already shipped in 010), but **don't build the `/i/[code]` route in v1**. Use raw `/u/[slug]` URLs over WhatsApp. The invite stack ships in the post-launch retention sprint.

### D. PM + PD both flagged the 4 permission modes are too many
Neither of you defended `open` / `batch_only` / `request_only` / `locked` recently.
**Recommendation**: collapse to two modes pre-friend-test (`open_to_batch` default, `request_only` opt-in). Expose `locked` as a "Pause signing" button. Saves a settings tab and three test paths.

---

## What every reviewer told you to protect

Read this twice before you "improve" anything below.

1. The owner-written thank-you message + post-onboarding popup (PM, PD).
2. The two-phase architecture and the choice to defer yearbook UI (PM, Dev).
3. Voice playback restriction (PM, Dev).
4. The 52-batch + B.Tech CS lock (PM, PD).
5. The `role.ts` / `phase.ts` / `platformFlags.ts` library shape (Dev).
6. The wordmark + paper-note-tape + sticker-reaction triad (PD).
7. `paper-skeleton` loaders + "Something tore the paper." `PageError` (PD).
8. The instinct to cut features mid-flight (PM, your decision-documentary doc 11).

---

## Next action

The most expensive thing in any review is the gap between "we wrote the doc" and "we shipped the wire." Three reviewers agreed that's where Scribbl currently sits.

Three options for the next session, pick one:

- **A. Fix the 3 critical bugs now** (CRIT-1/2/3 above), then I synthesize what's left and you decide.
- **B. Fix the 3 criticals + the onboarding collapse** (#1 + #2 from the action board). This is roughly one focused session.
- **C. Full action items #1–#5 in sequence**, then schedule the friend test (#7). This is two sessions but takes the project from 66–75% to ~85% ship confidence.

Tell me A / B / C and I move.

---

## Closeout — 2026-05-21 evening (Round 3)

User picked **option C**. Engineering shape work landed in one session: critical fixes, onboarding collapse, degrade-flag wiring, rate limits, deleted-user gates, admin audit logging, permission-mode collapse. `npm run type-check` green; the disagreement items B/C/D were also actioned (account-deletion OTP UI deferred, `/i/[code]` deferred, modes 4→2). See `docs/07-changelog.md` "Round 3" entry for line-level detail.

## Closeout — 2026-05-21 night (Round 4 — PM/PD overrides + UX rebuild)

User stacked five hard overrides on top of the option-C plan and demanded "Notion / Figma level" UX polish on both mobile and desktop. Executed as: parent did the small PM cleanup (deletes + skin tone upgrade), then launched three parallel subagents (Dashboard / Mobile-Studio / Tokens-A11y), then merged outputs + threaded the cross-subagent coordination items + ran final lint/type/test.

### Done this round

| # | Item | Status | Notes |
|---|---|---|---|
| PM #M-1 | Drop Daily Quest | ✅ | Component + dashboard usage + two count queries removed |
| PM #M-2 | Reject head placeholder bank | ✅ | `lib/data/headPlaceholders.ts` deleted; onboarding step 2 reverts to **prompt → upload → (skip)** with the AI prompt promoted to `<details open>` |
| PM #M-3 | Skin tone upgrade (undertone axis) | ✅ | `lib/utils/skinTone.ts` exposes `skinToneFrom(depth, undertone)`; onboarding step 3 renders two sliders with live preview; back-compat for legacy `{value}` and 5-swatch ids preserved |
| PM #M-4 | Drop email digest | ✅ | Route returns 503 unconditionally unless `EMAIL_DIGEST_FORCE_ENABLE=true`. No cron. Body intact for future re-enable on a non-paid provider. |
| PM #M-5 | Drop account deletion | ✅ deferred | Schema in mig 010 stays (admin SQL flip + the API gates we built keep working). No UI ships in v1 — also moot since OTP needs the now-disabled email system. |
| PD §3 + PM #2 | Dashboard compression (desktop + mobile) | ✅ | 10 panels → 5 visible. Mobile-first single-column with the shirt hero above the fold. Single Caveat heading per screen. Killed fake QR + fake Front/Back pills + decorative angled border divs. Lucide icons → hand-drawn sticker SVGs. Friendly URL label hides the raw UUID. |
| PD §5 mobile pain | Mobile scribble studio bottom-sheet | ✅ | Canvas pinned top 60vh. Single tabbed bottom sheet (Tools / Text / Stickers / Voice). Duplicate Publish CTA dropped on mobile. 44×44 tap targets everywhere. Selection editor (rotation/scale/dup/delete) replaces tiny corner handles. |
| PD §1 + §9 | Token consolidation | ✅ | 6 purple-literal sites + 19 cream-literal sites swept to `bg-brand`/`text-brand`/`bg-paper-100`. `CANVAS_COLORS` re-synced to tailwind `scribble.*`. |
| PD §6 + §9 | Focus + contrast + motion | ✅ | `:focus-visible` ring on every `pencil-button` / `btn-*`. `bottom-nav-item` inactive contrast bumped to ≈6.6:1. `prefers-reduced-motion` block in `globals.css`. |
| PD §6 + §9 | Screen-reader announcements | ✅ | `BottomNav` `aria-current="page"` on every active tab. `NotificationBell` dynamic aria-label with unread count. `AvatarDisplay` new `displayName` prop threaded into the 5 dashboard call sites. |
| PD §9 nice-to-have | `SkinTonePicker.tsx` retired | ✅ | Replaced with new shared `SkinToneSliders.tsx` driven by the upgraded skin-tone model |
| PD §4 single-Caveat principle | `ActivityLog` heading demoted | ✅ | Was `font-display text-2xl bold`, now `text-base font-semibold` + the existing eyebrow. All 3 callers (dashboard, profile, /activity) now have exactly one Caveat hero. |
| `docs/02` voice cap | 10s → 12s | ✅ | Reconciled with `MAX_VOICE_DURATION_MS = 12_000` |

### Knowingly deferred

| Item | Reason | Tracking |
|---|---|---|
| Body-pose silhouette SVGs in `BODY_STYLES.glyph` | Onboarding/page is parent-owned and emoji-driven; adding a field without a consumer is dead weight | log in revisit-later for the next onboarding pass |
| `/profile/[id]?panel=back` query param | Profile page wasn't in this round's scope; the dashboard's `View back` link navigates correctly but won't auto-switch panels until profile honors the query | flagged for the profile-page polish round |
| Extend `/api/avatar/config` to carry `{depth, undertone, hex}` | The advanced avatar flow loses the undertone axis on save because the legacy API only accepts the 5 ids; the new onboarding flow stores the full object in `avatar_config` directly | log for v1.1 |
| `AppShell` dedupe of NotificationBell | `AppShell` isn't mounted by any page yet; the "duplicate" PD flagged is purely forward-looking | will resolve when AppShell adoption begins |
| `SIGNATURE_GOAL = 150` → `uniqueSigners / batchSize` | PM #4 suggestion; out of round scope; needs a new `batch_size` fetch | tracked in PM review |

### Final verification
- `npm run type-check` — exit 0
- `npm run lint` — exit 0 (caught and fixed a pre-existing inline-component-during-render in `ScribbleToolbar.tsx` + two unescaped apostrophes in `ThankYouMessagePopup.tsx`)
- `npm test` — 47/47 pass

### Confidence shift after Round 4

| Reviewer | After Round 3 | After Round 4 (estimate) |
|---|---|---|
| Dev | 85% | ~90% — rate limits, audit log, soft-degrade flags, deleted-user gates all live and now exercised through the rebuilt UI |
| PM | 82% | ~88% — Daily Quest cut, head bank cut, account deletion + email digest scope-cut, dashboard density addressed, skin tone upgraded |
| PD | 7.5/10 | ~8.5/10 — token sweep done, focus/contrast/motion all addressed, mobile scribble studio is a different product, single Caveat per screen achieved. Remaining gap: body-pose silhouette SVGs, profile page polish, and the live-test feel that only the friend test can reveal |

What's left between here and ship: the 5-friend stress test (`docs/12-friend-test-runbook.md`) — that is now the next gate, not more code.
