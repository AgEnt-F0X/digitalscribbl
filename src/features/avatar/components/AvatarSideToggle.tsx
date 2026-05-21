'use client'

import { cn } from '@/lib/utils/cn'
import type { AvatarSide } from '../types'

interface AvatarSideToggleProps {
  side: AvatarSide
  onSide: (side: AvatarSide) => void
}

export default function AvatarSideToggle({ side, onSide }: AvatarSideToggleProps) {
  return (
    <div className="inline-flex rounded-2xl border border-black/10 bg-white/70 p-1 shadow-sm">
      {(['front', 'back'] as const).map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onSide(option)}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-semibold transition',
            side === option ? 'bg-ink-900 text-white shadow-sm' : 'text-ink-900 hover:bg-black/5'
          )}
        >
          {option === 'front' ? 'Front' : 'Back'}
        </button>
      ))}
    </div>
  )
}
