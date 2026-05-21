import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { createDefaultAvatarConfig, isAvatarPresetId, normalizeTransform } from '@/src/features/avatar/data/avatarPresets'
import { isSkinToneId } from '@/src/features/avatar/data/skinTones'
import type { Transform2D, UserAvatarConfig } from '@/src/features/avatar/types'

export const runtime = 'nodejs'

function isTransform(input: unknown): input is Transform2D {
  if (!input || typeof input !== 'object') return false
  const value = input as Partial<Transform2D>
  return [value.x, value.y, value.scale, value.rotation].every(item => typeof item === 'number' && Number.isFinite(item))
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { supabase, user } = auth

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid avatar config' }, { status: 400 })
  }

  const raw = body as Partial<UserAvatarConfig>
  if (!isAvatarPresetId(raw.presetId)) {
    return NextResponse.json({ error: 'Unknown avatar preset' }, { status: 422 })
  }
  if (!isSkinToneId(raw.skinToneId)) {
    return NextResponse.json({ error: 'Unknown skin tone' }, { status: 422 })
  }
  if (!isTransform(raw.frontFaceTransform) || !isTransform(raw.backHairTransform)) {
    return NextResponse.json({ error: 'Invalid avatar transforms' }, { status: 422 })
  }

  const defaults = createDefaultAvatarConfig(raw.presetId)
  const avatarConfig: UserAvatarConfig = {
    presetId: raw.presetId,
    skinToneId: raw.skinToneId,
    frontFaceImageUrl: typeof raw.frontFaceImageUrl === 'string' ? raw.frontFaceImageUrl : undefined,
    backHairImageUrl: typeof raw.backHairImageUrl === 'string' ? raw.backHairImageUrl : undefined,
    frontFaceTransform: normalizeTransform(raw.frontFaceTransform, defaults.frontFaceTransform),
    backHairTransform: normalizeTransform(raw.backHairTransform, defaults.backHairTransform),
    lockedAt: typeof raw.lockedAt === 'string' ? raw.lockedAt : new Date().toISOString(),
  }

  const { error } = await supabase
    .from('users')
    .update({
      avatar_config: avatarConfig,
      head_front_url: avatarConfig.frontFaceImageUrl ?? null,
      head_back_url: avatarConfig.backHairImageUrl ?? null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Could not save avatar config' }, { status: 500 })
  return NextResponse.json({ success: true, avatar_config: avatarConfig })
}
