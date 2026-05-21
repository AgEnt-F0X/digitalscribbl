'use client'

import { cn } from '@/lib/utils/cn'
import { HANDWRITING_STYLES } from '../data/handwritingStyles'

interface HandwritingStylePickerProps {
  value: string
  onChange: (styleId: string) => void
  variant?: 'stack' | 'grid'
}

export default function HandwritingStylePicker({ value, onChange, variant = 'stack' }: HandwritingStylePickerProps) {
  return (
    <div>
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Handwriting</p>
      <div className={cn(variant === 'grid' ? 'grid grid-cols-2 gap-2' : 'grid gap-2')}>
        {HANDWRITING_STYLES.map(style => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={cn(
              'min-h-14 rounded-2xl border bg-white px-3 py-2 text-left transition hover:bg-black/5',
              value === style.id
                ? 'border-brand ring-2 ring-brand/30'
                : 'border-black/10',
            )}
          >
            <span className="block text-xs font-semibold text-ink-500">{style.label}</span>
            <span
              className="block truncate text-base text-ink-900"
              style={{
                fontFamily: style.fontFamily,
                fontWeight: 'defaultWeight' in style ? style.defaultWeight : undefined,
              }}
            >
              {style.sampleText}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
