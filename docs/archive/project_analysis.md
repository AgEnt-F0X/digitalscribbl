# 🔍 Scribbl — Full Project Audit

> **Project:** Digital farewell platform for final-year university students.
> **Concept:** Each student gets a virtual shirt. Friends scribble on it using a Fabric.js canvas with live multiplayer (Supabase Realtime). Think Figma for shirt-signing.
> **Target:** 500–2,000 students, one-month farewell window.

---

## 1. Tech Stack Summary

| Layer | Choice | Status |
|---|---|---|
| Framework | Next.js **16.2.6** (App Router, TypeScript) | ⚠️ Mismatch — PLANNER says "14", `package.json` has `^16.2.6` |
| Styling | Tailwind CSS v3 | ✅ Configured |
| Canvas | Fabric.js 7.x | ✅ Installed |
| Animation | Framer Motion + canvas-confetti | ✅ Installed |
| Backend / Auth | Supabase (Postgres + Auth + Realtime + Storage) | ✅ Connected |
| Image Processing | Sharp (Node.js API routes) | ✅ Installed |
| Deployment Target | Vercel | Not yet deployed |

---

## 2. What Currently **Works** (on paper)

The codebase has **a lot of code written** across 6 sessions. TypeScript compiles with **0 errors** (`tsc --noEmit` passes). Here's what exists:

| Feature | Files Exist | Wired Up |
|---|---|---|
| Login (Google OAuth) | ✅ | ✅ (with dev bypass) |
| Auth callback + domain check | ✅ | ⚠️ No middleware |
| 3-step onboarding | ✅ | ✅ |
| Avatar display (body SVG + head photo) | ✅ | ✅ |
| Head upload + crop (Sharp resize → WebP) | ✅ | ✅ |
| Dashboard (stats, queue, activity log) | ✅ | ✅ |
| Profile page + shirt viewer | ✅ | ✅ |
| Scribble canvas (Fabric.js, pen/text/shapes) | ✅ | ✅ |
| Scribble placement API (SVG-based, direct mode) | ✅ | ✅ |
| Scribble remove + report | ✅ | ✅ |
| Scribble request/approval flow | ✅ | ✅ |
| Realtime channel (`useShirtChannel`) | ✅ | ✅ |
| Notification bell (DB-change subscription) | ✅ | ✅ |
| Explore page (search batch, browse users) | ✅ | ✅ |
| Friend groups (create/join/leave/invite link) | ✅ | ✅ |
| Settings page (profile, privacy, head re-upload) | ✅ | ✅ |
| Admin dashboard + moderation queue | ✅ | ✅ |
| Admin users page (search, suspend, promote) | ✅ | ✅ |
| Yearbook page + batch export ZIP | ✅ | ✅ |
| Dev auth bypass (multi-user local testing) | ✅ | ✅ |
| DB schema + RLS policies + seed | ✅ | ✅ |
| 6 unit tests | ✅ | ✅ |

---

## 3. What's **Critically Wrong** Right Now

### 🔴 CRITICAL — App won't even start cleanly

#### 3.1 Missing `middleware.ts` — Auth guard is completely inactive

The PLANNER says middleware exists (`middleware.ts ✅`), but **there is no `middleware.ts` in the project root.** There's a `proxy.ts` that contains what should be the middleware logic (auth guard + onboarding check), but it's **never imported by Next.js** because:

- Next.js requires the file be named exactly `middleware.ts` at the project root
- `proxy.ts` exports `proxy()` and `config`, but Next.js expects `export function middleware()`

**Impact:** **Anyone can access any page without logging in.** The auth guard, onboarding redirect, and session refresh are all dead code.

#### 3.2 Module resolution errors — Multiple pages crash at runtime

