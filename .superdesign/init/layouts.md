# Layouts & Shell Files

Full source of the root layout and the shared shell components. Route-level page markup is
**not** here — see `pages.md` for the per-page dependency trees.

---

## AppShell mount status (verified, not assumed)

`components/nav/AppShell.tsx` is **mounted by zero pages.** Grepping the whole repo for
`AppShell` returns only:

- its own definition (`components/nav/AppShell.tsx`)
- a doc comment in `components/nav/BottomNav.tsx:17`
- prose in `docs/14-pd-review.md`, `docs/05-ship-checklist.md`, `docs/16-three-reviews-synthesis.md`,
  `UX-AUDIT.md` (`UX-AUDIT.md:112` — *"AppShell/TopNav exist and are mounted by zero pages"*)

Because `BottomNav` and `TopNav` are imported **only** by `AppShell`, both are transitively
dead too. What actually ships is per-page hand-rolled headers: `/dashboard`, `/explore`,
`/profile/[userId]`, `/settings`, `/groups`, `/groups/[groupId]`, `/activity`, and `/yearbook`
each import `NotificationBell` and/or `BottomNav` directly and write their own `<header>`.

`NotificationBell` is therefore rendered by many pages *and* composed into the unused
`AppShell` — two nav implementations, one of which never mounts.

---

## `app/layout.tsx`

Root layout. Registers five Google fonts via `next/font/google` (Caveat, Patrick Hand,
Permanent Marker, Inter, JetBrains Mono), each exposed as a CSS variable consumed by
`tailwind.config.ts`'s `fontFamily`. Renders `children` plus two app-wide overlays:
`<ToastProvider />` and `<ReportIssueButton />`. No nav, no shell.

```tsx
import type { Metadata, Viewport } from 'next'
import { Caveat, Inter, Patrick_Hand, Permanent_Marker, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ReportIssueButton from '@/components/support/ReportIssueButton'
import { ToastProvider } from '@/components/ui/ToastProvider'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const patrickHand = Patrick_Hand({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-hand',
  display: 'swap',
})

const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-marker',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'Scribbl — Sign your shirt. Sign theirs.',
  description: 'A one-month digital farewell. Sign your batchmates\' virtual shirts. Keep the memories forever.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scribbl',
  },
  openGraph: {
    title: 'Scribbl — Sign your shirt. Sign theirs.',
    description: 'A one-month digital farewell. Sign your batchmates\' virtual shirts.',
    type: 'website',
    images: ['/og-image.svg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFF6D9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${caveat.variable} ${patrickHand.variable} ${permanentMarker.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body suppressHydrationWarning className="font-body">
        {children}
        <ToastProvider />
        <ReportIssueButton />
      </body>
    </html>
  )
}
```

---

## `app/loading.tsx`

Root-segment loading skeleton: a `PageShellSkeleton` frame wrapping a 2-column
`minmax(0,1fr) / 320px` grid.

```tsx
import { PageShellSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <PageShellSkeleton>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[420px]" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
          <Skeleton className="h-28" />
        </div>
      </div>
    </PageShellSkeleton>
  )
}
```

---

## `components/nav/AppShell.tsx` — `AppShell` (default export) — **UNUSED**

The intended shared shell: mobile compact header (`md:hidden`) with logo + bell + avatar,
desktop `TopNav` with the bell absolutely positioned into it, the page body in `<main>`,
and `BottomNav`. Note it is **not** marked `'use client'`, yet it renders two client
components and reads no hooks itself.

**Key props:** `children`, `currentUserId`, `currentUserName`, `currentUserHeadUrl?`,
`unreadCount?` (declared but unused in the body), `hideBottomNav = false`, `hideTopNav = false`

