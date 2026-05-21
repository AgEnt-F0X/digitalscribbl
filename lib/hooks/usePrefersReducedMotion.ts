'use client'

// Subscribes to `prefers-reduced-motion: reduce` and re-renders when the
// user toggles the OS-level preference. Doc 18 § 14 motion guardrails.

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion(): boolean {
  // Default to `false` for SSR + the first paint so the server tree matches
  // the post-hydration "no preference" default. Mount effect upgrades to the
  // real value before any animation fires meaningfully.
  const [prefers, setPrefers] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mql = window.matchMedia(QUERY)
    setPrefers(mql.matches)

    const handle = (event: MediaQueryListEvent) => setPrefers(event.matches)

    // Older Safari only exposes addListener/removeListener. Guard both.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handle)
      return () => mql.removeEventListener('change', handle)
    }
    mql.addListener(handle)
    return () => mql.removeListener(handle)
  }, [])

  return prefers
}
