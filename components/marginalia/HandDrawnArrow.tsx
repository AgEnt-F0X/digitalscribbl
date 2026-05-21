'use client'

// HandDrawnArrow — squiggly hand-drawn arrow doodle pointing from the
// scribbled name to a CTA. Doc 18 § 8 + § 14. SVG stroke-dasharray reveal
// on mount; optional attention-wiggle for empty-state arrows.

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

export type ArrowDirection = 'right' | 'down' | 'left' | 'up'

interface HandDrawnArrowProps {
  direction?: ArrowDirection
  length?: number
  className?: string
  /** Toggle on for empty-state attention wiggle (doc 18 § 14). */
  attention?: boolean
  /** Override stroke colour; defaults to ink-700. */
  stroke?: string
  strokeWidth?: number
}

const ROTATION: Record<ArrowDirection, number> = {
  right: 0,
  down:  90,
  left:  180,
  up:    270,
}

// Single canonical right-pointing path in a 100x40 viewbox. We rotate the
// outer SVG element for direction variants so the dasharray reveal still
// reads "left-to-right" relative to the user's eye.
const ARROW_PATH    = 'M4 22 Q 24 12 50 22 T 92 20'
const ARROW_HEAD_A  = 'M82 12 L 95 20 L 80 28'
const PATH_LENGTH   = 110

export function HandDrawnArrow({
  direction = 'right',
  length = 80,
  className,
  attention = false,
  stroke = 'var(--ink-700)',
  strokeWidth = 2.2,
}: HandDrawnArrowProps) {
  const ref = useRef<SVGSVGElement | null>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    // Trigger the dasharray reveal one frame after mount so the transition
    // animates rather than jumping straight to drawn.
    const handle = window.requestAnimationFrame(() => setDrawn(true))
    return () => window.cancelAnimationFrame(handle)
  }, [])

  const rotateDeg = ROTATION[direction]
  const width  = length
  const height = Math.round(length * 0.4)

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox="0 0 100 40"
      role="img"
      aria-label="hand-drawn pointer"
      className={cn(
        'hand-drawn-arrow inline-block',
        attention && 'hand-drawn-arrow--attention',
        className,
      )}
      style={{ transform: `rotate(${rotateDeg}deg)`, transformOrigin: '50% 50%' }}
    >
      <path
        d={ARROW_PATH}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          strokeDasharray:  PATH_LENGTH,
          strokeDashoffset: drawn ? 0 : PATH_LENGTH,
          transition:       'stroke-dashoffset 600ms ease-out',
        }}
      />
      <path
        d={ARROW_HEAD_A}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray:  40,
          strokeDashoffset: drawn ? 0 : 40,
          transition:       'stroke-dashoffset 350ms ease-out 400ms',
        }}
      />
    </svg>
  )
}

export default HandDrawnArrow
