# Scribbl — Product Strategy & Improvement Blueprint

> Three-lens analysis: **Senior PM** (what to build, what to cut) × **Product Designer** (how it should feel) × **Senior Developer** (how to make it survive 2,000 users on free infra)

---

## Part 1: The Shirt & Body — Getting the Visual Identity Right

### The Current Problem

The `AvatarDisplay.tsx` component is actually **well-engineered** — it already renders a CSS-only upper body with parametric proportions (different `shoulder`, `torso`, `sleeve`, `neck` ratios per body variant). The `ShirtShell.tsx` is even more sophisticated — it uses `clipPath: polygon(...)` to create a realistic neckline cut, has inset shadows for fabric depth, and a radial gradient for chest highlight.

**But** the placeholder SVGs in `/bodies/` are completely disconnected from this system. The CSS-based avatar is the actual working version. The SVGs are orphaned.

### Shirt Shape Anatomy — How It Should Work

![Shirt anatomy reference](shirt_anatomy_diagram_1778918571748.png)

The shirt needs **5 distinct visual layers**, bottom-to-top:

```
┌─────────────────────────────┐
│  Layer 5: HEAD (circle)     │  ← AI-generated, circle-cropped
│           ↓ overlaps neck   │
│  Layer 4: NECK              │  ← Skin-toned connector
│  Layer 3: SHOULDER BAR      │  ← Same color as shirt, wider than torso
│  Layer 2: SLEEVES (×2)      │  ← Angled capsules, frame the shirt
│  Layer 1: SHIRT TORSO       │  ← THE scribble canvas zone
│           (clipPath neckline)│
└─────────────────────────────┘
```

#### The Key Design Decisions

**1. The torso IS the canvas — arms are NOT.**

The shirt torso (400×600 at logical resolution) is the only scribble-able surface. Arms/sleeves are decorative framing elements that sit at the same z-level but outside the canvas bounds. This is already how `ShirtShell.tsx` works — the sleeves are absolute-positioned divs outside the main `clipPath` surface.

**2. "Body styles" = different proportions, NOT different SVGs.**

Your current `BODY_VARIANTS` approach is correct:

```typescript
M1: { shoulder: 0.86, torso: 0.58, sleeve: 0.23, neck: 0.20 }  // average
M2: { shoulder: 0.92, torso: 0.62, sleeve: 0.25, neck: 0.22 }  // broad
F1: { shoulder: 0.78, torso: 0.52, sleeve: 0.20, neck: 0.18 }  // slim
```

What makes them **look** different isn't the SVG file — it's these ratios applied to the CSS rendering. The differentiation should come from:

| Differentiator | How |
|---|---|
| Shoulder width | `variant.shoulder` ratio (already works) |
| Torso taper | Add a `taperBottom` ratio — wider shoulders + narrower hem = athletic |
| Sleeve angle | Currently hardcoded at `±7°` — vary it (casual ±5°, sporty ±12°) |
| Neckline style | Vary the `clipPath` polygon — crew neck vs V-neck vs scoop |
| Sleeve length | Short vs cap vs 3/4 (varies the `height` of sleeve divs) |

> [!TIP]
> **Recommendation:** Drop the `/bodies/*.svg` files entirely. They're dead weight. The CSS-rendered avatar (`AvatarDisplay.tsx`) is the actual system and it's much more flexible. Just enhance the variant parameters.

**3. How to handle the arms — keep it simple.**

Arms should NOT extend below the shirt hem. The avatar is **upper-body only** — think LinkedIn profile picture cropping. The current implementation clips at the waist, which is correct. The sleeves provide enough "arm" visual:

```
Current ShirtShell sleeve positioning:
├── Left sleeve:  left-[4%], top-[26%], w-[30%], h-[17%], rotate(-9deg)
├── Right sleeve: right-[4%], top-[26%], w-[30%], h-[17%], rotate(9deg)
```

