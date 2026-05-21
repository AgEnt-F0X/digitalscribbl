# 09 — Free-tier capacity & fallback playbook

> Scribbl runs on free tiers of Supabase + Vercel + Resend. This doc defines the **live monitoring thresholds**, **automatic soft-degrade behaviours**, and the **upgrade path** if any resource gets close to its limit. Companion to doc 08.

## Why this doc exists

The whole product runs in a single month for one cohort. We cannot afford to find out we hit a wall on farewell day. The plan:

1. **Always know how close we are to every limit** (admin dashboard alarm at 80%).
2. **Pre-build soft-degrade switches** so degrading is a single SQL flip, not a code release.
3. **Know the upgrade cost in advance** so the call is "spend $25" not "panic-rewrite at 11pm".

## Resource budget by free tier

| Resource | Limit | Expected use at 1,500 users | Safety margin |
|---|---|---|---|
| Supabase DB rows | 500 MB total | ~80 MB (users + scribbles + reactions + notifications + links) | Comfortable |
| Supabase Storage | 1 GB | ~470 MB (heads 120 MB + voice 150 MB + buffers 200 MB) | Comfortable |
| Supabase Realtime concurrent | 200 connections | Peak ~150 farewell evening | Tight |
| Supabase Realtime messages | 2 M / month | ~500k expected | Comfortable |
| Vercel bandwidth | 100 GB / month | ~30 GB expected | Comfortable |
| Vercel serverless time | 100 GB-hr / month | ~10 GB-hr | Comfortable |
| Vercel function timeout | 10 s | Most under 1 s; yearbook ZIP risk | Tight on yearbook only |
| Resend email | 100 / day | 215/day for daily digest, 31/day if weekly staggered | **Insufficient — must stagger weekly** |

## Soft-degrade switches

A single table `platform_settings` already exists. We add **on/off flags** that any route can read in <5ms. Flipping a flag instantly degrades the relevant feature.

Add to migration 010:

```sql
insert into public.platform_settings (key, value) values
  ('disable_voice_notes',        'false'),
  ('disable_realtime_presence',  'false'),
  ('disable_realtime_broadcast', 'false'),
  ('disable_email_digest',       'false'),
  ('disable_new_signups',        'false'),
  ('disable_scribble_writes',    'false'),    -- nuclear: read-only mode
  ('disable_head_uploads',       'false'),
  ('disable_share_link_creation','false')
on conflict (key) do nothing;
```

Each flag is a string `'true'` / `'false'` for consistency with the existing settings storage.

### What each switch does when flipped

| Switch | Effect | When to flip |
|---|---|---|
| `disable_voice_notes` | Hide mic button; existing voice clips still play | Storage > 800 MB or voice clip count > 4,500 |
| `disable_realtime_presence` | Stop publishing "viewers online" presence | Realtime concurrent > 150 |
| `disable_realtime_broadcast` | Stop broadcasting `texture_updated`; clients fall back to polling every 30s | Realtime concurrent > 180 |
| `disable_email_digest` | Cron route returns 200 immediately, sends nothing | Resend quota hit early in the day |
| `disable_new_signups` | Login still works for existing users; new OAuth callbacks redirect to a waitlist page | DB > 400 MB |
| `disable_scribble_writes` | All scribble POSTs return 503; UI shows "Scribbl is read-only for a few minutes" | Any resource > 95% |
| `disable_head_uploads` | Upload endpoint returns 503; new users keep default avatar bank head | Storage > 900 MB |
| `disable_share_link_creation` | New `/i/<code>` links cannot be made; existing ones still resolve | `share_links` > 50k rows |

## Threshold ladder

Each resource has three thresholds. Admin dashboard shows the highest one currently tripped.

| State | When | Visible to admin | Auto-action |
|---|---|---|---|
| Green | < 60% | "Healthy" badge | none |
| Yellow | 60–80% | "Warning" banner with resource name + % | none — admin decides |
| Orange | 80–90% | "Pre-degrade" banner | suggested switches highlighted; admin one-click flips |
| Red | > 90% | "Critical" red banner with countdown | **automatic** soft-degrade applied + email to admin |

## Per-resource fallback recipes

### Supabase DB (500 MB)

**Likely growth source**: `notifications`, `scribbles.canvas_svg`, `share_link_visits`, `error_logs`.

**Pre-emptive (yellow)**:
- Trim `notifications` older than 14 days (`delete from notifications where created_at < now() - interval '14 days' and is_read = true`).
- Trim `error_logs` older than 30 days.
- Aggregate `share_link_visits` into `share_link_visit_daily` (table created in migration 010 if rows > 100k); delete originals older than 30 days.

**Soft-degrade (orange)**:
- Flip `disable_new_signups`.
- Run the trim jobs above immediately.

**Hard (red)**:
- Flip `disable_scribble_writes`.
- Upgrade Supabase to Pro ($25/mo, instant, no downtime).

### Supabase Storage (1 GB)

**Likely growth source**: voice notes, head images.

**Pre-emptive**:
- Confirm voice encoder is Opus 24kbps mono (target ≤ 35 KB/clip).
- Confirm heads are Sharp-resized to 512×512 WebP quality 75 (target ≤ 80 KB).

**Soft-degrade**:
- Flip `disable_head_uploads`; new users get a default head from the bank in `public/heads/default/`.
- Flip `disable_voice_notes`; existing clips still play.

