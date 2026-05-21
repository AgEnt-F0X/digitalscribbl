'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { showToast } from '@/lib/hooks/useToast'
import { cn } from '@/lib/utils/cn'

interface ScribbleRequestActionsProps {
  requestId: string
  requesterName: string
}

export default function ScribbleRequestActions({
  requestId,
  requesterName,
}: ScribbleRequestActionsProps) {
  const router = useRouter()
  const [handled, setHandled] = useState<'approved' | 'rejected' | null>(null)
  const [isPending, startTransition] = useTransition()

  function respond(action: 'approved' | 'rejected') {
    if (handled || isPending) return

    startTransition(async () => {
      const res = await fetch('/api/scribble/request', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ request_id: requestId, action }),
      })

      if (!res.ok) {
        showToast({ tone: 'error', title: 'Request update failed' })
        return
      }

      setHandled(action)
      showToast({
        tone:  'success',
        title: action === 'approved' ? `${requesterName} can scribble` : `Request declined`,
      })
      router.refresh()
    })
  }

  if (handled) {
    return (
      <span className={cn(
        'rounded-full px-2.5 py-1 text-xs font-semibold',
        handled === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
      )}>
        {handled === 'approved' ? 'Approved' : 'Declined'}
      </span>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => respond('approved')}
        disabled={isPending}
        className="grid h-9 w-9 place-items-center rounded-full border border-green-200 bg-green-50 text-green-700 transition hover:bg-green-100 disabled:opacity-50"
        aria-label={`Approve ${requesterName}`}
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        onClick={() => respond('rejected')}
        disabled={isPending}
        className="grid h-9 w-9 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        aria-label={`Reject ${requesterName}`}
      >
        <X size={16} />
      </button>
    </div>
  )
}
