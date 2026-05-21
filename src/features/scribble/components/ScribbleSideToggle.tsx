'use client'

import { cn } from '@/lib/utils/cn'
import type { ShirtSide } from '../types'

interface ScribbleSideToggleProps {
  side: ShirtSide
  onSide: (side: ShirtSide) => void
  size?: 'sm' | 'md'
}

export default function ScribbleSideToggle({ side, onSide, size = 'md' }: ScribbleSideToggleProps) {
  return (
    <div className="inline-flex rounded-2xl border border-black/10 bg-white/75 p-1 shadow-sm">
      {(['front', 'back'] as const).map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onSide(option)}
          className={cn(
            'min-h-11 rounded-xl font-semibold transition',
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            side === option ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-black/5',
          )}
        >
          {option === 'front' ? 'Front' : 'Back'}
        </button>
      ))}
    </div>
  )
}
