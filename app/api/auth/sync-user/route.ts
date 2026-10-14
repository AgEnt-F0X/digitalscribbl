import { NextResponse } from 'next/server'
import { getServerAuthContext } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAccountKind, getAllowedEmailDomains } from '@/lib/utils/safetyAccess'
import { getPlatformFlags } from '@/lib/utils/platformFlags'

export const runtime = 'nodejs'

export async function POST() {
  // NOTE: this route runs at sign-in BEFORE the user row may exist, so it
  // can't use `requireApiUser` (which now refuses unknown users). We re-
  // implement the auth check inline and do our own status guard below.
  const context = await getServerAuthContext()
  if (!context.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user } = context
  if (!user.email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const kind = getAccountKind(user.email, getAllowedEmailDomains())
  const isUniversity = kind === 'university'

  const db = await createServiceClient()

  const { data: existing } = await db
    .from('users')
    .select('id, onboarding_completed, is_university_verified, is_guest, is_deleted')
    .eq('id', user.id)
    .maybeSingle()

  // Soft-deleted accounts: refuse without touching anything.
  if (existing?.is_deleted) {
    return NextResponse.json({ error: 'Account is closed', code: 'DELETED' }, { status: 403 })
  }

  if (!existing) {
    const flags = await getPlatformFlags(db)
    if (flags.disable_new_signups) {
      return NextResponse.json(
        { error: 'New signups are paused right now', code: 'SIGNUPS_DISABLED' },
        { status: 503 },
      )
    }

    const { error: insertError } = await db.from('users').insert({
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name ?? user.email.split('@')[0],
      onboarding_completed: !isUniversity,
      is_university_verified: isUniversity,
      is_guest: !isUniversity,
    })

    if (insertError) return NextResponse.json({ error: 'Could not create account' }, { status: 500 })

    if (isUniversity) {
      await db.from('shirts').insert({ owner_id: user.id, shirt_number: 1 })
    }

    return NextResponse.json({
      success: true,
      account_kind: kind,
      next: isUniversity ? '/onboarding' : '/onboarding/guest',
    })
  }

  if (existing.is_university_verified !== isUniversity || existing.is_guest !== !isUniversity) {
    // No permission to reconcile. Under the one-door model a shirt's access mode
    // belongs to the shirt and defaults to 'open', so signing in never has to
    // lock or unlock anything.
    await db
      .from('users')
      .update({ is_university_verified: isUniversity, is_guest: !isUniversity })
      .eq('id', user.id)
  }

  return NextResponse.json({
    success: true,
    account_kind: kind,
    next: !isUniversity ? '/onboarding/guest' : existing.onboarding_completed ? '/dashboard' : '/onboarding',
  })
}
