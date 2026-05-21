import type { SkinTone } from '../types.ts'

export const SKIN_TONES = [
  { id: 'skin_01_light_warm', name: 'Light warm', hex: '#F0C7A8' },
  { id: 'skin_02_wheat', name: 'Wheat', hex: '#D9A06F' },
  { id: 'skin_03_medium_brown', name: 'Medium brown', hex: '#A96843' },
  { id: 'skin_04_deep_brown', name: 'Deep brown', hex: '#6F3F2B' },
  { id: 'skin_05_cool_tan', name: 'Cool tan', hex: '#C38B6A' },
] as const satisfies readonly SkinTone[]

export type SkinToneId = (typeof SKIN_TONES)[number]['id']

export const DEFAULT_SKIN_TONE_ID: SkinToneId = 'skin_02_wheat'

export function getSkinTone(id?: string | null): SkinTone {
  return SKIN_TONES.find(tone => tone.id === id) ?? SKIN_TONES[1]
}

export function isSkinToneId(id: unknown): id is SkinToneId {
  return typeof id === 'string' && SKIN_TONES.some(tone => tone.id === id)
}
