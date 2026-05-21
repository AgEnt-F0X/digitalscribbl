'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface PageErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  route: string
  /** Override the headline if the default ("Something tore the paper.") doesn't fit. */
  title?: string
  /** Override the description copy. */
  description?: string
  /** Override the destination of the secondary action. */
  homeHref?: string
  /** Override the secondary action label. */
  homeLabel?: string
}

/**
 * Shared error.tsx body. Every route's error.tsx imports this so
 * styling + reporting are consistent.
 */
export default function PageError({
  error,
  reset,
  route,
  title = 'Something tore the paper.',
  description = 'We hit an unexpected error. Try again, and if it keeps happening, tap the report button at the bottom.',
  homeHref = '/dashboard',
  homeLabel = 'Back to dashboard',
}: PageErrorProps) {
  useEffect(() => {
    void fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route,
        message: error.message,
        digest: error.digest,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }),
    }).catch(() => {})
  }, [error, route])

  return (
    <div className="scribbl-page min-h-screen grid place-items-center px-6 py-12">
      <div className="paper-note px-6 py-8 text-center max-w-md w-full">
        <div className="text-4xl mb-2" aria-hidden="true">📓</div>
        <h1 className="font-display text-3xl text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">{description}</p>
        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-ink-300">Ref: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href={homeHref} className="btn-secondary">{homeLabel}</Link>
        </div>
      </div>
    </div>
  )
}
