# Page dependency trees

Recursive traces of **all local imports** (`@/…`, `./`, `../`) for 10 key routes.
`node_modules` packages (`next/*`, `react`, `lucide-react`, `framer-motion`, `date-fns`,
`fabric`, `@supabase/*`) are omitted. Shared component internals live in `components.md`;
the shell/nav internals live in `layouts.md`.

Legend: `→` dependency edge. Repeated subtrees (e.g. `Avatar`, `PlaceBackground`) are expanded
once per entry so each tree is self-contained.

---

## Entry: `app/page.tsx` (route `/`)

```
app/page.tsx
├── @/lib/auth/server → getServerAuthContext
├── @/components/place/PlaceBackground
│   ├── @/lib/hooks/useFirstVisit
│   ├── @/lib/hooks/usePrefersReducedMotion
│   ├── @/lib/hooks/useSlowConnection
│   └── @/lib/utils/cn
├── @/components/brand/DriftingDoodles
│   └── @/lib/utils/cn
└── @/components/brand/CountdownTimer            (framer-motion only)
```

No co-located page components. Boundary: inherits root `loading.tsx` / `error.tsx`.

---

## Entry: `app/dashboard/page.tsx` (route `/dashboard`)

```
app/dashboard/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/components/avatar/Avatar
│   ├── @/lib/utils/cn
│   ├── @/lib/utils/avatarResolve
│   ├── @/src/features/avatar/types
│   └── @/src/features/avatar/components/AvatarRenderer
│       ├── @/lib/utils/cn
│       ├── @/lib/utils/shirtTemplate
│       ├── @/lib/constants (SHIRT_H, SHIRT_W)
│       ├── ../data/avatarPresets → ./skinTones.ts → ../types.ts
│       ├── ../data/skinTones
│       └── ../types
├── @/components/notifications/NotificationBell
│   ├── @/lib/hooks/useNotifications
│   └── @/lib/utils/cn
├── @/components/nav/BottomNav
│   ├── @/lib/utils/cn
│   └── @/lib/hooks/useNotifications
├── @/components/activity/ActivityLog
│   ├── @/lib/utils/cn
│   ├── @/lib/utils/reactions
│   ├── @/lib/utils/actionCooldown
│   ├── @/lib/hooks/useToast
│   └── @/lib/utils/activity
├── @/src/features/dashboard/components/ThankYouMessagePopup   (leaf: react + lucide-react only)
├── @/components/place/PlaceBackground
│   ├── @/lib/hooks/useFirstVisit
│   ├── @/lib/hooks/usePrefersReducedMotion
│   ├── @/lib/hooks/useSlowConnection
│   └── @/lib/utils/cn
├── @/components/brand/Whiteboard → @/lib/utils/cn
├── @/components/brand/AvatarHalo → @/lib/utils/cn
├── @/components/brand/DriftingDoodles → @/lib/utils/cn
├── @/components/marginalia/AsteriskDivider → @/lib/utils/cn
├── @/components/marginalia/HandDrawnArrow → @/lib/utils/cn
├── @/components/marginalia/HeroStickerNotes   (no local imports; exports STICKER_TONES, HeroStickerNote, HeroStickerNotes, DEFAULT_HERO_NOTE_SLOTS)
├── ./ApprovalInbox
│   └── @/components/avatar/Avatar  (→ tree above)
├── ./ShareButton
│   ├── @/lib/hooks/useToast
│   └── @/lib/utils/cn
└── @/lib/constants (ROUTES, ONLINE_THRESHOLD_MS)
    @/lib/utils/siteUrl
    @/lib/utils/activity
    @/lib/utils/shirtLevel
```

Owns `loading.tsx` + `error.tsx`. Hand-rolled nav (bell + BottomNav) — no AppShell.

---

## Entry: `app/explore/page.tsx` (route `/explore`)

