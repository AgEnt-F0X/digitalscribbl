'use client'

import { useState } from 'react'
import { createActionCooldown } from '@/lib/utils/actionCooldown'
import { showToast } from '@/lib/hooks/useToast'

const requestCooldown = createActionCooldown({ cooldownMs: 1200 })

export default function RequestScribbleButton({ ownerId }: { ownerId: string }) {
  const [status, setStatus] = useState<'idle' | 'sent' | 'loading'>('idle')

  const send = async () => {
    if (!requestCooldown.canRun(`request:${ownerId}`)) return
    setStatus('loading')
    const res = await fetch('/api/scribble/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_id: ownerId }),
    })
    setStatus(res.ok ? 'sent' : 'idle')
    showToast({
      tone: res.ok ? 'success' : 'error',
      title: res.ok ? 'Request sent' : 'Could not send request',
      body: res.ok ? 'They can approve it from notifications.' : 'Try again in a moment.',
    })
  }

  if (status === 'sent') {
    return <p className="text-center text-xs text-gray-500 py-2">📬 Request sent!</p>
  }

  return (
    <button
      onClick={send}
      disabled={status === 'loading'}
      className="btn-secondary w-full text-xs"
    >
      {status === 'loading' ? '…' : '📬 Request to scribble'}
    </button>
  )
}
