'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'

export interface ApprovalItem {
  scribble_id: string
  panel: string
  canvas_svg: string | null
  created_at: string
  /** Includes the avatar columns `Avatar` reads, so it can render the person. */
  scribbler: {
    id: string
    display_name: string
    body_style?: string | null
    shirt_color?: string | null
    head_front_url?: string | null
    head_back_url?: string | null
    avatar_config?: unknown
  } | null
}

/**
 * The owner's side of the `approval` shirt mode (doc 07).
 *
 * One decision per scribble, no reason field, and a decline names nobody.
 * That last part is the design, not an omission: a rejection that carries a
 * reason or a name turns a private moderation call into something the other
 * person can argue with.
 *
 * The drawing itself is shown, because the whole point of this mode is that the
 * owner chooses what appears on her shirt *before* anyone else sees it.
 */
export default function ApprovalInbox({ items }: { items: ApprovalItem[] }) {
  const router = useRouter()
  const [decided, setDecided] = useState<Record<string, 'approved' | 'rejected'>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function decide(scribbleId: string, decision: 'approved' | 'rejected') {
    if (decided[scribbleId] || busy) return
    setBusy(scribbleId)
    setError(null)

    try {
      const res = await fetch('/api/scribble/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scribble_id: scribbleId, decision }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Could not save that decision')
        return
      }

      setDecided(prev => ({ ...prev, [scribbleId]: decision }))
      startTransition(() => router.refresh())
    } catch {
      setError('Could not save that decision')
    } finally {
      setBusy(null)
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[color:var(--line-soft)] bg-paper-50/60 p-4 text-center text-sm text-ink-500">
        Nothing waiting. You are all caught up.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {items.map(item => {
          const name = item.scribbler?.display_name ?? 'Someone'
          const decision = decided[item.scribble_id]
          const isBusy = busy === item.scribble_id

          return (
            <li
              key={item.scribble_id}
              className="flex items-center gap-3 rounded-2xl border border-[color:var(--line-soft)] bg-white/85 p-3 backdrop-blur-sm"
              style={{ borderRadius: '14px 16px 13px 15px' }}
            >
              <Avatar
                row={item.scribbler}
                displayName={name}
                size="sm"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
                <p className="text-xs text-ink-500">
                  {item.panel === 'back' ? 'On the back' : item.panel === 'sleeves' ? 'On the sleeves' : 'On the front'}
                </p>
              </div>

              {decision ? (
                <span
                  className={
                    decision === 'approved'
                      ? 'text-xs font-semibold text-emerald-700'
                      : 'text-xs font-semibold text-ink-500'
                  }
                >
                  {decision === 'approved' ? 'Posted' : 'Not posted'}
                </span>
              ) : (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => decide(item.scribble_id, 'approved')}
                    aria-label={`Post ${name}'s scribble`}
                    className="flex items-center gap-1 rounded-xl bg-ink-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50"
                  >
                    <Check size={12} aria-hidden="true" />
                    Post
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => decide(item.scribble_id, 'rejected')}
                    aria-label={`Don't post ${name}'s scribble`}
                    className="flex items-center gap-1 rounded-xl border border-[color:var(--line-soft)] px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-paper-100 disabled:opacity-50"
                  >
                    <X size={12} aria-hidden="true" />
                    Skip
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