**Hard**:
- Move oldest voice clips to a free secondary bucket (cloudflare R2 free 10 GB) and rewrite their URLs. Migration script kept in `scripts/migrate-voice-to-r2.ts`.
- Upgrade Supabase Pro ($25, includes 100 GB).

### Supabase Realtime (200 concurrent)

**Soft-degrade**:
- Flip `disable_realtime_presence` first — saves the most overhead for the lowest UX cost.
- Then `disable_realtime_broadcast`; clients fall back to a 30s `setInterval` poll on the shirt page that fetches `/api/shirt/<id>/recent` (small JSON of last-modified timestamps). The route exists already; only the channel subscriber switches.

**Hard**:
- Disconnect channels for users idle > 90 seconds (client-side `Page Visibility API`); reconnect on focus.
- Upgrade to Supabase Pro (500 concurrent).

### Resend (100/day)

**Strategy from day one**: weekly digest, staggered. Assign each user a `digest_slot 0..6 = hash(user_id) % 7`. Slot N sends only on day-of-week N. With 1,500 verified users → ~215 / slot → still over the daily limit.

**Option A** (free, but degraded): batch each slot across multiple days. Slot 0 sends across Sun/Mon (107 each). Acceptable.

**Option B** (paid): Resend Pro $20/month → 50,000 emails. Sufficient for entire user base any time. Highly recommended for the live month — $20 once is cheaper than the engineering hours to manage option A.

**Option C** (fallback provider): Brevo (300/day free). Wire as a second sender; primary fails → secondary tries. Code lives in `lib/utils/emailSender.ts`.

**Soft-degrade**:
- Flip `disable_email_digest`. In-app notifications remain primary.

### Vercel function timeout (10s)

Two known risks:
- **Yearbook ZIP export** — already capped at 200 students per request; admin must call multiple times for big batches. Documented.
- **Recomposite on scribble remove** — if the shirt has 100+ scribbles, Sharp recomposite may exceed. Mitigation: bypass recomposite (we render SVGs client-side anyway since migration 003); the per-scribble PNG / texture system is legacy.

**Fix**: confirm `app/api/scribble/remove/route.ts` does NOT call `recompositePanel` for SVG-mode shirts. (Audit item — track in checklist.)

## Admin dashboard requirements

Add a new section to `/admin` page:

```
SYSTEM HEALTH
─────────────────────────────────────
DB        ████████░░  72%  Yellow   [Trim notifications]  [View tables]
Storage   ███░░░░░░░  31%  Green
Realtime  ████░░░░░░  38%  Green
Resend    █████████░  92%  Critical  [Disable digest until tomorrow]
─────────────────────────────────────
Soft-degrade switches
[ ] disable_voice_notes
[ ] disable_realtime_presence
[ ] disable_realtime_broadcast
[ ] disable_email_digest        ← suggested
[ ] disable_new_signups
[ ] disable_scribble_writes
[ ] disable_head_uploads
[ ] disable_share_link_creation
```

Data sources:
- DB size: `select pg_database_size(current_database())` exposed via a tiny admin RPC.
- Storage size: Supabase Management API (`GET /v1/projects/{ref}/usage`).
- Realtime concurrent: Supabase realtime API or estimate from active sessions.
- Resend quota: Resend API `GET /emails` paginated count for today.

Cache the readings for 60 seconds; do not poll on every admin page load.

## Automatic actions (cron)

A single daily cron `app/api/cron/system-health/route.ts` runs at 02:00 local time and:

1. Reads each resource's current usage.
2. If any is in red, flips the suggested switches automatically and emails the admin.
3. Logs the run + actions taken into `system_health_runs` (table created in migration 010).

This ensures we degrade gracefully even if no human is awake.

## Upgrade path with costs

If any resource is consistently > 80% with growth headroom < 48 hours:

| Tier | Cost | What you get |
|---|---|---|
| Supabase Pro | $25/mo | 8 GB DB, 100 GB storage, 500 realtime, daily backups, log retention |
| Vercel Pro | $20/mo | 60s function timeout, more bandwidth, team features |
| Resend Pro | $20/mo | 50,000 emails / month |
| **Total worst case** | **$65/mo** | All ceilings raised by 5–50× |

Decision tree at orange-state:
1. Estimate days remaining in the live window.
2. If > 14 days: degrade hard, save the upgrade for if degradation hurts UX.
3. If 1–14 days: **upgrade the affected resource only**. Other free tiers stay.
4. If post-launch: degrade everything, no upgrade.

## What not to do

- Do **not** add a payment screen for users to fund upgrades. The product is a gift to one cohort.
- Do **not** silently degrade without surfacing it to admin or affected users ("Voice notes are paused — check back later").
- Do **not** add features that are not in doc 08 just because there is headroom. Headroom is for safety, not feature creep.

## Pre-launch checklist (delta from doc 05)

- [ ] Migration 010 applied with `platform_settings` flag rows
- [ ] Admin "System health" page built and reachable
- [ ] `system-health` cron registered in `vercel.json`
- [ ] `lib/utils/platformFlags.ts` helper that caches flag reads for 60s
- [ ] Every flag has a corresponding route check (audit pass)
- [ ] Resend account upgraded to Pro **or** weekly staggered + Brevo fallback wired
- [ ] Default avatar head bank in `public/heads/default/` (8 stylised heads — used when `disable_head_uploads` is on)