These rounded capsule shapes already look like sleeves on a torso. To make them feel more "human":
- Add a subtle skin-toned **hand circle** peeking out at the bottom of each sleeve
- Or add a subtle **arm curve** — a skin-toned half-ellipse below each sleeve
- Keep it minimal — the shirt is the star, not the anatomy

### AI Head Generation — Prompt Strategy

![AI head style reference](ai_head_style_guide_1778918597464.png)

The key to consistency is **one locked prompt** that every user runs on ChatGPT/Ideogram/any generator. Here's the system:

#### Recommended Prompt Template (for users to copy-paste)

```
Create a digital portrait illustration of me in this exact style:
- Clean, flat cel-shaded illustration (like Notion/Slack avatar style)
- Warm, soft color palette with gentle shading
- Slight 3/4 angle, facing slightly left
- Friendly, approachable expression with a soft smile
- Simple geometric shapes, no photorealism
- NO background — transparent or solid white
- Head and neck only, centered in frame
- Consistent round head shape proportions
- Minimal detail, clean outlines

[Attach your selfie as reference]
```

#### Technical Enforcement (in the app)

Your `HeadCropUpload.tsx` already handles the cropping to a circle. To push consistency further:

1. **Circle mask in the upload UI** — show the crop preview as a circle with the avatar body behind it so users can see the result live
2. **Auto-resize to 512×512** — already happening in the Sharp pipeline
3. **WebP conversion** — already happening
4. **Aspect ratio enforcement** — reject images that are too wide/tall (already cropped to square)

#### Front vs. Back Head

The back head is a nice detail but adds friction. Consider:
- Making it **optional** (currently it seems to be)
- Auto-generating a blurred/mirrored version of the front head as default
- Or just using the front head with a `blur(0.4px) opacity(0.7)` filter for the back (which `AvatarDisplay` already does!)

> [!NOTE]
> The back head upload is effectively unnecessary UX friction. The current fallback behavior (front head with blur) already works perfectly. Consider removing the back upload from onboarding entirely and moving it to Settings as an optional "power user" feature.

---

## Part 2: Error Handling, Edge States & Failure Reporting

### Error Taxonomy — Every Failure Mode Mapped

#### 🔴 Network & Infrastructure Failures

| Scenario | Where | Current Handling | Should Be |
|---|---|---|---|
| Supabase unreachable | Any page load | Unhandled — blank page | `error.tsx` boundary with "Connection lost, retrying..." + auto-retry |
| Auth session expired mid-action | API routes | 401 → redirects to login | Toast: "Session expired" + save draft to localStorage |
| Realtime channel disconnects | ShirtView | `isConnected` flag exists but no recovery | Auto-reconnect with exponential backoff (Supabase SDK does this, but surface it in UI) |
| Storage upload fails | Head upload, scribble save | Some 500 handling | Retry button + "Your drawing is saved locally, tap to retry upload" |
| Rate limited by Supabase | Any API call | Unhandled | Queue requests, show "Too many requests, waiting..." toast |

#### 🟠 User Action Failures

| Scenario | Where | Current Handling | Should Be |
|---|---|---|---|
| Scribble placement collision | ShirtView → save | API returns error code | Highlight conflicting area, suggest nearby open spot |
| Drawing too small (< 40px) | DrawingCanvas → export | `clampRect` enforces 40px min | Toast: "Your mark is too small — make it bigger" |
| Drawing too large (> 300px) | DrawingCanvas → export | Clamped server-side | Pre-validate client-side, show bounding box constraints |
| Self-scribble attempt | Profile page | API returns 403 | Hide the "Sign now" button entirely on own profile (already done via `isOwner`) |
| Shirt locked | Profile page | API returns 403 | Show lock badge on shirt, "This shirt is locked" message |
| Shirt at 100% capacity | Profile page | `OCCUPANCY_FULL_THRESHOLD` exists | Show "Shirt is full" overlay, suggest viewing yearbook instead |
| Report own scribble | ShirtView | Not prevented client-side | API should return 400; client should hide report on own scribbles |
| Duplicate report | ShirtView | API is idempotent | UI already tracks `reportedIds` ✅ |
| Join full group (50 members) | Groups | API returns error | Show member count prominently, grey out "Join" when full |
| Create 6th group (cap 5) | Groups | API returns error | Show group count: "4 of 5 groups used", disable create at limit |