```tsx
import { ReactNode } from 'react'
import BottomNav from './BottomNav'
import TopNav from './TopNav'
import NotificationBell from '@/components/notifications/NotificationBell'

interface AppShellProps {
  children: ReactNode
  currentUserId: string
  currentUserName: string
  currentUserHeadUrl?: string | null
  unreadCount?: number
  /** When true, hides the bottom nav (e.g. for the scribble studio). */
  hideBottomNav?: boolean
  /** When true, hides the top nav (e.g. for full-bleed yearbook view). */
  hideTopNav?: boolean
}

/**
 * Main app shell used by every authenticated page.
 *
 * Mobile: top header is minimal (logo + bell + avatar). Bottom nav present.
 * Desktop: top nav with full labels. No bottom nav.
 *
 * Pages that need full-bleed (signing studio) pass hideBottomNav.
 */
export default function AppShell({
  children,
  currentUserId,
  currentUserName,
  currentUserHeadUrl,
  unreadCount,
  hideBottomNav = false,
  hideTopNav = false,
}: AppShellProps) {
  return (
    <div className="scribbl-page flex flex-col min-h-screen">
      {!hideTopNav && (
        <>
          {/* Mobile header — compact */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/85 backdrop-blur-sm border-b"
            style={{ borderColor: 'rgba(45,41,35,0.10)' }}
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl text-ink-900 leading-none">Scribbl</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell userId={currentUserId} />
              {currentUserHeadUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUserHeadUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-ink-100"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-soft text-brand grid place-items-center text-xs font-semibold">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </header>

          {/* Desktop top nav with bell composed in */}
          <div className="hidden md:block relative">
            <TopNav
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserHeadUrl={currentUserHeadUrl}
            />
            <div className="absolute top-1/2 -translate-y-1/2 right-[180px]">
              <NotificationBell userId={currentUserId} />
            </div>
          </div>
        </>
      )}

      <main
        className="flex-1 w-full"
        style={{ paddingBottom: hideBottomNav ? undefined : 'var(--tw-padding-bottom-fallback, 88px)' }}
      >
        {children}
      </main>

      {!hideBottomNav && (
        <BottomNav currentUserId={currentUserId} />
      )}
    </div>
  )
}
```

---

## `components/nav/TopNav.tsx` — `TopNav` (default export) — **UNUSED** (only via AppShell)

Desktop `md+` header: Scribbl wordmark with `scribble-underline` + "Your story. Their words."
tagline, optional Explore / Groups links, and a bordered greeting chip.
Active state derives from `usePathname()` (`bg-brand-soft text-brand`). The bell is
deliberately left as a blank slot for the parent to compose.

**Key props:** `currentUserId` (unused in body), `currentUserName`, `currentUserHeadUrl?`,
`unreadCount?` (unused), `variant?: 'full' | 'minimal'` (default `full`)

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Users } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TopNavProps {
  currentUserId: string
  currentUserName: string
  currentUserHeadUrl?: string | null
  unreadCount?: number
  variant?: 'full' | 'minimal'
}

/**
 * Desktop top nav (md+). Logo on the left, primary nav in the middle,
 * notification bell + avatar menu on the right.
 *
 * The notification bell is rendered server-side (it imports the existing
 * NotificationBell), but we keep that responsibility in the page-level
 * server component since it needs `userId` from auth.
 */
