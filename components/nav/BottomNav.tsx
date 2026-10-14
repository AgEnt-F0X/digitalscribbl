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
