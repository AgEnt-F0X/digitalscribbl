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
