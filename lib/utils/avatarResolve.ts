/**
 * Bridges the legacy `users.body_style` column (M1–F3) and the modern
 * `users.avatar_config` JSONB to one resolved AvatarPresetId.
 *
 * Route 1 architecture: the SVG preset is the single source of truth.
 * `body_style` is kept only so existing rows (pre-Route-1) keep rendering
 * something sensible until they pick a real preset.
 *
 * Each legacy id maps to a hero pose that matches its visual intent.
 */

import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR_PRESET_ID,
  createDefaultAvatarConfig,
  getAvatarPreset,
  isAvatarPresetId,
  normalizeAvatarConfig,
} from '@/src/features/avatar/data/avatarPresets'
import { DEFAULT_SKIN_TONE_ID } from '@/src/features/avatar/data/skinTones'
import type {
  AvatarPresetId,
  UserAvatarConfig,
} from '@/src/features/avatar/types'

/**
 * Six hero poses — these are the ones with hand-finished SVGs at launch.
 * Pick these first when surfacing a preset grid (onboarding, settings).
 */
export const HERO_PRESET_IDS = [
  'm-classic-straight',
  'm-soft-casual',
  'm-upright-confident',
  'f-confident-upright',
  'f-soft-side-lean',
  'f-relaxed-casual',
] as const satisfies readonly AvatarPresetId[]

export const HERO_PRESETS = HERO_PRESET_IDS.map(getAvatarPreset)

/**
 * Legacy mapping. M1/F1-style ids existed in v0 and a small number of
 * production users have these baked in. We map them to the closest
 * hero pose so their dashboard avatar still feels like *them* on first
 * load — they can re-pick a preset from settings later.
 */
const LEGACY_BODY_STYLE_MAP: Record<string, AvatarPresetId> = {
  M1: 'm-soft-casual',
  M2: 'm-classic-straight',
  M3: 'm-upright-confident',
  F1: 'f-confident-upright',
  F2: 'f-soft-side-lean',
  F3: 'f-relaxed-casual',
}

export interface AvatarSourceRow {
  avatar_config?: unknown
  body_style?: string | null
  head_front_url?: string | null
  head_back_url?: string | null
}

export interface ResolvedAvatar {
  presetId: AvatarPresetId
  config: UserAvatarConfig
  /**
   * True when the user has explicitly picked a preset (avatar_config.presetId
   * exists). False means we mapped from legacy body_style — caller may want
   * to nudge them to re-pick.
   */
  isExplicit: boolean
}

/**
 * Single entry point for "what does this user's avatar look like?".
 *
 * Priority order:
 *   1. `avatar_config.presetId` (modern, explicit)
 *   2. `body_style` mapped via {@link LEGACY_BODY_STYLE_MAP}
 *   3. {@link DEFAULT_AVATAR_PRESET_ID}
 *
 * Head image urls from the user row are merged in so callers do not have
 * to thread `head_front_url` separately on top of the resolved config.
 */
export function resolveAvatar(row?: AvatarSourceRow | null): ResolvedAvatar {
  if (!row) {
    return {
      presetId: DEFAULT_AVATAR_PRESET_ID,
      config: createDefaultAvatarConfig(),
      isExplicit: false,
    }
  }

  const configRaw = row.avatar_config ?? null
  const explicitPresetId =
    configRaw && typeof configRaw === 'object' && 'presetId' in configRaw &&
    isAvatarPresetId((configRaw as { presetId: unknown }).presetId)
      ? ((configRaw as { presetId: AvatarPresetId }).presetId)
      : null

  let presetId: AvatarPresetId
  let isExplicit: boolean

  if (explicitPresetId) {
    presetId = explicitPresetId
    isExplicit = true
  } else if (row.body_style && LEGACY_BODY_STYLE_MAP[row.body_style]) {
    presetId = LEGACY_BODY_STYLE_MAP[row.body_style]
    isExplicit = false
  } else {
    presetId = DEFAULT_AVATAR_PRESET_ID
    isExplicit = false
  }

  const normalized = configRaw
    ? normalizeAvatarConfig({ ...(configRaw as object), presetId })
    : createDefaultAvatarConfig(presetId)

  const config: UserAvatarConfig = {
    ...normalized,
    presetId,
    skinToneId: normalized.skinToneId ?? DEFAULT_SKIN_TONE_ID,
    frontFaceImageUrl: normalized.frontFaceImageUrl ?? row.head_front_url ?? undefined,
    backHairImageUrl: normalized.backHairImageUrl ?? row.head_back_url ?? undefined,
  }

  return { presetId, config, isExplicit }
}

export { AVATAR_PRESETS, getAvatarPreset, DEFAULT_AVATAR_PRESET_ID }
