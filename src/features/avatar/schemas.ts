import { z } from 'zod'
import { AVATAR_PRESETS } from './data/avatarPresets'
import { SKIN_TONES } from './data/skinTones'

const presetIds = AVATAR_PRESETS.map(p => p.id) as [string, ...string[]]
const skinToneIds = SKIN_TONES.map(t => t.id) as [string, ...string[]]

export const transform2dSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  scale: z.number().min(0.35).max(2.8),
  rotation: z.number().min(-18).max(18),
})

export const skinToneConfigSchema = z.object({
  depth: z.number().int().min(0).max(100),
  undertone: z.number().int().min(-50).max(50),
  hex: z.string().regex(/^#[0-9a-f]{6}$/i),
})

export const avatarConfigSchema = z.object({
  presetId: z.string().refine(val => (presetIds as readonly string[]).includes(val), {
    message: 'Invalid presetId',
  }),
  skinToneId: z.string().refine(val => (skinToneIds as readonly string[]).includes(val), {
    message: 'Invalid skinToneId',
  }),
  skinTone: skinToneConfigSchema.optional(),
  frontFaceImageUrl: z.string().url().optional(),
  backHairImageUrl: z.string().url().optional(),
  frontFaceTransform: transform2dSchema,
  backHairTransform: transform2dSchema,
  headSource: z.enum(['upload', 'skipped']).optional(),
  lockedAt: z.string().datetime().optional(),
})

export const onboardingCompleteSchema = z.object({
  displayName: z.string().min(1).max(100),
  enrollmentNumber: z.string().min(1).max(50),
  batchId: z.string().uuid(),
  academicGroupId: z.string().uuid(),
  programId: z.string().uuid(),
  avatarConfig: avatarConfigSchema,
})