```
app/explore/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/components/avatar/Avatar  (→ AvatarRenderer subtree as in /dashboard)
├── @/components/notifications/NotificationBell
│   ├── @/lib/hooks/useNotifications
│   └── @/lib/utils/cn
├── @/components/nav/BottomNav
│   ├── @/lib/utils/cn
│   └── @/lib/hooks/useNotifications
├── @/components/place/PlaceBackground
│   ├── @/lib/hooks/useFirstVisit
│   ├── @/lib/hooks/usePrefersReducedMotion
│   ├── @/lib/hooks/useSlowConnection
│   └── @/lib/utils/cn
├── @/components/brand/Whiteboard → @/lib/utils/cn
├── @/components/brand/DriftingDoodles → @/lib/utils/cn
├── @/components/marginalia/AsteriskDivider → @/lib/utils/cn
├── @/components/marginalia/HandDrawnArrow → @/lib/utils/cn
├── ./ExploreSearchField
│   └── @/components/forms/InkUnderline → @/lib/utils/cn
└── @/lib/constants (ROUTES, ONLINE_THRESHOLD_MS)
```

Owns `loading.tsx` + `error.tsx`.

---

## Entry: `app/profile/[userId]/page.tsx` (route `/profile/[userId]`)

```
app/profile/[userId]/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/components/avatar/Avatar  (→ AvatarRenderer subtree as in /dashboard)
├── @/components/notifications/NotificationBell
│   ├── @/lib/hooks/useNotifications
│   └── @/lib/utils/cn
├── @/components/nav/BottomNav
│   ├── @/lib/utils/cn
│   └── @/lib/hooks/useNotifications
├── ./ShirtViewLoader
│   ├── @/components/ui/Skeleton → @/lib/utils/cn
│   └── next/dynamic → @/components/shirt/ShirtView
│       ├── @/components/shirt/ShirtShell
│       │   ├── @/lib/utils/cn
│       │   ├── @/lib/utils/shirtTemplate
│       │   └── @/lib/supabase/types
│       ├── @/lib/hooks/useShirtChannel
│       ├── @/lib/utils/actionCooldown
│       ├── @/lib/hooks/useToast
│       ├── @/lib/constants (SHIRT_H, SHIRT_W)
│       ├── @/lib/utils/cn
│       └── @/lib/supabase/types
├── @/components/activity/ActivityLog
│   ├── @/lib/utils/cn
│   ├── @/lib/utils/reactions
│   ├── @/lib/utils/actionCooldown
│   ├── @/lib/hooks/useToast
│   └── @/lib/utils/activity
├── ./ReportUserButton                      (leaf: react only)
├── @/app/dashboard/ShareButton             ← cross-route import out of another page folder
│   ├── @/lib/hooks/useToast
│   └── @/lib/utils/cn
├── @/components/place/PlaceBackground
│   ├── @/lib/hooks/useFirstVisit
│   ├── @/lib/hooks/usePrefersReducedMotion
│   ├── @/lib/hooks/useSlowConnection
│   └── @/lib/utils/cn
├── @/components/brand/Whiteboard → @/lib/utils/cn
├── @/components/brand/AvatarHalo → @/lib/utils/cn
├── @/components/brand/DriftingDoodles → @/lib/utils/cn
├── @/components/marginalia/AsteriskDivider → @/lib/utils/cn
├── @/components/marginalia/HeroStickerNotes  (multi-line import: HeroStickerNotes, DEFAULT_HERO_NOTE_SLOTS, + note props)
└── @/lib/constants (ROUTES)
    @/lib/utils/siteUrl
    @/lib/identity/signing → canSignShirt
    @/lib/identity/access → loadShirtAccess
    @/lib/supabase/server → createServiceClient
    @/lib/utils/activity
    @/lib/utils/platformFlags → getPlatformFlags
    @/lib/supabase/types (type Panel)
```

Owns `loading.tsx` + `error.tsx`.

---

## Entry: `app/shirts/[shirtId]/scribble/page.tsx` (route `/shirts/[shirtId]/scribble`)

