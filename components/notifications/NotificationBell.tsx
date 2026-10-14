'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(userId)
  const [open, setOpen]                 = useState(false)
  // Approval queue for pproval shirts (doc 07). Keyed by scribble, not by
  // person: the decision is about one drawing, not about someone's access.
  const [deciding, setDeciding] = useState<Set<string>>(new Set())
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({})

  const handleToggle = () => {
    // Mark all as read when the panel CLOSES (user had a chance to see them)
    if (open && unreadCount > 0) markAllRead()
    setOpen(v => !v)
  }

  const handleDecision = async (
    scribbleId:     string,
    decision:       'approved' | 'rejected',
    notificationId: string,
  ) => {
    if (deciding.has(scribbleId)) return
    setDeciding(prev => new Set([...prev, scribbleId]))

    try {
      await fetch('/api/scribble/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ scribble_id: scribbleId, decision }),
      })
      setDecisions(prev => ({ ...prev, [scribbleId]: decision }))
      markRead(notificationId)
      router.refresh()
    } finally {
      setDeciding(prev => {
        const next = new Set([...prev])
        next.delete(scribbleId)
        return next
      })
    }
  }

  // Resolve the trigger label dynamically so screen readers announce
  // unread state without the user opening the panel. `useNotifications`
  // streams `unreadCount` asynchronously; the initial value is `0` and
  // any later update flips the label automatically.
  const bellLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : 'Notifications, no unread'

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label={bellLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-scribble-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-badge-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-ink-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-gray-600">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Nothing here yet 🙂
                </div>
              ) : (
                notifications.map(n => {
                  // `scribble_pending_approval` is the owner's decision prompt for
                  // an `approval` shirt. Keyed by the scribble, because the
                  // decision is about one drawing.
                  const isApproval    = n.type === 'scribble_pending_approval'
                  const scribbleId    = n.related_scribble_id
                  const decided       = scribbleId ? decisions[scribbleId] : undefined
                  const isDeciding    = scribbleId ? deciding.has(scribbleId) : false

                  return (
                    <div
                      key={n.id}
                      onClick={() => !isApproval && markRead(n.id)}
                      className={cn(
                        'px-4 py-3 transition',
                        !n.is_read && 'bg-paper-100',
                        !isApproval && 'cursor-pointer hover:bg-gray-50',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">{typeEmoji(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm', !n.is_read && 'font-semibold text-ink-900')}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-gray-500 truncate">{n.body}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>

                          {/* Approve / Reject for scribble requests */}
                          {isApproval && scribbleId && (
                            <div className="mt-2">
                              {decided ? (
                                <p className={cn(
                                  'text-xs font-medium',
                                  decided === 'approved' ? 'text-green-600' : 'text-red-500',
                                )}>
                                  {decided === 'approved' ? '✓ Approved' : '✗ Not posted'}
                                </p>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    disabled={isDeciding}
                                    onClick={e => { e.stopPropagation(); handleDecision(scribbleId, 'approved', n.id) }}
                                    className="flex-1 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition disabled:opacity-50"
                                  >
                                    {isDeciding ? '…' : '✓ Post it'}
                                  </button>
                                  <button
                                    disabled={isDeciding}
                                    onClick={e => { e.stopPropagation(); handleDecision(scribbleId, 'rejected', n.id) }}
                                    className="flex-1 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition disabled:opacity-50"
                                  >
                                    {isDeciding ? '…' : '✗ Not this one'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {!n.is_read && !isApproval && (
                          <div className="w-2 h-2 rounded-full bg-scribble-blue mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function typeEmoji(type: string): string {
  const map: Record<string, string> = {
    scribble_received: '✏️',
    scribble_live:     '🎨',
    request_received:  '📬',
    request_approved:  '✅',
    request_rejected:  '❌',
    shirt_unlocked:    '🎉',
    admin_broadcast:   '📣',
    scribble_removed:  '🗑️',
    scribble_reaction: '❤️',
  }
  return map[type] ?? '🔔'
}
