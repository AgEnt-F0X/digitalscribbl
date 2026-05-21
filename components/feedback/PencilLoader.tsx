// PencilLoader — pencil drawing a wavy line, replaces Lucide spinners in
// "submitting" button states. Doc 18 § 14.

import { cn } from '@/lib/utils/cn'

interface PencilLoaderProps {
  className?: string
  /** Accessible label for assistive tech; defaults to "Loading". */
  label?: string
}

export function PencilLoader({ className, label = 'Loading' }: PencilLoaderProps) {
  return (
    <svg
      className={cn('inline-block', className)}
      viewBox="0 0 40 20"
      width="40"
      height="20"
      role="img"
      aria-label={label}
    >
      <path
        d="M2 12 Q 12 6 22 12 T 38 12"
        stroke="var(--ink-bleed)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0,40;40,0"
          dur="700ms"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  )
}

export default PencilLoader
