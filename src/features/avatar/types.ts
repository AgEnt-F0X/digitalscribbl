export type AvatarCategory = 'masculine' | 'feminine'
export type AvatarSide = 'front' | 'back'

export type AvatarPresetId =
  | 'm-classic-straight'
  | 'm-relaxed-shoulder-tilt'
  | 'm-hands-behind-back'
  | 'm-broad-shoulders'
  | 'm-soft-casual'
  | 'm-oversized-shirt-fit'
  | 'm-subtle-forward-lean'
  | 'm-open-shoulder-relaxed'
  | 'm-upright-confident'
  | 'm-side-weight-shift'
  | 'f-soft-straight'
  | 'f-peace-sign'
  | 'f-shoulder-tilt'
  | 'f-oversized-shirt-fit'
  | 'f-hands-behind-back'
  | 'f-soft-side-lean'
  | 'f-relaxed-casual'
  | 'f-tiny-wave'
  | 'f-confident-upright'
  | 'f-inward-shoulder-pose'

export interface Transform2D {
  x: number
  y: number
  scale: number
  rotation: number
}

export interface AvatarPreset {
  id: AvatarPresetId
  category: AvatarCategory
  name: string
  frontSvgPath: string
  backSvgPath: string
  viewBox: [number, number, number, number]
  neckAnchor: { x: number; y: number }
  faceDefault: Transform2D
  backHairDefault: Transform2D
  shirtBounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface SkinTone {
  id: string
  name: string
  hex: string
}

export interface UserAvatarConfig {
  presetId: AvatarPresetId
  skinToneId: string
  frontFaceImageUrl?: string
  backHairImageUrl?: string
  frontFaceTransform: Transform2D
  backHairTransform: Transform2D
  lockedAt?: string
}
