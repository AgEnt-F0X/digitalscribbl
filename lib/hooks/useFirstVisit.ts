'use client'

// First-visit tracking for Sunlit Lawn signature pages. Doc 18 § 11.
// One localStorage object keyed by surface so dashboard + explore can each
// fire their hero animation exactly once per device, then settle to ambient.

import { useCallback, useEffect, useState } from 'react'

export type FirstVisitSurface =
  | 'dashboard'
  | 'login'
  | 'profile'
  | 'explore'
  | 'groups'

interface FirstVisitMap {
  dashboard?: boolean
  login?: boolean
  profile?: boolean
  explore?: boolean
  groups?: boolean
}

const STORAGE_KEY = 'scribbl_first_visit_v1'

function readMap(): FirstVisitMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as FirstVisitMap
    }
    return {}
  } catch {
    // Safari private mode + storage-quota exhaustion both throw here.
    // Treat as "no flags persisted" — animations replay every load, which
    // is the correct degradation (no broken state, just a slightly louder UX).
    return {}
  }
}

function writeMap(next: FirstVisitMap): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // See readMap — same private-mode / quota story.
  }
}

interface UseFirstVisitResult {
  isFirstVisit: boolean
  markVisited: () => void
}

const NOOP = () => {}

export function useFirstVisit(surface: FirstVisitSurface): UseFirstVisitResult {
  // SSR returns false so the server-rendered tree always matches the
  // post-hydration "subsequent visit" state. We only flip to true after
  // mount when we know for sure the flag isn't set.
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  useEffect(() => {
    const map = readMap()
    setIsFirstVisit(!map[surface])
  }, [surface])

  const markVisited = useCallback(() => {
    const map = readMap()
    if (map[surface]) return
    writeMap({ ...map, [surface]: true })
    setIsFirstVisit(false)
  }, [surface])

  if (typeof window === 'undefined') {
    return { isFirstVisit: false, markVisited: NOOP }
  }
  return { isFirstVisit, markVisited }
}
