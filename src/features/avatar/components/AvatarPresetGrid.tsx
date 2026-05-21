'use client'

import { getAvatarPresetsByCategory } from '../data/avatarPresets'
import type { AvatarCategory, AvatarPresetId } from '../types'
import AvatarPresetCard from './AvatarPresetCard'

interface AvatarPresetGridProps {
  category: AvatarCategory
  selectedPresetId: AvatarPresetId
  onSelect: (id: AvatarPresetId) => void
}

export default function AvatarPresetGrid({ category, selectedPresetId, onSelect }: AvatarPresetGridProps) {
  const presets = getAvatarPresetsByCategory(category)

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {presets.map(preset => (
        <AvatarPresetCard
          key={preset.id}
          preset={preset}
          selected={preset.id === selectedPresetId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
