'use client'

import { useMemo } from 'react'
import {
  SKIN_TONE_ANCHORS,
  skinToneFrom,
} from '@/lib/utils/skinTone'
import { cn } from '@/lib/utils/cn'

interface SkinToneSlidersProps {
  depth: number
  undertone: number
  onChange: (next: { depth: number; undertone: number; hex: string }) => void
  className?: string
}

/**
 * Curated skin-tone control — replaces the legacy 5-swatch
 * `SkinTonePicker`. Two sliders: lightness (`depth`, 0–100) and a small
 * cool ↔ warm bias (`undertone`, -50…+50). The interpolation is owned by
 * `lib/utils/skinTone.ts` so every surface in the app speaks the same
 * curated language.
 *
 * Why two axes: a single lightness ramp averages every depth band but
 * lands wrong for the ~40% of users whose skin reads as markedly warm or
 * cool. The undertone slider is a bounded nudge — curated range only, no
 * raw colour picker — that lets people land closer to a tone they
 * recognise as theirs without inviting moderation problems.
 */
export default function SkinToneSliders({ depth, undertone, onChange, className }: SkinToneSlidersProps) {
  const current = useMemo(() => skinToneFrom(depth, undertone), [depth, undertone])
  const depthTrack = useMemo(
    () => `linear-gradient(to right, ${SKIN_TONE_ANCHORS.map(a => a.hex).join(', ')})`,
    [],
  )
  // Undertone preview reflects the user's current depth, not a static
  // reference band — so a dark-skin user sees what cool/warm means for
  // their tone, not for a fair-skin reference.
  const undertoneTrack = useMemo(
    () =>
      `linear-gradient(to right, ${[-50, -25, 0, 25, 50]
        .map(u => skinToneFrom(depth, u).hex)
        .join(', ')})`,
    [depth],
  )

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <span className="label mb-0">Skin tone</span>
        <span
          className="inline-flex h-7 w-7 rounded-full border border-black/15 shadow-inner"
          style={{ backgroundColor: current.hex }}
          aria-label={`Current skin preview, hex ${current.hex}`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Light</span>
          <span className="font-medium text-ink-900">Depth</span>
          <span>Deep</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={depth}
          onChange={e => {
            const nextDepth = Number(e.target.value)
            onChange({
              depth: nextDepth,
              undertone,
              hex: skinToneFrom(nextDepth, undertone).hex,
            })
          }}
          aria-label={`Skin depth (${depth} of 100)`}
          className="mt-1 h-3 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: depthTrack }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Cool</span>
          <span className="font-medium text-ink-900">Undertone</span>
          <span>Warm</span>
        </div>
        <input
          type="range"
          min={-50}
          max={50}
          value={undertone}
          onChange={e => {
            const nextUndertone = Number(e.target.value)
            onChange({
              depth,
              undertone: nextUndertone,
              hex: skinToneFrom(depth, nextUndertone).hex,
            })
          }}
          aria-label={`Skin undertone (${undertone}, range -50 cool to 50 warm)`}
          className="mt-1 h-3 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: undertoneTrack }}
        />
      </div>

      <p className="text-xs text-ink-500/80">
        Two sliders — lightness and warmth. Curated range only; no raw colour picker.
      </p>
    </div>
  )
}
