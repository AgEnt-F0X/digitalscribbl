import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import BottomNav from '@/components/nav/BottomNav'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import ProfileForm from './ProfileForm'
import HeadUpload from './HeadUpload'
import { ROUTES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { supabase, user, isBypass } = await requirePageUser()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, yearbook_quote, thank_you_message, shirt_permission, body_style, shirt_color, head_front_url, head_back_url, avatar_config')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const { data: shirt } = await supabase
    .from('shirts')
    .select('id, shirt_number, is_locked')
    .eq('owner_id', user.id)
    .order('shirt_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="scribbl-page min-h-screen pb-24 md:pb-0">
      <nav className="sticky top-0 z-30 border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link href="/dashboard" className="font-display font-bold text-xl text-ink-900">scribbl</Link>
          <div className="flex items-center gap-3">
            <Link href={ROUTES.profile(user.id)} className="text-sm text-ink-500 hover:text-ink-900 transition">
              My shirt
            </Link>
            <NotificationBell userId={user.id} />
            <Link href={ROUTES.profile(user.id)}>
              <Avatar
                row={profile}
                displayName={profile.display_name}
                size="sm"
              />
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-8">
        <header className="flex items-center gap-3 mb-2">
          <Link href={ROUTES.profile(user.id)} aria-label="Back to profile" className="text-ink-500 hover:text-ink-900 transition">←</Link>
          <h1 className="text-hero-display">Settings</h1>
        </header>
        <p className="text-nostalgia mb-8">A quiet utility surface. Edit what you need; everything else stays on the substrate.</p>

        <section aria-labelledby="face-photos-heading" className="sketch-panel p-6 mb-2">
          <h2 id="face-photos-heading" className="text-eyebrow-display">Face photos</h2>
          <p className="text-xs text-ink-500 mb-5 mt-1">
            Your face is circle-cropped and placed on your avatar. Front is shown by default, back is revealed on the back panel.
          </p>
          <div className="flex gap-8 justify-center">
            <HeadUpload side="front" currentUrl={profile.head_front_url} />
            <HeadUpload side="back"  currentUrl={profile.head_back_url} />
          </div>
        </section>

        <AsteriskDivider />

        <section aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-eyebrow-display mb-4">Profile</h2>
          <ProfileForm
            initial={{
              display_name:     profile.display_name,
              yearbook_quote:   profile.yearbook_quote,
              thank_you_message: profile.thank_you_message,
              shirt_permission: profile.shirt_permission,
              body_style:       profile.body_style,
              shirt_color:      profile.shirt_color,
              shirt_id:         shirt?.id ?? null,
              shirt_locked:     shirt?.is_locked ?? false,
            }}
          />
        </section>

        <AsteriskDivider />

        <section aria-labelledby="account-heading" className="p-4 border border-red-100 rounded-xl bg-red-50/50">
          <h3 id="account-heading" className="text-eyebrow-display text-red-700">Account</h3>
          <p className="text-xs text-ink-500 mb-3 mt-1">
            If you want to delete your account or have any issues, contact your admin.
          </p>
          <p className="text-xs text-ink-500">
            Signed in as <span className="font-mono">{user.email ?? (isBypass ? 'dev bypass user' : 'unknown')}</span>
          </p>
        </section>
      </main>
      <BottomNav currentUserId={user.id} />
    </div>
  )
}
