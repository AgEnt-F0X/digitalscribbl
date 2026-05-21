import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requirePageUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function GuestOnboardingPage() {
  const { supabase, user } = await requirePageUser()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, is_guest, is_university_verified')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!profile.is_guest && profile.is_university_verified) redirect('/dashboard')

  return (
    <main className="scribbl-page min-h-screen px-4 py-8 text-ink-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center">
        <section className="sketch-panel w-full p-6 sm:p-8">
          <p className="scribble-underline font-display text-4xl font-bold">Scribbl</p>
          <div className="mt-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f54df]">Guest access</p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl">
              You can sign shirts through invite links.
            </h1>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              Hi {profile.display_name.split(' ')[0]}. This account is outside the allowed university domain, so it cannot create a Scribbl shirt, join the class dashboard, or browse private student lists. You can still open a direct shirt link from a verified student and leave a scribble if their permissions allow it.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="paper-note p-4">
              <p className="font-semibold">Allowed</p>
              <p className="mt-2 text-sm text-gray-600">Open invited shirt links and sign when permitted.</p>
            </div>
            <div className="paper-note p-4">
              <p className="font-semibold">Limited</p>
              <p className="mt-2 text-sm text-gray-600">No dashboard, groups, explore, yearbook, or shirt ownership.</p>
            </div>
            <div className="paper-note p-4">
              <p className="font-semibold">Need full access?</p>
              <p className="mt-2 text-sm text-gray-600">Sign in with your university email account.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="pencil-button">
              Use another account
            </Link>
            <Link href="/" className="btn-secondary">
              Back to start
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