export default function TopNav({
  currentUserName,
  currentUserHeadUrl,
  variant = 'full',
}: TopNavProps) {
  const pathname = usePathname()
  const isActive = (route: string) =>
    pathname === route || pathname.startsWith(route + '/')

  return (
    <header className="hidden md:flex items-center justify-between gap-8 px-8 py-4 border-b"
      style={{ borderColor: 'rgba(45,41,35,0.10)' }}
    >
      <Link href="/dashboard" className="flex items-baseline gap-2 no-tap-highlight group">
        <span className="font-display text-3xl text-ink-900 scribble-underline leading-none">
          Scribbl
        </span>
        <span className="font-hand text-sm text-ink-500 italic">Your story. Their words.</span>
      </Link>

      {variant === 'full' && (
        <nav className="flex items-center gap-6">
          <Link
            href="/explore"
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition px-3 py-2 rounded-xl',
              isActive('/explore') ? 'bg-brand-soft text-brand' : 'text-ink-700 hover:bg-paper-50',
            )}
          >
            <Compass className="h-4 w-4" />
            Explore
          </Link>
          <Link
            href="/groups"
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition px-3 py-2 rounded-xl',
              isActive('/groups') ? 'bg-brand-soft text-brand' : 'text-ink-700 hover:bg-paper-50',
            )}
          >
            <Users className="h-4 w-4" />
            Groups
          </Link>
        </nav>
      )}

      <div className="flex items-center gap-3">
        {/* Bell slot rendered by parent — left blank here for composition */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border bg-white"
          style={{ borderColor: 'rgba(45,41,35,0.10)' }}>
          {currentUserHeadUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUserHeadUrl}
              alt=""
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-brand-soft text-brand grid place-items-center text-xs font-semibold">
              {currentUserName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-ink-700">Hi, {currentUserName.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  )
}
```

---

## `components/nav/BottomNav.tsx` — `BottomNav` (default export) — **LIVE** (imported directly by 6 pages)

Mobile-only 5-slot bottom bar (`bottom-nav md:hidden`): Home, Explore, a centre `nav-fab`
CTA to `/explore?filter=unsigned`, Activity (with unread badge from `useNotifications`), and
a dynamic Profile link. Active state from `usePathname()`; `/dashboard` matches exactly,
the rest match by prefix.

**Key props:** `currentUserId: string`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Bell, User, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useNotifications } from '@/lib/hooks/useNotifications'

interface BottomNavProps {
  currentUserId: string
}

/**
 * Mobile-only bottom tab bar. Always 5 slots, center is the primary CTA
 * that takes the user to /explore filtered to "shirts you haven't signed yet".
 *
 * Hidden on desktop (md+) — desktop uses the top nav in AppShell.
 */
export default function BottomNav({ currentUserId }: BottomNavProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications(currentUserId)

  const isActive = (route: string, exact = false) => {
    if (exact) return pathname === route
    return pathname === route || pathname.startsWith(route + '/')
  }

  const profileHref = `/profile/${currentUserId}`

  const dashboardActive = isActive('/dashboard', true)
  const exploreActive   = isActive('/explore')
  const activityActive  = isActive('/activity')
  const profileActive   = pathname === profileHref

  return (
    <nav
      className="bottom-nav md:hidden flex items-stretch"
      aria-label="Primary"
    >
      <Link
        href="/dashboard"
        className="bottom-nav-item no-tap-highlight"
        data-active={dashboardActive}
        aria-current={dashboardActive ? 'page' : undefined}
      >
        <Home strokeWidth={2.2} className="h-5 w-5" />
        <span>Home</span>
      </Link>

      <Link
        href="/explore"
        className="bottom-nav-item no-tap-highlight"
        data-active={exploreActive}
        aria-current={exploreActive ? 'page' : undefined}
      >
        <Compass strokeWidth={2.2} className="h-5 w-5" />
        <span>Explore</span>
      </Link>

      {/* Center: floating action button — "find someone to sign" */}
      <div className="flex-1 grid place-items-center relative">
        <Link
          href="/explore?filter=unsigned"
          aria-label="Sign someone's shirt"
          className="nav-fab no-tap-highlight"
        >
          <PenLine strokeWidth={2.4} className="h-6 w-6" />
        </Link>
      </div>

      <Link
        href="/activity"
        className="bottom-nav-item no-tap-highlight relative"
        data-active={activityActive}
        aria-current={activityActive ? 'page' : undefined}
      >
        <div className="relative">
          <Bell strokeWidth={2.2} className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-2 min-w-[16px] h-4 px-1',
                'rounded-full bg-danger text-white text-[10px] font-semibold',
                'grid place-items-center',
              )}
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span>Activity</span>
      </Link>

      <Link
        href={profileHref}
        className="bottom-nav-item no-tap-highlight"
        data-active={profileActive}
        aria-current={profileActive ? 'page' : undefined}
      >
        <User strokeWidth={2.2} className="h-5 w-5" />
        <span>Profile</span>
      </Link>
    </nav>
  )
}
```