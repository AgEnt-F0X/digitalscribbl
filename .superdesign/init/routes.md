# Routes

App Router surface map for **Scribbl** (Next.js 16.2.6, App Router).
Route handlers live in `app/api/**/route.ts` **plus one at `app/auth/callback/route.ts`**
(not under `/api`).

---

## Page routes (24)

`loading` / `error` columns reflect real sibling files only. "inherits" means the nearest
ancestor segment supplies it (`app/loading.tsx` + `app/error.tsx` exist at the root).

| URL | File | `loading.tsx` | `error.tsx` | Renders |
|---|---|---|---|---|
| `/` | `app/page.tsx` | inherits (`app/loading.tsx`) | inherits (`app/error.tsx`) | Public landing: hero + feature copy + CTA, `PlaceBackground` (alwaysVivid) + `DriftingDoodles`. Amber CTAs. `force-dynamic`. |
| `/login` | `app/login/page.tsx` | — | — | Email sign-in gate; `Whiteboard` (a-frame) hero, `InkUnderline` inputs, `PencilLoader` submit state. |
| `/onboarding` | `app/onboarding/page.tsx` | ✅ | ✅ | 3-step client onboarding: name/photo → enrollment lookup → batch; `PlaceBackground` + `DriftingDoodles`, amber primary CTA. |
| `/onboarding/avatar` | `app/onboarding/avatar/page.tsx` | — | — | Avatar builder; mounts `AvatarOnboardingFlow`. |
| `/onboarding/guest` | `app/onboarding/guest/page.tsx` | — | — | Guest-view explainer panel; redirects verified non-guests to `/dashboard`. |
| `/dashboard` | `app/dashboard/page.tsx` | ✅ | ✅ | Signature page: own shirt + `ApprovalInbox` + `ActivityLog` + `HeroStickerNotes` hero + `ThankYouMessagePopup` + `ShareButton`. |
| `/explore` | `app/explore/page.tsx` | ✅ | ✅ | Searchable shirt directory; `ExploreSearchField`, `Whiteboard` (black marker), filter chips. |
| `/groups` | `app/groups/page.tsx` | ✅ | ✅ | Friend-groups list + `CreateGroupForm` / `JoinGroupForm`. |
| `/groups/[groupId]` | `app/groups/[groupId]/page.tsx` | inherits | inherits | Group detail: `InviteLink`, `LeaveButton`, `RemoveMemberButton`, member avatars. `notFound()` on missing group / non-member. |
| `/groups/join/[token]` | `app/groups/join/[token]/page.tsx` | inherits | inherits | Server-side auto-join, then redirect to the group. No UI of its own. |
| `/profile/[userId]` | `app/profile/[userId]/page.tsx` | ✅ | ✅ | Public signature page: `ShirtViewLoader` (dynamic `ShirtView`), `HeroStickerNotes`, `ActivityLog`, `ReportUserButton`, `ShareButton`. |
| `/activity` | `app/activity/page.tsx` | — | — | Notification timeline bucketed Today / Yesterday / Earlier with `AsteriskDivider`. |
| `/settings` | `app/settings/page.tsx` | ✅ | ✅ | Face photos (`HeadUpload`→`HeadCropUpload`), `ProfileForm`→`ShirtAccessPanel`. |
| `/yearbook` | `app/yearbook/page.tsx` | ✅ | ✅ | Yearbook grid of every shirt; `YearbookControls` (batch filter) + `ExportRequestForm`. |
| `/shirts/[shirtId]/scribble` | `app/shirts/[shirtId]/scribble/page.tsx` | ✅ | ✅ | Full-bleed Fabric signing studio; mounts `ScribbleStudio`. `?side=front\|back`. |
| `/admin` | `app/admin/page.tsx` | ✅ (`app/admin/loading.tsx`) | ✅ (`app/admin/error.tsx`) | Admin dashboard; `ToggleScribbling`, `SetDeadline`. |
| `/admin/users` | `app/admin/users/page.tsx` | inherits | inherits | User table with total count + `UserActions`. |
| `/admin/groups` | `app/admin/groups/page.tsx` | inherits | inherits | "Groups and batches" admin table. |
| `/admin/errors` | `app/admin/errors/page.tsx` | inherits | inherits | Error-log viewer (admin). |
| `/admin/moderation` | `app/admin/moderation/page.tsx` | inherits | inherits | Moderation queue; `ModerationAction`, `UserReportAction`. |
| `/admin/yearbook` | `app/admin/yearbook/page.tsx` | inherits | inherits | Yearbook admin: `BatchSelect`, `ExportRequestActions`. |
| `/dev/ia-map` | `app/dev/ia-map/page.tsx` | — | — | Dev tool: interactive information-architecture map (`InteractiveIAMap`). |
| `/dev/test-users` | `app/dev/test-users/page.tsx` | — | — | Dev tool: local test-user switcher (gated by env flag). |
| `/dev/sunlit-lawn` | `app/dev/sunlit-lawn/page.tsx` | — | — | Dev tool: Sunlit Lawn theme demo (`SunlitLawnDemo`). |

