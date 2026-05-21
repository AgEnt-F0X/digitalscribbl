# 11 — Project Decision Documentary (Scribbl)

> A memory document for how this project was shaped: what was decided, who pushed each decision, and why.
> This is intentionally narrative so future-you can review your own product thinking.

## Why this document exists

This project was not built by blindly shipping features. It was shaped by repeated scope decisions under real constraints: free-tier infra limits, short launch window, mobile-first realities, and emotional product goals.

This file records:
- what you (product owner) decided,
- what I (engineering pair) recommended,
- what changed during collaboration,
- what was cut on purpose.

---

## Collaboration Snapshot

- **Product owner (you):** vision, emotional direction, user reality, scope boundaries.
- **Engineering pair (me):** architecture guardrails, implementation sequencing, risk reduction, consistency.
- **Decision style:** high-iteration, honest constraint-first, fast reversals when evidence improved.

This is a strong pattern for shipping under pressure.

---

## Core Product Direction (Locked)

- Scribbl is a **farewell memory platform** first, not a generic social network.
- Launch focus is **scribble phase quality**, not full yearbook polish on day 1.
- System should be **yearbook-ready in schema**, but UI/ceremony can be deferred safely.
- User experience should be simple enough to survive friend testing quickly.

---

## Decision Ledger (Who Decided What)

Legend:
- **Owner-led:** initiated/locked by you
- **Pair-recommended:** proposed by me and accepted by you
- **Joint refinement:** started one way, evolved through both of us

| Area | Initial direction | Final decision | Driver | Why this changed |
|---|---|---|---|---|
| Anonymous scribbles | Might be included | Dropped entirely | Owner-led + pair validation | Voice + anonymity conflict, moderation complexity, export/digest branching |
| Voice-note access | Potentially broad playback | Only shirt owner + scribbler (+ admin moderation) | Owner-led | Privacy + storage cost + clarity |
| Time-locked scribbles | Considered | Dropped | Owner-led | Not aligned with offline scribble-day authenticity |
| Group canvas | Unclear semantics | Kept: one shared shirt per group, admin-controlled | Joint refinement | Already supported in schema and useful social artifact |
| Onboarding breadth | More metadata + thank-you in flow | Simplified: name, enrollment, B.Tech CS batch (1–52), face/body flow | Owner-led + pair simplification | Reduce friction, speed activation |
| Thank-you message timing | In onboarding | Popup on dashboard after onboarding | Owner-led | Better first-run completion; less cognitive load |
| Course coverage | Multi-course ambiguity | B.Tech CS only for v1 | Owner-led | Better data quality and less schema confusion |
| Yearbook transition | Full transition + ceremony soon | Deferred UI/ceremony to late launch; keep backend/scalable schema now | Owner-led + pair architecture | Avoid early polish trap while staying future-safe |
| Admin assignment | Might need UI | SQL/manual backend assignment only in v1 | Owner-led + pair security stance | Smaller attack surface and simpler permissions |
| Suspension behavior | Ambiguous | Full access block; existing content stays until manual admin action | Owner-led | Operational clarity + low risk of accidental memory loss |
| Account deletion | Needed but undefined | Email OTP flow with explicit retention behavior | Pair-recommended, accepted by owner | Safety/compliance + user trust |
| Role model | Multiple checks scattered | Single derivation helper (`getRole`) | Pair-recommended | Prevent permission drift |
| Sharing URLs | Mixed profile/invite semantics | Canonical split: profile slug vs invite code | Pair-recommended | Cleaner attribution, analytics, and route logic |
| Free-tier reliability | Concern only | Formal fallback playbook with degrade switches and thresholds | Owner-priority + pair implementation | Live safety under uncertain traffic |

---

## Major Scope Cuts (Intentional, Not Failures)

These are good cuts made to protect launch success:

- Anonymous scribbles
- Time-locked scribbles
- Print-on-demand in v1
- Friendship graph in v1
- Profile-song/media-heavy extras in v1
- Full yearbook transition UI in first launch window

This is disciplined product management, not “giving up.”

---

## Architecture Moves That Protected the Project

- Migration-backed role/lifecycle model (`010_role_access_lifecycle.sql`)
- Phase machine + degrade flags in `platform_settings`
- DB + API write gates for scribble phase
- Simplified onboarding path with explicit v1 cohort boundaries
- Documentation reconciliation with strikethrough history instead of destructive rewrites

These choices reduce “unknown unknowns” during live usage.

---

## What You Did Well (Coworker Feedback)

### 1) You prioritized user truth over feature ego
You repeatedly asked: “Does this feel like real scribble day?” That kept the product coherent.

### 2) You made hard cuts when needed
Dropping beloved ideas (anonymous mode, extra complexity) is hard. You did it quickly once tradeoffs were clear.

### 3) You think in constraints, not fantasy
You kept bringing infra limits, storage, and real user behavior into decisions. That is senior product behavior.

### 4) You accepted phased execution
You allowed defer-now/prepare-now patterns (yearbook). This is exactly how strong launches happen.

### 5) You care deeply about emotional quality
You weren’t only asking “does it work?” but also “does it feel right?” That is the difference between utility and memory products.

---

## Growth Feedback (How to get even stronger)

- **Write decision criteria before debates.**  
  Example: “Any v1 feature must pass: low storage, low moderation overhead, mobile-safe.”

- **Separate “idea parking lot” from active backlog earlier.**  
  This reduces context switching and anxiety.

- **Timebox exploratory thinking.**  
  20-minute idea sprint, then force binary: now / later / cut.

- **Define success metrics per phase sooner.**  
  For scribble phase, pick 3 KPIs early (activation, signatures per user, return rate).

---

## Personal Note to Future You

You did not just “build an app.”  
You practiced real product leadership: balancing emotion, technical limits, and shipping pressure.

The strongest signal in your process is this:
you were willing to change your mind in service of a better product.

That is rare. Keep it.

---

## Suggested Next Reflection Prompt (after launch)

After friend testing, answer these 5:

1. What did users do without being told?
2. Where did they hesitate most?
3. Which “cut” feature did nobody miss?
4. Which “small” bug hurt trust the most?
5. What would I still build if nobody ever saw the code?

Store those answers below this doc after launch day.
