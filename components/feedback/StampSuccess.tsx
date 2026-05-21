'use client'

// StampSuccess — circular teacher's-stamp approval mark.
// Doc 18 § 14. Phase 1 uses: onboarding complete, scribble published,
// avatar locked. The `stamp-land` keyframe gives the slight overshoot.

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface StampSuccessProps {
  show: boolean
  /** Fires ~260ms after `show` flips true (animation end). */
  onComplete?: () => void
  className?: string
  /** Override the inner copy; defaults to "scribbled!" / "✓ approved". */
  primaryText?: string
  secondaryText?: string
}

const ANIMATION_MS = 260

export function StampSuccess({
  show,
  onComplete,
  className,
  primaryText = 'scribbled!',
  secondaryText = '✓ approved',
}: StampSuccessProps) {
  const completed = useRef(false)

  useEffect(() => {
    if (!show) {
      completed.current = false
      return undefined
    }
    if (completed.current) return undefined
    const timer = window.setTimeout(() => {
      completed.current = true
      onComplete?.()
    }, ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [show, onComplete])

  if (!show) return null

  return (
    <svg
      className={cn('stamp-success', className)}
      viewBox="0 0 120 120"
      width="120"
      height="120"
      role="img"
      aria-label={`${primaryText} ${secondaryText}`}
      style={{ filter: 'blur(0.4px)' }}
    >
      <circle
        cx="60"
        cy="60"
        r="56"
        stroke="var(--ink-stamp-green)"
        strokeWidth="3"
        fill="none"
      />
      <text
        x="60"
        y="55"
        textAnchor="middle"
        fontFamily="var(--font-display), Caveat, cursive"
        fontSize="22"
        fontWeight="600"
        fill="var(--ink-stamp-green)"
      >
        {primaryText}
      </text>
      <text
        x="60"
        y="80"
        textAnchor="middle"
        fontFamily="var(--font-display), Caveat, cursive"
        fontSize="14"
        fill="var(--ink-stamp-green)"
        opacity="0.7"
      >
        {secondaryText}
      </text>
    </svg>
  )
}

export default StampSuccess