#### 🟡 Data Edge Cases

| Scenario | Where | Risk |
|---|---|---|
| User deleted mid-session | Any page | Joins with `users` table will fail — need null checks |
| Scribble has no `canvas_svg` | ShirtView rendering | Renders invisible — should show placeholder "✏️" icon |
| Academic groups/programs empty | Onboarding step 1 | Dropdowns show "Select..." with no options — need empty state message |
| 2,000 users load explore page | Explore | All users fetched at once? — need pagination |
| Malformed SVG in scribble | ShirtView rendering | Could break layout — SVG sanitization exists but check XSS |

### Error Reporting System — How to Get Alerted

Since you're on free infra, you can't use Sentry or paid error tracking. Here's a zero-cost approach:

**Option A: Supabase Error Table (Recommended)**

```sql
create table if not exists error_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id),
  route       text not null,        -- '/api/scribble/place' or '/dashboard'
  error_code  text,                 -- 'COLLISION', 'NETWORK', etc.
  message     text not null,
  metadata    jsonb,                -- { shirt_id, panel, browser, etc. }
  created_at  timestamptz not null default now()
);
```

- Insert from API routes on every caught error
- Insert from client via a `POST /api/errors/report` endpoint
- Build a simple admin page: `/admin/errors` — table with filters by route/code/date
- Add a counter badge to the admin nav: "12 new errors"

**Option B: Client-side Error Boundary with Logging**

Create a global `ErrorBoundary` component that:
1. Catches React render errors
2. Shows a friendly "Something went wrong" UI with a retry button
3. Sends the error to `/api/errors/report` in the background
4. Shows the error ID to the user so they can report it to you

### Loading Skeletons — Where to Add Them

Every route group needs a `loading.tsx`:

| Route | Skeleton Design |
|---|---|
| `/dashboard` | Shimmer: avatar card (wide rect), stats strip (3 small rects), queue grid (2×4 circles) |
| `/profile/[userId]` | Shimmer: shirt shell outline + avatar circle, stats below |
| `/explore` | Shimmer: search bar + 4×3 grid of avatar circles with name lines |
| `/groups` | Shimmer: 2-column list of card rectangles |
| `/settings` | Shimmer: form fields (5 stacked rectangles) |
| `/admin/*` | Shimmer: table with header + 5 rows |
| `/yearbook` | Shimmer: 3×3 grid of yearbook card shapes |

> [!TIP]
> Build one `Skeleton` utility component with variants: `line`, `circle`, `rect`, `card`. Then compose them in each `loading.tsx`. Keep shimmer animation consistent — a single `@keyframes shimmer` in `globals.css`.

---

## Part 3: Interactivity & Quality of Life Improvements

### 🏆 High-Impact Ideas (PM Perspective: "Ship these")

#### 1. **"Sign Back" Loop — The Viral Mechanic**

This already partially exists in `ActivityLog` with the "Sign back" button. But it needs to be **the primary engagement loop**, not a sidebar widget.

**Enhancement:**
- When someone scribbles on your shirt → you get a push notification (currently just bell icon)
- The notification links directly to THEIR profile with a pre-prompted "Sign back ✏️" button
- After signing back → show a "You signed each other! 🤝" celebration moment
- Track "mutual scribbles" as a stat on profiles: "12 mutual signs"

**Why:** This creates the viral loop that makes 2,000 users actually use the product. Without it, it's a one-way writing wall.

#### 2. **Scribble Previews in Activity Feed (Already Built!)**

The `ActivityLog` component already renders scribble SVGs as thumbnails. This is great. Make it more prominent:
- Show the SVG thumbnail larger (current is 56px — go to 80px)
- Add a subtle border matching the scribble's primary color
- Tap/hover to see a zoomed preview modal

