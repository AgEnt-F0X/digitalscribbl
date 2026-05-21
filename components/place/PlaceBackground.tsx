'use client'

// Place layer — illustrated campus background behind every signature page.
// Doc 18 § 4 + § 11. Three phases: vivid (first visit), fading (animating),
// ambient (settled). Honours reduced-motion + slow-connection.

import { useEffect, useState } from 'react'
import {
  useFirstVisit,
  type FirstVisitSurface,
} from '@/lib/hooks/useFirstVisit'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { useSlowConnection } from '@/lib/hooks/useSlowConnection'
import { cn } from '@/lib/utils/cn'

export type PlaceIllustration = 'lawn-golden-hour' | 'classroom-hall'

type Phase = 'vivid' | 'fading' | 'ambient'

interface PlaceBackgroundProps {
  surface: FirstVisitSurface
  illustration: PlaceIllustration
  /** Login: stays vivid forever (brand front door). */
  alwaysVivid?: boolean
  /** Profile, groups, group-detail: never plays the hero, just ambient. */
  alwaysAmbient?: boolean
  className?: string
}

// Per doc 18 § 11: desktop ~1800ms, mobile ~1100ms.
// We pick the boundary purely off viewport width so SSR is deterministic
// (the CSS keyframe duration shortens for the same breakpoint in globals).
const DESKTOP_DURATION_MS = 1800
const MOBILE_DURATION_MS = 1100
const MOBILE_BREAKPOINT_PX = 768

function pickFadeDuration(): number {
  if (typeof window === 'undefined') return DESKTOP_DURATION_MS
  return window.innerWidth <= MOBILE_BREAKPOINT_PX
    ? MOBILE_DURATION_MS
    : DESKTOP_DURATION_MS
}

export function PlaceBackground({
  surface,
  illustration,
  alwaysVivid = false,
  alwaysAmbient = false,
  className,
}: PlaceBackgroundProps) {
  const { isFirstVisit, markVisited } = useFirstVisit(surface)
  const prefersReducedMotion = usePrefersReducedMotion()
  const slowConnection = useSlowConnection()

  // Initial render is always 'ambient' to avoid a flash of vivid before the
  // mount effect resolves the real first-visit + media-query state. The
  // effect below flips us into 'vivid' when we actually want the hero.
  const [phase, setPhase] = useState<Phase>(() => {
    if (alwaysVivid) return 'vivid'
    return 'ambient'
  })

  useEffect(() => {
    if (alwaysVivid) {
      setPhase('vivid')
      return undefined
    }
    if (alwaysAmbient || !isFirstVisit) {
      setPhase('ambient')
      return undefined
    }
    if (prefersReducedMotion || slowConnection) {
      setPhase('ambient')
      markVisited()
      return undefined
    }
    setPhase('vivid')
    const fadeDuration = pickFadeDuration()

    const fadeTimer = window.setTimeout(() => setPhase('fading'), 50)
    const settleTimer = window.setTimeout(() => {
      setPhase('ambient')
      markVisited()
    }, 50 + fadeDuration)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(settleTimer)
    }
  }, [
    alwaysVivid,
    alwaysAmbient,
    isFirstVisit,
    prefersReducedMotion,
    slowConnection,
    markVisited,
  ])

  // Slow-2g / 2g: skip the place layer entirely. Substrate carries the page.
  if (slowConnection) {
    return <div className={cn('place-layer', className)} aria-hidden="true" />
  }

  const phaseClass =
    phase === 'vivid'
      ? 'place-layer--vivid'
      : phase === 'fading'
        ? 'place-layer--fading'
        : 'place-layer--ambient'

  const desktopSrc = `/illustrations/place/${illustration}-desktop.svg`
  const tabletSrc = `/illustrations/place/${illustration}-tablet.svg`
  const mobileSrc = `/illustrations/place/${illustration}-mobile.svg`

  return (
    <div
      className={cn('place-layer', phaseClass, className)}
      aria-hidden="true"
    >
      <picture className="block w-full h-full">
        <source media="(max-width: 768px)" srcSet={mobileSrc} />
        <source media="(max-width: 1280px)" srcSet={tabletSrc} />
        <img
          src={desktopSrc}
          alt=""
          decoding="async"
          loading={alwaysVivid ? 'eager' : 'lazy'}
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
      </picture>
    </div>
  )
}

export default PlaceBackground
