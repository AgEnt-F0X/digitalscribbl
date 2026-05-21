// AvatarHalo — soft brand-soft radial gradient behind the user's avatar.
// Doc 18 § 8 (round-5 primitive, confirmed by the avatar-view concept image).
// Decorative: sits at z-0 so the avatar (z-1) reads in front without card chrome.

import { cn } from '@/lib/utils/cn'

type Length = number | string

interface AvatarHaloProps {
  width?: Length
  height?: Length
  top?: Length
  left?: Length
  right?: Length
  bottom?: Length
  className?: string
}

function toCss(value: Length | undefined): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

export function AvatarHalo({
  width = '70%',
  height = '40%',
  top,
  left,
  right,
  bottom,
  className,
}: AvatarHaloProps) {
  // Default placement: centred horizontally + 30%-from-top vertically — sits
  // behind a head/shoulders avatar without bleeding past it.
  const resolvedTop    = toCss(top)    ?? (bottom === undefined ? '30%' : undefined)
  const resolvedLeft   = toCss(left)   ?? (right  === undefined ? '50%' : undefined)

  return (
    <div
      aria-hidden="true"
      className={cn('avatar-halo', className)}
      style={{
        width:  toCss(width),
        height: toCss(height),
        top:    resolvedTop,
        left:   resolvedLeft,
        right:  toCss(right),
        bottom: toCss(bottom),
        // When defaulting to left:50% we need a -50% translate to recentre.
        transform: left === undefined && right === undefined ? 'translateX(-50%)' : undefined,
      }}
    />
  )
}

export default AvatarHalo
