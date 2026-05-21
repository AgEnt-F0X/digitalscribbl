'use client'

import { cn } from '@/lib/utils/cn'
import { SCRIBBL_STICKERS } from '../data/stickers'

interface StickerPickerProps {
  onSelect: (stickerId: string) => void
  heading?: boolean
  columns?: number
}

export default function StickerPicker({ onSelect, heading = true, columns = 6 }: StickerPickerProps) {
  const gridClass = columns === 4
    ? 'grid-cols-4'
    : columns === 6
      ? 'grid-cols-6'
      : 'grid-cols-3'

  return (
    <div>
      {heading && (
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-2xl font-bold text-ink-900">Quick stickers</p>
          <span className="text-xs font-semibold text-brand">12 ready</span>
        </div>
      )}
      <div className={cn('grid gap-2', gridClass)}>
        {SCRIBBL_STICKERS.map(sticker => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => onSelect(sticker.id)}
            title={sticker.label}
            aria-label={sticker.label}
            className="flex aspect-square min-h-14 min-w-14 items-center justify-center rounded-2xl border border-black/10 bg-white text-2xl shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
          >
            {sticker.symbol}
          </button>
        ))}
      </div>
    </div>
  )
}