```
app/shirts/[shirtId]/scribble/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/lib/supabase/server → createServiceClient
├── @/lib/identity/signing → canSignShirt
├── @/lib/identity/access → loadShirtAccess, normalizeVisibility
├── @/lib/supabase/types (type ScribbleRow)
├── @/src/features/avatar/data/avatarPresets → normalizeAvatarConfig
│   ├── ../types.ts
│   └── ./skinTones.ts
└── @/src/features/scribble/components/ScribbleStudio
    ├── @/lib/utils/cn
    ├── @/lib/constants
    ├── @/lib/utils/scribbleContract → hasDrawableFabricJson
    ├── @/lib/utils/shirtTemplate → SHIRT_COORDINATE_SPACE, SHIRT_TEMPLATE_ID
    ├── @/lib/hooks/useShirtChannel
    ├── @/lib/supabase/types (type Panel, ScribbleRow)
    ├── @/components/scribble/DrawingCanvas (type DrawingCanvasRef, DrawingTool)
    ├── @/src/features/avatar/types (UserAvatarConfig)
    ├── ../data/handwritingStyles
    ├── ../data/stickers → getSticker
    ├── ../types
    ├── ./ScribbleTopBar                       (leaf)
    ├── ./ScribbleBottomBar → ../types
    ├── ./ScribbleToolbar
    │   ├── @/lib/utils/cn
    │   ├── @/lib/constants → CANVAS_COLORS
    │   ├── ../types
    │   └── ./HandwritingStylePicker
    │       ├── @/lib/utils/cn
    │       └── ../data/handwritingStyles
    ├── ./ScribbleInspectorPanel
    │   ├── ../types
    │   ├── ./ScribblePermissionStatus         (leaf)
    │   ├── ./QuickNoteTemplates → ../data/noteTemplates
    │   └── ./StickerPicker
    │       ├── @/lib/utils/cn
    │       └── ../data/stickers
    ├── ./ScribbleMobileSheet
    │   ├── @/lib/utils/cn
    │   ├── ../types
    │   ├── ./HandwritingStylePicker (above)
    │   ├── ./QuickNoteTemplates (above)
    │   ├── ./ScribbleToolbar (above)
    │   └── ./StickerPicker (above)
    ├── ./ScribbleWorkspace
    │   ├── @/components/scribble/DrawingCanvas (types)
    │   ├── @/src/features/avatar/types
    │   ├── ../types
    │   ├── ./CanvasModeToggle
    │   │   ├── @/lib/utils/cn
    │   │   └── ../types
    │   ├── ./ZoomViewport                    (react only)
    │   ├── ./ScribbleSideToggle
    │   │   ├── @/lib/utils/cn
    │   │   └── ../types
    │   ├── ./FlatShirtCanvas
    │   │   ├── @/components/scribble/DrawingCanvas
    │   │   ├── @/lib/constants
    │   │   ├── @/lib/utils/shirtTemplate
    │   │   └── ../types
    │   └── ./OutsideNotesCanvas
    │       ├── @/lib/utils/cn
    │       ├── @/src/features/avatar/components/AvatarRenderer
    │       │   ├── @/lib/utils/cn, @/lib/utils/shirtTemplate, @/lib/constants
    │       │   ├── ../data/avatarPresets, ../data/skinTones, ../types
    │       ├── @/src/features/avatar/types
    │       ├── ../types
    │       ├── ../data/handwritingStyles → getHandwritingStyle
    │       └── ../data/stickers → getSticker
    └── ./SignaturePanel
        ├── @/lib/utils/cn
        ├── @/lib/constants → CANVAS_COLORS
        └── ../data/handwritingStyles
```

Owns `loading.tsx` + `error.tsx`. Deepest tree in the app (5 levels).

---

## Entry: `app/settings/page.tsx` (route `/settings`)

```
app/settings/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/lib/supabase/server → createServiceClient
├── @/components/avatar/Avatar  (→ AvatarRenderer subtree as in /dashboard)
├── @/components/notifications/NotificationBell
│   ├── @/lib/hooks/useNotifications
│   └── @/lib/utils/cn
├── @/components/nav/BottomNav
│   ├── @/lib/utils/cn
│   └── @/lib/hooks/useNotifications
├── @/components/marginalia/AsteriskDivider → @/lib/utils/cn
├── ./ProfileForm
│   ├── @/lib/constants → BODY_STYLES, SHIRT_COLORS
│   ├── @/lib/identity/signing (type ShirtVisibility)
│   ├── @/components/avatar/Avatar (above)
│   └── ./ShirtAccessPanel → @/lib/identity/signing (type ShirtVisibility)
├── ./HeadUpload
│   └── @/components/avatar/HeadCropUpload       (leaf: react + lucide-react only)
└── @/lib/constants → ROUTES
```

Owns `loading.tsx` + `error.tsx`.

---

## Entry: `app/onboarding/page.tsx` (route `/onboarding`)

```
app/onboarding/page.tsx          ('use client')
├── @/lib/supabase/client → createClient
├── @/components/place/PlaceBackground
│   ├── @/lib/hooks/useFirstVisit
│   ├── @/lib/hooks/usePrefersReducedMotion
│   ├── @/lib/hooks/useSlowConnection
│   └── @/lib/utils/cn
└── @/components/brand/DriftingDoodles → @/lib/utils/cn
```