#### 3. **Quick-React Emoji Responses (Already Built!)**

The `scribble_reactions` table and `ActivityLog` reaction UI already exist. This is one of the best features — lean into it:
- Show total reactions on the profile page: "Your shirt got 47 reactions"
- Add a "Most loved scribble" highlight card on dashboard
- When you react → the shirt owner gets a notification (currently doesn't happen)

#### 4. **"Signing Streak" Counter**

Track consecutive days a user signs someone's shirt. Show it as a badge:
- 🔥 3-day streak
- ⚡ 7-day streak  
- 👑 14-day signing streak

**Why:** Gamification drives daily engagement. For a one-month farewell window, streaks keep people coming back.

#### 5. **"Who Hasn't Signed Your Shirt Yet" Nudge**

On the dashboard, show a section: "These batchmates haven't signed your shirt yet" with their avatars and a "Send invite" button that copies a personalized link.

**Why:** Reduces the awkwardness of asking for signatures. The app does the nudging.

### 🎯 Medium-Impact Ideas (Designer Perspective: "Make it feel alive")

#### 6. **Live Presence Indicator on Profile Pages**

The `useShirtChannel` already tracks `viewerCount`. Surface it better:
- "3 people are viewing this shirt right now" banner
- Subtle animated dots around the shirt edge showing where other viewers are looking
- Show their names/avatars in a floating pill

#### 7. **Confetti/Celebration Moments**

You have `canvas-confetti` installed. Trigger it on:
- First scribble received
- 10th scribble received
- Getting a "sign back" mutual
- Completing onboarding (already done ✅)
- All batchmates have signed your shirt

#### 8. **Haptic/Sound Micro-Feedback**

For mobile:
- Light haptic on tool selection
- Subtle vibration on scribble save
- "Pop" sound on reaction tap

Implementation: `navigator.vibrate(50)` + HTML5 Audio with tiny `.mp3` files (< 5KB each). All optional/disableable.

#### 9. **Toast Notification System**

Currently errors show as inline `<p>` elements below the shirt. Build a global toast system:
- Slides in from top-right
- Auto-dismisses after 4 seconds
- Color-coded: green (success), red (error), amber (warning), blue (info)
- Stacks if multiple toasts fire

#### 10. **"Your Shirt Link" QR Code**

On the dashboard, generate a QR code for your profile URL. Perfect for:
- Farewell day: hold up your phone, friends scan and sign
- Print it on an actual sticker

Implementation: Pure JS QR library (`qrcode` npm package, ~12KB).

### 💡 Nice-to-Have Ideas (Developer Perspective: "If there's time")

#### 11. **Offline Draft Support**

Save the current drawing to `localStorage` if the network drops. Show a "Draft saved locally" indicator. Auto-upload when connection returns.

#### 12. **"Time Capsule" Mode**

After the farewell window closes, lock all shirts and generate a yearbook PDF automatically. Add a countdown timer on the dashboard: "4 days, 7 hours until extraction."

#### 13. **Anonymous Scribble Option**

Let scribblers choose to be anonymous. Show "Someone from [batch]" instead of their name. Reveals identity after the farewell window closes.

#### 14. **Batch Leaderboard**

"Most scribbled shirt in CS 2025" — shows top 5 most signed shirts per batch. Drives friendly competition.

---

## Part 4: What to CUT — Things That Don't Add Value

### 🗑️ Remove or Deprioritize

| Feature | Verdict | Why |
|---|---|---|
| **GhostBoxCanvas** (placement mode) | ⚠️ Rethink | The direct drawing mode in ShirtView is simpler and works. Ghost box placement adds complexity. The "Find open spot" buttons in direct mode already solve the placement problem. |
| **Multi-shirt UI** (Shirt 2, 3...) | ❌ Cut for v1 | Adds DB + UI complexity. One shirt per person is enough for 2,000 users. Keep the schema but don't build the UI. |
| **Yearbook PDF export** | ⏸️ Post-launch | The PNG export works. PDF batch is a "nice to have" that's CPU-intensive on free tier. Ship PNG download first. |
| **"Sleeve" panel** | ⚠️ Simplify | Three panels (front/back/sleeves) fragment the signing experience. Consider front + back only — two clear surfaces. |
| **Arrow tool in DrawingCanvas** | ❌ Cut | Lines work fine. Arrows add complexity for zero user value in a farewell context. |
| **Dev test link on login page** | ❌ Hide in prod | Env-flag it: `{process.env.DEV_AUTH_BYPASS === 'true' && <Link>...}` |

### ✅ Keep & Enhance

| Feature | Why |
|---|---|
| Reactions (emoji responses) | Already built, drives engagement loops |
| Activity feed | Shows the shirt is alive, encourages sign-backs |
| Friend groups | Useful for batch organization, already built |
| Notification bell | Core to the sign-back loop |
| Admin moderation | Essential for content safety at 2,000 users |
| Scribble request/approval | Important for privacy-conscious users |

---

## Part 5: Performance on Free-Tier Infra

### The Constraints

| Resource | Supabase Free | Vercel Hobby | Risk at 2K Users |
|---|---|---|---|
| DB size | 500 MB | n/a | Low (text + JSON is small) |
| Storage | 1 GB | n/a | 🟠 Medium — 2K users × ~100KB avg head images = ~200MB. Scribble SVGs are in DB, not storage. |
| Bandwidth | 2 GB/mo | 100 GB/mo | 🟠 Medium — depends on image loading patterns |
| Realtime connections | 200 concurrent | n/a | 🔴 High on farewell day — could hit this if 200+ people online simultaneously |
| Serverless timeout | n/a | 10s (Hobby) | 🔴 High — yearbook ZIP export will timeout. Batch it or skip for v1 |
| Edge function invocations | 500K/mo | n/a | ✅ Fine |

### Performance Optimizations (Priority Order)

#### 1. **SVG-Based Scribbles — Your Best Architecture Decision**

The switch to `canvas_svg` instead of `canvas_png_url` is **brilliant** for performance:
- SVGs are ~1-5KB vs PNGs at ~30-80KB
- SVGs are stored in the DB (no storage bucket hits)
- SVGs render client-side (no server compositing needed for display)
- The `canvas_png_url` column is already deprecated

> [!IMPORTANT]
> Make sure the recomposite pipeline (`lib/utils/recomposite.ts`) uses SVG rendering instead of downloading PNGs. If it still downloads per-scribble PNGs, that's a latency and bandwidth bottleneck.

#### 2. **Static Generation Where Possible**

Currently every page is `force-dynamic`. Some pages can be statically generated or cached:

| Page | Can Be Static? | Strategy |
|---|---|---|
| Login | ✅ Yes | Remove `force-dynamic`, it's a client component anyway |
| Onboarding | ✅ Yes | Client-side data fetching, no server data |
| Dashboard | ❌ No | User-specific data |
| Profile | ⏳ ISR | `revalidate: 60` — profiles don't change every second |
| Explore | ⏳ ISR | `revalidate: 300` — 5-minute stale data is fine for browse |
| Admin pages | ❌ No | Needs real-time data |

#### 3. **Image Optimization Wins**

- Add `loading="eager"` to the main avatar/shirt images (LCP fix — already flagged in error log)
- Add proper `sizes` props to all `<Image>` components (missing on some)
- Use `quality={75}` on WebP outputs from Sharp (reduce 30-40% size)
- Lazy-load avatar images in grid views (explore, dashboard queue)

#### 4. **Bundle Size Reduction**

Fabric.js is the heaviest dependency (~300KB gzipped). Currently it's dynamically imported in `DrawingCanvas.tsx` via `import('fabric')` which is great. Make sure:
- Fabric is ONLY imported on profile pages (where drawing happens)
- The dashboard, explore, and settings pages never trigger a Fabric import
- Consider code-splitting the `ShirtView` component with `next/dynamic`

#### 5. **Supabase Query Optimization**

The dashboard page makes **8+ sequential Supabase queries**. Batch where possible:

```typescript
// Current: 8 awaits in sequence
const [profile, shirt] = await Promise.all([...])  // ✅ Already parallel
const scribbleCount = await ...  // ❌ Sequential
const onlineBatch = await ...    // ❌ Sequential
const signingQueue = await ...   // ❌ Sequential
```

**Fix:** Wrap ALL independent queries in `Promise.all()`:

```typescript
const [profile, shirt, scribbleCount, onlineBatch, signingQueue, settings] = 
  await Promise.all([...6 queries...])
```

This alone could cut dashboard load time by 50-70%.

#### 6. **Realtime Connection Management**

The `useShirtChannel` hook creates a Supabase client on every render. Fix:
- Create the client once at the component level (or module level)
- Unsubscribe from channels when leaving the profile page
- Don't open realtime channels on the dashboard (it doesn't need live shirt updates)

