import type { AvatarCategory, AvatarPreset, AvatarPresetId, Transform2D, UserAvatarConfig } from '../types.ts'
import { DEFAULT_SKIN_TONE_ID } from './skinTones.ts'

const VIEW_BOX: [number, number, number, number] = [0, 0, 400, 600]
const NECK_ANCHOR = { x: 200, y: 142 }
const FACE_DEFAULT: Transform2D = { x: 200, y: 92, scale: 1, rotation: 0 }
const BACK_HAIR_DEFAULT: Transform2D = { x: 200, y: 92, scale: 1, rotation: 0 }
const SHIRT_BOUNDS = { x: 48, y: 134, width: 304, height: 440 }

const MASCULINE_IDS = [
  ['m-classic-straight', 'Classic straight'],
  ['m-relaxed-shoulder-tilt', 'Relaxed shoulder tilt'],
  ['m-hands-behind-back', 'Hands behind back'],
  ['m-broad-shoulders', 'Broad shoulders'],
  ['m-soft-casual', 'Soft casual'],
  ['m-oversized-shirt-fit', 'Oversized shirt fit'],
  ['m-subtle-forward-lean', 'Subtle forward lean'],
  ['m-open-shoulder-relaxed', 'Open shoulder relaxed'],
  ['m-upright-confident', 'Upright confident'],
  ['m-side-weight-shift', 'Side weight shift'],
] as const

const FEMININE_IDS = [
  ['f-soft-straight', 'Soft straight'],
  ['f-peace-sign', 'Peace sign'],
  ['f-shoulder-tilt', 'Shoulder tilt'],
  ['f-oversized-shirt-fit', 'Oversized shirt fit'],
  ['f-hands-behind-back', 'Hands behind back'],
  ['f-soft-side-lean', 'Soft side lean'],
  ['f-relaxed-casual', 'Relaxed casual'],
  ['f-tiny-wave', 'Tiny wave'],
  ['f-confident-upright', 'Confident upright'],
  ['f-inward-shoulder-pose', 'Inward shoulder pose'],
] as const

function preset(category: AvatarCategory, id: AvatarPresetId, name: string): AvatarPreset {
  return {
    id,
    category,
    name,
    frontSvgPath: `/src/assets/scribbl/avatar-presets/${category}/${id}/${id}-front.svg`,
    backSvgPath: `/src/assets/scribbl/avatar-presets/${category}/${id}/${id}-back.svg`,
    viewBox: VIEW_BOX,
    neckAnchor: NECK_ANCHOR,
    faceDefault: FACE_DEFAULT,
    backHairDefault: BACK_HAIR_DEFAULT,
    shirtBounds: SHIRT_BOUNDS,
  }
}

export const AVATAR_PRESETS = [
  ...MASCULINE_IDS.map(([id, name]) => preset('masculine', id, name)),
  ...FEMININE_IDS.map(([id, name]) => preset('feminine', id, name)),
] as const satisfies readonly AvatarPreset[]

export const DEFAULT_AVATAR_PRESET_ID: AvatarPresetId = 'm-classic-straight'

export function getAvatarPreset(id?: string | null): AvatarPreset {
  return AVATAR_PRESETS.find(p => p.id === id) ?? AVATAR_PRESETS[0]
}

export function getAvatarPresetsByCategory(category: AvatarCategory): AvatarPreset[] {
  return AVATAR_PRESETS.filter(presetItem => presetItem.category === category)
}

export function isAvatarPresetId(id: unknown): id is AvatarPresetId {
  return typeof id === 'string' && AVATAR_PRESETS.some(presetItem => presetItem.id === id)
}

export function createDefaultAvatarConfig(presetId: AvatarPresetId = DEFAULT_AVATAR_PRESET_ID): UserAvatarConfig {
  const selectedPreset = getAvatarPreset(presetId)
  return {
    presetId: selectedPreset.id,
    skinToneId: DEFAULT_SKIN_TONE_ID,
    frontFaceTransform: { ...selectedPreset.faceDefault },
    backHairTransform: { ...selectedPreset.backHairDefault },
  }
}

export function normalizeAvatarConfig(input: unknown): UserAvatarConfig {
  if (!input || typeof input !== 'object') return createDefaultAvatarConfig()
  const value = input as Partial<UserAvatarConfig>
  const presetItem = getAvatarPreset(value.presetId)
  const defaults = createDefaultAvatarConfig(presetItem.id)
  return {
    ...defaults,
    skinToneId: typeof value.skinToneId === 'string' ? value.skinToneId : defaults.skinToneId,
    frontFaceImageUrl: typeof value.frontFaceImageUrl === 'string' ? value.frontFaceImageUrl : undefined,
    backHairImageUrl: typeof value.backHairImageUrl === 'string' ? value.backHairImageUrl : undefined,
    frontFaceTransform: normalizeTransform(value.frontFaceTransform, presetItem.faceDefault),
    backHairTransform: normalizeTransform(value.backHairTransform, presetItem.backHairDefault),
    lockedAt: typeof value.lockedAt === 'string' ? value.lockedAt : undefined,
  }
}

export function normalizeTransform(input: unknown, fallback: Transform2D): Transform2D {
  if (!input || typeof input !== 'object') return { ...fallback }
  const value = input as Partial<Transform2D>
  return {
    x: finiteOr(value.x, fallback.x),
    y: finiteOr(value.y, fallback.y),
    scale: Math.max(0.35, Math.min(2.8, finiteOr(value.scale, fallback.scale))),
    rotation: Math.max(-18, Math.min(18, finiteOr(value.rotation, fallback.rotation))),
  }
}

function finiteOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
