import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { onboardingCompleteSchema } from '@/src/features/avatar/schemas'
import { normalizeAvatarConfig } from '@/src/features/avatar/data/avatarPresets'

export const runtime = 'nodejs'

function generateSlug(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  const suffix = nanoid(8)
  return `${base}-${suffix}`
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = auth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = onboardingCompleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { displayName, enrollmentNumber, batchId, academicGroupId, programId, avatarConfig } = parsed.data

  const slug = generateSlug(displayName)
  const normalizedConfig = normalizeAvatarConfig(avatarConfig)
  const now = new Date().toISOString()

  const serviceDb = await createServiceClient()

  const { error: updateErr } = await serviceDb
    .from('users')
    .update({
      display_name: displayName.trim(),
      enrollment_number: enrollmentNumber.trim(),
      academic_group_id: academicGroupId,
      program_id: programId,
      batch_id: batchId,
      avatar_config: normalizedConfig,
      onboarding_completed: true,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to save profile', detail: updateErr.message }, { status: 500 })
  }

  const { error: slugErr } = await serviceDb
    .from('profile_slugs')
    .insert({ slug, user_id: user.id, is_current: true })

  if (slugErr) {
    if (slugErr.code === '23505') {
      return NextResponse.json({ slug: null, profile_slug_conflict: true }, { status: 200 })
    }
    return NextResponse.json({ error: 'Failed to create profile slug', detail: slugErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, slug })
}