Owns `loading.tsx` + `error.tsx`. Lightest tree of the authenticated set — no avatar,
no nav, no shared UI primitives.

Sibling `/onboarding/avatar` (separate entry, for reference):

```
app/onboarding/avatar/page.tsx
├── @/lib/auth/server → requirePageUser
└── @/src/features/avatar/components/AvatarOnboardingFlow
    ├── @/lib/utils/cn
    ├── @/lib/utils/skinTone
    ├── ../data/avatarPresets
    ├── ../data/skinTones
    ├── ../types
    ├── ./AvatarPresetGrid → ../data/avatarPresets, ../types, ./AvatarPresetCard
    │                        (→ @/lib/utils/cn, ../data/skinTones, ../types, ./AvatarRenderer)
    ├── ./AvatarReviewStep → ../types, ./AvatarRenderer, ./AvatarSideToggle
    ├── ./AvatarStyleStep → @/lib/utils/cn, ../types
    ├── ./FacePlacementEditor → @/lib/utils/cn, ../types, ./AvatarRenderer
    └── ./SkinToneSliders → @/lib/utils/skinTone, @/lib/utils/cn
```

---

## Entry: `app/groups/page.tsx` (route `/groups`)

```
app/groups/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/components/avatar/Avatar  (→ AvatarRenderer subtree as in /dashboard)
├── @/components/notifications/NotificationBell
│   ├── @/lib/hooks/useNotifications
│   └── @/lib/utils/cn
├── @/components/nav/BottomNav
│   ├── @/lib/utils/cn
│   └── @/lib/hooks/useNotifications
├── @/components/place/PlaceBackground
│   ├── @/lib/hooks/useFirstVisit
│   ├── @/lib/hooks/usePrefersReducedMotion
│   ├── @/lib/hooks/useSlowConnection
│   └── @/lib/utils/cn
├── @/components/brand/Whiteboard → @/lib/utils/cn
├── @/components/marginalia/AsteriskDivider → @/lib/utils/cn
├── @/components/marginalia/HandDrawnArrow → @/lib/utils/cn
├── ./CreateGroupForm → @/lib/constants → ROUTES   (exports CreateGroupForm + JoinGroupForm)
└── @/lib/constants → ROUTES
```

Owns `loading.tsx` + `error.tsx`.

---

## Entry: `app/groups/[groupId]/page.tsx` (route `/groups/[groupId]`)

```
app/groups/[groupId]/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/components/avatar/Avatar  (→ AvatarRenderer subtree as in /dashboard)
├── @/components/notifications/NotificationBell
│   ├── @/lib/hooks/useNotifications
│   └── @/lib/utils/cn
├── @/components/place/PlaceBackground
│   ├── @/lib/hooks/useFirstVisit
│   ├── @/lib/hooks/usePrefersReducedMotion
│   ├── @/lib/hooks/useSlowConnection
│   └── @/lib/utils/cn
├── @/components/brand/Whiteboard → @/lib/utils/cn
├── @/components/brand/DriftingDoodles → @/lib/utils/cn
├── @/components/marginalia/AsteriskDivider → @/lib/utils/cn
├── ./InviteLink                  (leaf: react only)
├── ./LeaveButton                 (leaf: react + next/navigation only)
├── ./RemoveMemberButton          (leaf: react + next/navigation only)
└── @/lib/constants → ROUTES
```

No own boundary — inherits `app/groups/loading.tsx` + `error.tsx`.
**No `BottomNav`** here, unlike its parent `/groups`.

---

## Entry: `app/yearbook/page.tsx` (route `/yearbook`)

```
app/yearbook/page.tsx
├── @/lib/auth/server → requirePageUser
├── @/components/avatar/Avatar  (→ AvatarRenderer subtree as in /dashboard)
├── @/components/nav/BottomNav
│   ├── @/lib/utils/cn
│   └── @/lib/hooks/useNotifications
├── ./YearbookControls                  (no local imports)
├── ./ExportRequestForm                 (no local imports)
└── @/lib/constants → ROUTES
```

Owns `loading.tsx` + `error.tsx`. **No `NotificationBell`** — the only authenticated page
whose hand-rolled header omits it (it imports `BottomNav` only).