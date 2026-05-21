'use client'

import { cn } from '@/lib/utils/cn'
import { DEFAULT_SKIN_TONE_ID } from '../data/skinTones'
import type { AvatarPreset, AvatarPresetId } from '../types'
import AvatarRenderer from './AvatarRenderer'

interface AvatarPresetCardProps {
  preset: AvatarPreset
  selected: boolean
  onSelect: (id: AvatarPresetId) => void
}

export default function AvatarPresetCard({ preset, selected, onSelect }: AvatarPresetCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      className={cn(
        'rounded-[22px] border-2 bg-paper-100 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        selected ? 'border-ink-900 ring-4 ring-ink-900/10' : 'border-black/10 hover:border-ink-900/40'
      )}
    >
      <div className="rounded-2xl bg-paper-300 p-2">
        <AvatarRenderer
          presetId={preset.id}
          side="front"
          skinToneId={DEFAULT_SKIN_TONE_ID}
          frontFaceTransform={preset.faceDefault}
          backHairTransform={preset.backHairDefault}
          className="mx-auto max-w-[150px]"
        />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-900">{preset.name}</p>
    </button>
  )
}
