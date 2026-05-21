'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Best-effort error reporting; ignore failures
    void fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: '/dashboard',
        message: error.message,
        digest: error.digest,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="scribbl-page min-h-screen grid place-items-center px-6">
      <div className="paper-note px-6 py-8 text-center max-w-md">
        <div className="text-4xl mb-2" aria-hidden="true">📓</div>
        <h1 className="font-display text-3xl text-ink-900">Something tore the paper.</h1>
        <p className="mt-2 text-sm text-ink-500">
          We hit an unexpected error loading your dashboard. Try again, and if it keeps happening, tap the report button at the bottom of the screen.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] font-mono text-ink-300">Ref: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/login" className="btn-secondary">Sign out</Link>
        </div>
      </div>
    </div>
  )
}
