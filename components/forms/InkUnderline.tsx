// InkUnderline — SVG wave that draws itself under a focused input.
// Doc 18 § 14. Stays drawn while the field has a value; erases right-to-left
// when the user clears it back to empty.

import { cn } from '@/lib/utils/cn'

interface InkUnderlineProps {
  active: boolean
  className?: string
}

const PATH_LENGTH = 200

export function InkUnderline({ active, className }: InkUnderlineProps) {
  return (
    <svg
      className={cn(
        'ink-underline pointer-events-none absolute inset-x-0 -bottom-1 h-2',
        className,
      )}
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 4 Q 50 1 100 4 T 198 4"
        stroke="var(--ink-bleed)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray:  PATH_LENGTH,
          strokeDashoffset: active ? 0 : PATH_LENGTH,
          transition:       'stroke-dashoffset 350ms ease-out',
        }}
      />
    </svg>
  )
}

export default InkUnderline
