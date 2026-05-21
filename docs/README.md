# Scribbl — Documentation Index

> **Status:** v1 build for single launch, scribble day shipping.
> **Last refresh:** May 2026.
> **Old docs:** moved to [`docs/archive/`](./archive/) — superseded but kept for history.

This is the canonical doc set for the project. Read in order.

| # | Doc | Read when |
|---|---|---|
| 01 | [Product overview](./01-product-overview.md) | You're new to the project or need the elevator pitch |
| 02 | [Design system](./02-design-system.md) | You're touching UI, colors, type, spacing, or components |
| 03 | [Product flows](./03-product-flows.md) | You're touching a user journey (onboarding, signing, dashboard, etc.) |
| 04 | [Architecture](./04-architecture.md) | You're touching DB, auth, realtime, storage, or routes |
| 05 | [Ship checklist](./05-ship-checklist.md) | You're preparing to deploy or test end-to-end |
| 06 | [Revisit later](./06-revisit-later.md) | You're wondering "why didn't we build X?" |
| 07 | [Changelog](./07-changelog.md) | You want to know what changed between the old plan and this one |
| 08 | [Information architecture, roles, sharing, plan](./08-information-architecture-access-and-implementation-plan.md) | **Canonical** for roles, routes, sharing, attribution, onboarding order, skin tone, account deletion, suspension, voice rules |
| 08 | [Avatar & shirt assets playbook](./08-avatar-shirt-assets.md) | You're stuck on shirt/avatar SVGs |
| 09 | [Free-tier fallback playbook](./09-free-tier-fallback.md) | You're worried about hitting Supabase/Vercel/Resend limits during the live month |
| 10 | [Scribble→Yearbook transition](./10-scribble-to-yearbook-transition.md) | You're touching phase logic, the lock cutover, or the yearbook profile pages |
| 11 | [Project decision documentary](./11-project-decision-documentary.md) | You want to remember how each major call was made and why |
| 12 | [Friend-test runbook](./12-friend-test-runbook.md) | You're running 2-day testing with friends before launch |
| 13 | [PM review](./13-pm-review.md) | You're a PM picking up where the round-3 review landed |
| 14 | [PD review](./14-pd-review.md) | You're a designer picking up where the round-3 design review landed |
| 15 | [Dev review](./15-dev-review.md) | You're an engineer picking up where the round-3 dev review landed |
| 16 | [Three-reviews synthesis](./16-three-reviews-synthesis.md) | You want the combined PM/PD/Dev verdict before deciding what to fix |
| 17 | [Design system v2 — theme conversation](./17-design-system-v2-theme-conversation.md) | You want to understand *why* the Sunlit Lawn theme was chosen (rounds 3 → 4 → 5) |
| 18 | [Sunlit Lawn theme spec & playbook](./18-sunlit-lawn-theme-spec.md) | **Canonical** for the design system: tokens, components, place layer, whiteboard, micro-interactions, school-element vocabulary, implementation phases |
| 19 | [Founder handoff checklist](./19-handoff-checklist.md) | **Start here if you are the founder.** What you still have to do (14 avatar SVGs, 6 illustrations, friend test) and the exact pre-flight / friend-test / ship-gate checklists. |

> ⚠ 2026-05-21 — Docs 02/03/04/06 contain ~~strikethroughs~~ that mark passages superseded by doc 08 Round 2. **Doc 02 is also partially superseded by doc 18 (Sunlit Lawn theme) for Phase 1.** When in doubt, doc 18 wins for design.

## What is Scribbl in one paragraph

A one-month digital farewell experience for final-year university students. Each student gets a virtual t-shirt; their batchmates sign it with handwritten messages, doodles, voice notes, and stickers — recreating the offline scribble-day ritual online. After the deadline, all shirts lock into a permanent yearbook. Built on free-tier Supabase + Vercel, designed mobile-first, target scale 1,000–2,000 students at one university.

## What this project is **not**

- Not a forever-social app. It exists for one month per cohort.
- Not a drawing tool. The drawing is a means to a memory, not the product.
- Not a marketplace. Scribble day comes once; there is no v2.

Read [01-product-overview.md](./01-product-overview.md) next.
