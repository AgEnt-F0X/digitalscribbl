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