#### 7. **Rate Limiting (Client-Side)**

Without server-side rate limiting on free tier, add client-side throttling:
- Debounce the scribble save button (prevent double-click)
- Throttle reaction API calls (max 1 per second)
- Debounce the explore search input (already standard practice)

---

## Part 6: The UI Layout — Before You Skin It

### Current Layout Assessment

Your layout is actually solid for functionality. Before skinning, nail these **layout-level** decisions:

#### Navigation Architecture

```
Current:
  Nav: [Logo] [Explore] [Groups] [🔔] [Avatar]
  
Recommendation:
  Desktop: Top nav (keep current)
  Mobile:  Bottom tab bar — [Home] [Explore] [✏️ Sign] [Groups] [Me]
```

The **center "Sign" button** on mobile should be the primary CTA — it opens the explore page filtered to show "shirts you haven't signed yet."

#### Page Hierarchy

```
Priority 1 (daily use):  Dashboard, Profile/ShirtView
Priority 2 (weekly):     Explore, Groups
Priority 3 (one-time):   Settings, Onboarding
Priority 4 (admin):      Admin panel (keep hidden)
```

#### The Dashboard Should Be a Feed, Not a Control Panel

Currently the dashboard is stat-heavy (cards, numbers, checklists). Students don't care about "avg. filled 34%." They care about:
1. **"Who just signed my shirt?"** → Activity feed (already exists, move to top)
2. **"Whose shirts should I sign?"** → Signing queue (already exists, make it bigger)
3. **"Who's online right now?"** → Live avatars (already exists, keep compact)

The "Launch Checklist" card should only show during the first 24 hours after signup, then collapse to a dismissible banner.

---

## Summary: Prioritized Action List

### phase 1: Make It Work
1. Fix middleware (rename `proxy.ts`, change export)
2. Clean `.next` cache, verify all pages render
3. Parallelize dashboard Supabase queries
4. Add `loading.tsx` skeletons for all routes
5. Add `error.tsx` boundaries for all routes
6. Build error logging table + admin errors page
7. Add toast notification system

### phase  2: Make It Feel Right
8. Enhance body variants (neckline, taper, sleeve angle) — no SVGs needed
9. Write the AI head prompt template, add it to onboarding step 2
10. Implement "Sign back" notification loop
11. Add confetti celebrations for milestones
12. Client-side draft saving (localStorage)

### phase 3: Make It Fast
13. ISR on Profile + Explore pages
14. Dynamic import ShirtView (code-split Fabric.js)
15. Add proper `sizes` + `loading="eager"` to all images
16. Client-side rate limiting / throttling
17. Bundle audit + tree shaking review

### phase 4: Ship It
18. Deploy to Vercel
19. End-to-end test with 5-10 real users
20. Fix edge cases found in testing
21. Set up admin account, seed academic structure
22. Launch 🚀