**Loading/error file inventory (20 files):** root `loading.tsx` + `error.tsx`; then
`dashboard/`, `explore/`, `yearbook/`, `settings/`, `onboarding/`, `groups/`, `admin/`,
`profile/[userId]/`, `shirts/[shirtId]/scribble/` each have **both** `loading.tsx` and
`error.tsx`. Routes with no own boundary: `/login`, `/activity`, `/onboarding/avatar`,
`/onboarding/guest`, `/groups/[groupId]`, `/groups/join/[token]`, and the three `/dev/*`
tools (they fall back to the nearest ancestor boundary).

---

## Route handlers

| Path | Methods | Purpose |
|---|---|---|
| `/auth/callback` | `GET` | Supabase OAuth callback → account-kind check, platform flags, redirect. **Lives at `app/auth/callback/route.ts`, not under `/api`.** |
| `/api/auth/sync-user` | `POST` | Upserts the Supabase auth user into `users` with account kind + email-domain gate. |
| `/api/errors/report` | `POST` | Client + `error.tsx` error sink (`/api/errors/report`); stores route, message, digest, UA. |
| `/api/onboarding/lookup` | `POST` | Enrollment-number → program/batch roster lookup. Rate-limited. |
| `/api/onboarding/complete` | `POST` | Finalizes onboarding; re-verifies roster pairing server-side. |
| `/api/avatar/config` | `POST` | Validates + stores `UserAvatarConfig` (preset, skin tone, transforms). |
| `/api/avatar/upload-head` | `POST` | Uploads a face photo to the heads bucket; size/dimension caps, rate-limited. |
| `/api/avatar/export` | `GET` | Renders an avatar/profile-card image; gated by `canExportProfileCard`. |
| `/api/scribble/place` | `POST` | Places a scribble: SVG sanitize, collision occupancy, phase + access + flag gates. |
| `/api/scribble/react` | `POST` | Toggles an emoji reaction on a scribble. |
| `/api/scribble/approve` | `POST` | Owner approves/rejects a `scribble_pending_approval` decision. |
| `/api/scribble/remove` | `POST` | Deletes a scribble and recomputes occupancy. |
| `/api/scribble/report` | `POST` | Rate-limited user report against a scribble. |
| `/api/scribble/voice` | `POST` | Records a voice note to the textures bucket. |
| `/api/shirt/access` | `PATCH` | Updates shirt visibility (`SHIRT_VISIBILITIES`). |
| `/api/shirt/lock` | `POST` | Locks a shirt against further signing. |
| `/api/shirt/release-box` | `POST` | Releases a locked shirt back into circulation. |
| `/api/shirt/social-notes` | `POST` | Posts a sticker note / reaction around the profile. |
| `/api/groups/create` | `POST` | Creates a friend group and returns an invite token. |
| `/api/groups/join` | `POST` | Joins a group by invite token. |
| `/api/groups/leave` | `POST` | Leaves a group. |
| `/api/groups/remove-member` | `POST` | Admin-of-group removes a member. |
| `/api/settings/update` | `PATCH` | Persists profile settings. |
| `/api/users/report` | `POST` | Safety report against a user; reason normalized. |
| `/api/yearbook/grid` | `GET` | Yearbook grid data (batch/panel filters). |
| `/api/yearbook/export` | `GET` | Server-side high-resolution yearbook export. |
| `/api/export-requests` | `POST`, `PATCH` | Manual export request intake + admin decision. |
| `/api/email/digest` | `POST` | Sends the periodic email digest (admin-gated). |
| `/api/admin/users` | `PATCH` | Admin user mutation; writes an audit log entry. |
| `/api/admin/settings` | `PATCH` | Admin platform settings; invalidates phase + platform-flag caches. |
| `/api/admin/errors` | `GET`, `PATCH` | Lists error rows; resolves/acknowledges them. |
| `/api/admin/moderation` | `POST`, `PATCH` | Moderation queue: overlap detection + decide. |

(31 `app/api/**/route.ts` files + the 1 `/auth/callback` handler = 32 route handlers.)

---

## Middleware — `proxy.ts` (repo root)

Next 16's middleware slot is **`proxy.ts`** (not `middleware.ts`); there is no `middleware.ts`
in this repo. Exported handler is `proxy()`.

**Check order** (each redirects, never silently allows):

1. **Sign-in** — not authed + not a public route → `/login?next=<path>`
2. **Role gate** — profile row drives role:
   - `is_deleted` → `supabase.auth.signOut()` then `/login?reason=deleted`
   - `suspended` → `/login?reason=suspended`
   - admin-only path + non-admin → `/dashboard?reason=admin_only`
   - guest on a non-guest-allowed path → `/guest`
3. **Onboarding** — verified student with `onboarding_completed !== true` → `/onboarding`

Also: a dev-auth bypass (`isDevAuthBypassEnabled` + slot cookies from `lib/auth/dev`) can
substitute a service-role client for the profile lookup; profile checks are skipped for
`/onboarding`, `/api/`, `/auth/`.

**Route matcher**

```
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|favicon.svg|bodies|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
]
```

i.e. everything except Next internals, static asset extensions, and the `bodies` asset dir.