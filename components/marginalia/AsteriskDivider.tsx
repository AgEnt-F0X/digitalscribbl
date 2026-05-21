// Asterisk divider — three Unicode ✶ glyphs centered between sections on
// signature pages. Doc 18 § 8. Caveat 18-20px in ink-500. Always decorative.

import { cn } from '@/lib/utils/cn'

interface AsteriskDividerProps {
  className?: string
}

export function AsteriskDivider({ className }: AsteriskDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'my-8 flex items-center justify-center gap-4 text-eyebrow-display text-ink-500 select-none',
        className,
      )}
    >
      <span>✶</span>
      <span>✶</span>
      <span>✶</span>
    </div>
  )
}

export default AsteriskDivider
