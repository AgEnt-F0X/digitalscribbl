'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { resolveAvatar, type AvatarSourceRow } from '@/lib/utils/avatarResolve'
import AvatarRenderer from '@/src/features/avatar/components/AvatarRenderer'
import type { AvatarPresetId, UserAvatarConfig } from '@/src/features/avatar/types'

/**
 * The single avatar component for the entire app (Route 1).
 *
 * Caller patterns:
 *
 *  1) Modern — pass the full user row, we resolve the preset:
 *     <Avatar row={profile} size="md" />
 *
 *  2) Pre-resolved — pass an explicit config (e.g. from `resolveAvatar`):
 *     <Avatar config={resolved.config} size="md" />
 *
 *  3) Lightweight — pass just a presetId (no head image, no skin tone):
 *     <Avatar presetId="m-classic-straight" size="sm" />
 *
 * The old `AvatarDisplay` props (`bodyStyle`, `headFrontUrl`,
 * `shirtColor`, `showBack`, etc.) are also accepted for migration ease.
 * `shirtColor` is now decorative-only — the shirt is always the same
 * white scribbling surface.
 */

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

const SIZE_TO_MAX_WIDTH_PX: Record<AvatarSize, number> = {
  sm: 80,
  md: 156,
  lg: 240,
  xl: 340,
  hero: 440,
}

export interface AvatarProps {
  /** Pass the full user row — easiest for page migrations. */
  row?: AvatarSourceRow | null
  /** Pre-resolved config (from `resolveAvatar`). Beats `row` when both passed. */
  config?: UserAvatarConfig
  /** Direct preset id — minimal usage (e.g. small cards). Beats both above. */
  presetId?: AvatarPresetId

  /** Legacy compatibility (will resolve via `body_style` map). */
  bodyStyle?: string | null
  headFrontUrl?: string | null
  headBackUrl?: string | null

  /** Show the back of the shirt (alias for `side="back"`). */
  showBack?: boolean
  /** Modern API. Beats `showBack`. */
  side?: 'front' | 'back'

  size?: AvatarSize
  className?: string

  /** Owner display name — threads into aria labels for screen readers. */
  displayName?: string

  /**
   * Existing scribbles painted onto the shirt. Each item references a
   * `scribbles.canvas_svg` blob normalised into the 400x600 shirt-coordinate
   * space.
   */
  scribbles?: {
    id: string
    x: number
    y: number
    w: number
    h: number
    canvas_svg: string | null
  }[]

  /** Optional badge count rendered at the bottom-right. */
  scribbleCount?: number
}

export default function Avatar({
  row,
  config,
  presetId,
  bodyStyle,
  headFrontUrl,
  headBackUrl,
  showBack,
  side,
  size = 'lg',
  className,
  displayName,
  scribbles = [],
  scribbleCount,
}: AvatarProps) {
  const resolved = useMemo<UserAvatarConfig>(() => {
    if (config) return config

    if (presetId) {
      const base = resolveAvatar({
        avatar_config: { presetId },
        head_front_url: headFrontUrl ?? null,
        head_back_url: headBackUrl ?? null,
      })
      return base.config
    }

    return resolveAvatar(
      row ?? {
        body_style: bodyStyle ?? null,
        head_front_url: headFrontUrl ?? null,
        head_back_url: headBackUrl ?? null,
      },
    ).config
  }, [config, presetId, row, bodyStyle, headFrontUrl, headBackUrl])

  const renderSide = side ?? (showBack ? 'back' : 'front')
  const ownerLabel = displayName?.trim()
  const a11yLabel = ownerLabel ? `${ownerLabel}'s avatar` : 'Scribbl avatar'

  return (
    <div
      className={cn('relative inline-flex flex-col items-center justify-start', className)}
      style={{ width: '100%', maxWidth: SIZE_TO_MAX_WIDTH_PX[size] }}
      aria-label={a11yLabel}
    >
      <AvatarRenderer
        presetId={resolved.presetId}
        side={renderSide}
        skinToneId={resolved.skinToneId}
        frontFaceImageUrl={resolved.frontFaceImageUrl ?? null}
        backHairImageUrl={resolved.backHairImageUrl ?? null}
        frontFaceTransform={resolved.frontFaceTransform}
        backHairTransform={resolved.backHairTransform}
        scribbles={scribbles}
        className="w-full"
      />

      {typeof scribbleCount === 'number' && (
        <div className="absolute -bottom-1 right-2 min-w-[24px] rounded-full bg-ink-900 px-2 py-0.5 text-center text-[11px] font-bold leading-none text-white shadow-sm">
          {scribbleCount}
        </div>
      )}
    </div>
  )
}
