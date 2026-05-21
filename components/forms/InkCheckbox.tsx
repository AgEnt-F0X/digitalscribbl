'use client'

// InkCheckbox — controlled checkbox styled as a paper-and-ink mark.
// Doc 18 § 14. The check stroke draws in on change; cubic-bezier overshoot
// at the tail gives the "lifted the pen" feel.

import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/utils/cn'

interface InkCheckboxProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  /** Pass-through id for label[for]. */
  id?: string
  /** Override aria-label when no visible label is rendered. */
  ariaLabel?: string
}

const CHECK_LENGTH = 20

export function InkCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  id,
  ariaLabel,
}: InkCheckboxProps) {
  const toggle = () => {
    if (disabled) return
    onChange(!checked)
  }

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-2 select-none',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        id={id}
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKey}
        className={cn(
          'relative inline-grid place-items-center',
          'min-h-[44px] min-w-[44px] p-2 rounded-lg',
          'transition-colors',
          'focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--brand)]',
        )}
      >
        <span
          className={cn(
            'relative grid place-items-center',
            'h-6 w-6 rounded-md border bg-white',
            'transition-colors',
          )}
          style={{
            borderColor: checked ? 'var(--ink-bleed)' : 'var(--line-strong)',
          }}
        >
          <svg
            className="ink-check absolute inset-0 m-auto"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path
              d="M3 8 L7 12 L13 4"
              stroke="var(--ink-bleed)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray:  CHECK_LENGTH,
                strokeDashoffset: checked ? 0 : CHECK_LENGTH,
                transition:       'stroke-dashoffset 250ms cubic-bezier(0.45, 1.4, 0.6, 1)',
              }}
            />
          </svg>
        </span>
      </button>
      {label ? (
        <span className="text-sm text-ink-900">{label}</span>
      ) : null}
    </label>
  )
}

export default InkCheckbox
