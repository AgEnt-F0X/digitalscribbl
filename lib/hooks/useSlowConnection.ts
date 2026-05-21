'use client'

// Connection-aware degradation for the Place layer. Doc 18 § 13.
// On slow-2g / 2g we skip the illustrated background entirely so the
// substrate carries the page with zero broken layout, zero perceived slow.

import { useEffect, useState } from 'react'

type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | string

interface NetworkInformation {
  effectiveType?: EffectiveType
  addEventListener?: (event: 'change', listener: () => void) => void
  removeEventListener?: (event: 'change', listener: () => void) => void
}

interface NavigatorWithConnection {
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
}

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined
  const nav = navigator as Navigator & NavigatorWithConnection
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection
}

function isSlowEffectiveType(value: EffectiveType | undefined): boolean {
  return value === 'slow-2g' || value === '2g'
}

export function useSlowConnection(): boolean {
  // Default to false on SSR + browsers that don't implement the API
  // (Safari, Firefox). That's the right default — better to render the
  // place layer and let lazy loading handle it than to drop it unnecessarily.
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const connection = getConnection()
    if (!connection) return

    const update = () => setIsSlow(isSlowEffectiveType(connection.effectiveType))
    update()

    if (typeof connection.addEventListener === 'function') {
      connection.addEventListener('change', update)
      return () => {
        connection.removeEventListener?.('change', update)
      }
    }
    return undefined
  }, [])

  return isSlow
}