The error log ([next-dev.err.log](file:///d:/Downloads/Digital%20scribbl/next-dev.err.log)) is **~860 lines** of repeated `Module not found` errors:

| Missing Module | Pages Affected |
|---|---|
| `@/components/avatar/AvatarDisplay` | Dashboard, Profile, Explore, Settings |
| `@/components/shirt/ShirtView` | Profile |
| `@/components/scribble/GhostBoxCanvas` | ShirtView (transitive) |
| `@/components/scribble/DrawingCanvas` | ShirtView (transitive) |
| `./HeadUpload` | Settings |

**But the files DO exist on disk** at those exact paths (`components/avatar/AvatarDisplay.tsx`, etc.).

**Root cause likely:** The `.next` cache is stale from a prior Next.js version, OR the `@/` path alias isn't resolving at dev-server runtime despite TSC being happy. A clean restart (`rm -rf .next && npm run dev`) would likely fix this. But it means **nobody has successfully run and tested this app end-to-end recently.**

#### 3.3 `.env.local` committed to git with live credentials

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7JMn...
```

The `.env.local` file contains **real Supabase secrets** including the **service role key** (full admin access to the database). This file is in the working directory. While `.gitignore` includes `.env.local`, the file being present with real keys in a shared project folder is a security concern.

> [!CAUTION]
> **The service role key must be rotated** if this project directory has ever been shared, uploaded, or accessed by anyone else. That key grants full bypass of all RLS policies.

### 🟠 HIGH — Version Mismatch & React Compatibility

The `package.json` declares `"next": "^16.2.6"` and `"react": "^18.3.1"`. Next.js 16 may require React 19. The PLANNER doc says "Next.js 14" but the actual installed version is 16. This is a significant mismatch that likely causes runtime behavior differences from what was originally developed and tested.

---

## 4. What's **Wrong at a Design/UX Level**

### 4.1 Body SVGs are grey placeholder silhouettes

All 7 body SVGs (`m1.svg` through `f3.svg` + `placeholder.svg`) are **identical 829-byte grey rectangles** — generic rounded-rect silhouettes with no personality, no differentiation between body styles, and no visual appeal:

```xml
<rect x="120" y="140" width="160" height="220" rx="20" fill="#E5E7EB"/>
```

This is the **centerpiece visual element** of the entire product (it's what students see when they pick their avatar and view shirts). Shipping with these would make the app look unfinished.

### 4.2 No custom fonts loaded

The layout uses system fonts only (`system-ui`, `Georgia`). The Tailwind config references CSS variables (`--font-display`, `--font-body`, `--font-mono`) but `globals.css` just maps them to browser defaults. There are no Google Fonts or `@font-face` declarations. For a student-facing social product, typography is critical.

### 4.3 No loading states or skeleton screens

Pages are all server-rendered with `force-dynamic`. There are no `loading.tsx` files, no Suspense boundaries (except the login page), and no skeleton screens. On a slow Supabase free-tier connection, users will see blank white screens.

### 4.4 No error boundaries

No `error.tsx` files anywhere. If any server component throws (Supabase down, malformed data, etc.), users get the generic Next.js error page.

### 4.5 No mobile responsiveness testing

The dashboard uses `lg:grid-cols` but there's no evidence of mobile-first design testing. The scribble canvas (400×600 fixed dimensions) on a phone screen may be unusable without proper touch handling.

---

## 5. What's **Wrong at a Code Quality Level**

| Issue | Severity | Details |
|---|---|---|
| No middleware file | 🔴 CRITICAL | Auth guard is dead code |
| `proxy.ts` is orphaned | 🟠 HIGH | Contains the right logic, wrong filename + wrong export name |
| Hand-typed Supabase types | 🟡 MEDIUM | All joins need `as unknown as X` casts — fragile if schema changes |
| Supabase client recreated per render | 🟡 MEDIUM | In `useShirtChannel.ts` — causes GC pressure under load |
| Stale closure in `useShirtChannel` | 🟡 MEDIUM | `currentPanel` can go stale in broadcast callbacks |
| Race condition on placement | 🟡 MEDIUM | Two simultaneous placements can both pass collision check |
| No rate limiting on API routes | 🟡 MEDIUM | Any authenticated user can spam scribble placement |
| `canvas_png_url` column deprecated but still in schema | 🟢 LOW | Dead column, not harmful |
| Dev test link on login page | 🟡 MEDIUM | `/dev/test-users` link shown to all users in production |

---

## 6. What's **Missing for 2,000-User Launch**

### Must-Have (Blocking)

| # | Item | Effort |
|---|---|---|
| 1 | **Fix middleware** — rename `proxy.ts` → `middleware.ts`, change export name to `middleware` | 15 min |
| 2 | **Clean `.next` cache** and verify all pages render | 10 min |
| 3 | **Rotate Supabase service role key** if directory was shared | 5 min |
| 4 | **Design real body SVGs** (6 unique illustrated characters) | 4–8 hrs (art) |
| 5 | **Add `loading.tsx` skeletons** for Dashboard, Profile, Explore | 2 hrs |
| 6 | **Add `error.tsx` boundaries** for all route groups | 1 hr |
| 7 | **Remove dev test link from login page** in production | 5 min |
| 8 | **Add `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`** — currently blank (any email accepted) | 5 min |
| 9 | **End-to-end manual test** the full flow (login → onboard → scribble → remove → admin) | 3 hrs |
| 10 | **Run `npm audit`** and fix high-severity deps | 1 hr |

### Should-Have (Quality)

| # | Item | Effort |
|---|---|---|
| 11 | Load Google Fonts (Inter or similar) for body text | 30 min |
| 12 | Mobile responsiveness pass (especially canvas) | 4 hrs |
| 13 | Rate limiting on scribble/report/request APIs | 2 hrs |
| 14 | Notification bell — mark as read on click, not on open | 30 min |
| 15 | Supabase generated types (`supabase gen types`) instead of hand-typed | 1 hr |
| 16 | Add Playwright or Cypress smoke tests | 4 hrs |
| 17 | Environment-based dev link toggle (hide `/dev/test-users` in prod) | 15 min |

### Nice-to-Have (Polish)

| # | Item | Effort |
|---|---|---|
| 18 | Micro-animations (page transitions, card hover effects) | 2 hrs |
| 19 | Dark mode support | 3 hrs |
| 20 | PWA manifest + install prompt | 1 hr |
| 21 | Open Graph images per profile (for sharing) | 2 hrs |
| 22 | Arrow tool in DrawingCanvas (currently falls back to line) | 1 hr |

---

## 7. Shipability Verdict

```
┌─────────────────────────────────────────────────┐
│          SHIPABILITY SCORE: ~55%                │
│                                                 │
│  Code completeness  ████████████░░  ~85%        │
│  Actually runs      ████░░░░░░░░░░  ~30%        │
│  Visual polish      ███░░░░░░░░░░░  ~25%        │
│  Security           █████░░░░░░░░░  ~40%        │
│  Testing            ██░░░░░░░░░░░░  ~15%        │
│  Production ready   ████░░░░░░░░░░  ~30%        │
└─────────────────────────────────────────────────┘
```

### The Good
The **architecture is solid**. The DB schema is well-thought-out with proper RLS policies, the realtime channel design is smart (broadcast not DB for strokes), the permission model is flexible, and the feature set is genuinely complete on paper. Six sessions of focused work have produced a substantial amount of functional code.

### The Bad
The app **literally can't be navigated** right now due to module resolution errors and the missing middleware. The visual design is functional but not delightful — grey placeholder bodies, system fonts, no loading states. It feels like a well-architected backend with a first-draft frontend.

### The Path to Ship

> [!IMPORTANT]
> **Estimated effort to reach a shippable beta:** 2–3 focused days
>
> - **Day 1:** Fix middleware, clean cache, verify all pages render, fix security issues, add loading/error states
> - **Day 2:** Design or commission real body SVGs, add fonts, do a full mobile responsiveness pass
> - **Day 3:** End-to-end testing with 2+ users, fix edge cases, deploy to Vercel, test with real Google OAuth

The Supabase free tier should handle 2,000 total users (not concurrent). The main risk is **concurrent realtime connections** on farewell day — Supabase free allows 200 concurrent, which should be fine for ~50 simultaneous shirt viewers but could be tight if the entire batch logs in at once.
