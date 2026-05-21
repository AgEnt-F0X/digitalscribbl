import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAccountKind, getAllowedEmailDomains } from '@/lib/utils/safetyAccess'
import { getPlatformFlags } from '@/lib/utils/platformFlags'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code     = searchParams.get('code')
  const rawNext  = searchParams.get('next') ?? '/dashboard'
  // Validate next: must be a relative path that is not an API route
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('/api/') && !rawNext.startsWith('//'))
    ? rawNext
    : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (!user.email) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=missing_email`)
  }

  const accountKind = getAccountKind(user.email, getAllowedEmailDomains())
  const isUniversity = accountKind === 'university'
  const db = await createServiceClient()

  // Upsert user row (first sign-in creates the record)
  const { data: existingUser } = await db
    .from('users')
    .select('id, onboarding_completed, is_university_verified, is_guest, is_deleted')
    .eq('id', user.id)
    .maybeSingle()

  // Soft-deleted accounts: refuse the session even though Google handed us
  // a valid token. proxy.ts catches them on page nav too, but doing it here
  // closes the gap where a deleted user re-logs in to revive their data.
  if (existingUser?.is_deleted) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?reason=deleted`)
  }

  if (!existingUser) {
    const flags = await getPlatformFlags(db)
    if (flags.disable_new_signups) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?reason=signups_closed`)
    }

    const { error: insertError } = await db.from('users').insert({
      id:           user.id,
      email:        user.email,
      display_name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
      onboarding_completed: !isUniversity,
      shirt_permission: isUniversity ? 'open' : 'locked',
      is_university_verified: isUniversity,
      is_guest: !isUniversity,
    })

    if (insertError) {
      console.error('Google callback user insert failed:', insertError)
      return NextResponse.redirect(`${origin}/login?error=profile_create_failed`)
    }

    if (isUniversity) {
      await db.from('shirts').insert({ owner_id: user.id, shirt_number: 1 })
      return NextResponse.redirect(`${origin}/onboarding`)
    }

    return NextResponse.redirect(`${origin}/onboarding/guest`)
  }

  const profileUpdates: {
    last_seen: string
    is_university_verified: boolean
    is_guest: boolean
    shirt_permission?: string
  } = {
    last_seen: new Date().toISOString(),
    is_university_verified: isUniversity,
    is_guest: !isUniversity,
  }
  if (!isUniversity) profileUpdates.shirt_permission = 'locked'

  await db
    .from('users')
    .update(profileUpdates)
    .eq('id', user.id)

  if (!isUniversity) {
    return NextResponse.redirect(`${origin}/onboarding/guest`)
  }

  if (isUniversity && !existingUser.onboarding_completed) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
