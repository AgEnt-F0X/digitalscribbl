import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  /** A single hand-drawn-feeling doodle or emoji. Keep it tiny (32–48px). */
  icon?: ReactNode
  /** Short emotional heading, will be rendered in handwritten font. */
  title: string
  /** Optional explanatory copy, kept brief and warm. */
  description?: string
  /** Optional primary action (typically a pencil-button). */
  action?: ReactNode
  className?: string
}

/**
 * The single empty-state component used across the app.
 * Always paper-note styled, always centered, always warm.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('paper-note px-6 py-8 text-center max-w-md mx-auto', className)}>
      {icon && (
        <div className="grid place-items-center text-3xl mb-3 text-ink-500" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-display text-2xl text-ink-900 leading-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex items-center justify-center">{action}</div>}
    </div>
  )
}
