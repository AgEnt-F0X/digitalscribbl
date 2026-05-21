'use client'

import { cn } from '@/lib/utils/cn'
import type { CanvasMode } from '../types'

interface CanvasModeToggleProps {
  mode: CanvasMode
  onMode: (mode: CanvasMode) => void
  size?: 'sm' | 'md'
}

export default function CanvasModeToggle({ mode, onMode, size = 'md' }: CanvasModeToggleProps) {
  return (
    <div className="inline-flex rounded-2xl border border-black/10 bg-white p-1 shadow-sm">
      {([
        ['shirt', 'Shirt canvas'],
        ['outside-notes', 'Outside notes'],
      ] as const).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onMode(id)}
          className={cn(
            'min-h-11 rounded-xl font-bold transition',
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            mode === id ? 'bg-brand text-white shadow-sm' : 'text-ink-500 hover:bg-black/5',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
