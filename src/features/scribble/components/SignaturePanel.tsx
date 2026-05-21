'use client'

import { Send } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CANVAS_COLORS } from '@/lib/constants'
import { HANDWRITING_STYLES } from '../data/handwritingStyles'

interface SignaturePanelProps {
  fontStyleId: string
  color: string
  fontSize: number
  onFontStyle: (id: string) => void
  onColor: (color: string) => void
  onFontSize: (size: number) => void
  onExit: () => void
  onPublish: () => void
  canPublish: boolean
  isSaving: boolean
  variant?: 'desktop' | 'mobile'
}

/**
 * The signature-mode inspector. It collapses the full studio toolbar to just
 * the three controls a signer needs: font, colour, size — plus a big "Sign"
 * CTA and an escape hatch back to the full canvas. The signature text is
 * placed on the Fabric canvas by the parent (ScribbleStudio) so this panel
 * does not need to touch the canvas directly.
 */
export default function SignaturePanel({
  fontStyleId,
  color,
  fontSize,
  onFontStyle,
  onColor,
  onFontSize,
  onExit,
  onPublish,
  canPublish,
  isSaving,
  variant = 'desktop',
}: SignaturePanelProps) {
  const isMobile = variant === 'mobile'

  const body = (
    <div className="space-y-4">
      <div>
        <p className="font-display text-2xl font-bold text-ink-900">Signature mode</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">
          Edit the text on the shirt, pick a handwriting style and a colour,
          then tap Sign. You can return to the full canvas any time.
        </p>
      </div>

      <div>
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Handwriting</p>
        <div className="grid grid-cols-2 gap-2">
          {HANDWRITING_STYLES.map(style => (
            <button
              key={style.id}
              type="button"
              onClick={() => onFontStyle(style.id)}
              title={style.label}
              className={cn(
                'min-h-14 rounded-2xl border bg-white px-3 py-2 text-left transition hover:bg-black/5',
                fontStyleId === style.id ? 'border-brand ring-2 ring-brand/30' : 'border-black/10',
              )}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">{style.label}</span>
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

      <div>
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Colour</p>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {CANVAS_COLORS.map(item => {
            const active = color === item
            return (
              <button
                key={item}
                type="button"
                title={item}
                aria-label={`Use signature colour ${item}`}
                aria-pressed={active}
                onClick={() => onColor(item)}
                className={cn(
                  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition',
                  active ? 'bg-brand-soft' : 'hover:bg-black/5',
                )}
              >
                <span
                  className={cn(
                    'block h-7 w-7 rounded-full border-2 shadow-sm',
                    active ? 'scale-110 border-brand' : 'border-white',
                  )}
                  style={{ background: item }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Size</p>
          <span className="text-xs font-semibold text-ink-500">{fontSize}pt</span>
        </div>
        <input
          type="range"
          min={18}
          max={72}
          step={2}
          value={fontSize}
          onChange={event => onFontSize(Number(event.target.value))}
          aria-label="Signature size"
          className="h-6 w-full accent-brand"
        />
      </div>

      <button
        type="button"
        onClick={onPublish}
        disabled={!canPublish || isSaving}
        className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Send size={16} />
        {isSaving ? 'Signing...' : 'Sign'}
      </button>

      <button
        type="button"
        onClick={onExit}
        className="block w-full text-center text-xs font-semibold text-brand underline-offset-2 hover:underline"
      >
        Use full canvas instead
      </button>
    </div>
  )

  return isMobile
    ? <div>{body}</div>
    : <aside className="sketch-panel p-4">{body}</aside>
}
