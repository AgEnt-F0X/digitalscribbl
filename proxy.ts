import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEV_AUTH_COOKIE, getDevAuthSlot, getDevAuthUserId, isDevAuthBypassEnabled } from '@/lib/auth/dev'
import { getRole, isPublicRoute, isGuestAllowed, isAdminRoute, type Role } from '@/lib/utils/role'

/**
 * Next.js proxy — auth, onboarding, role + phase guard.
 *
 * Order of checks (each redirects, never silently allows):
 *   1. Sign-in: not authed + not public → /login
 *   2. Role gate: derived from flag set (role.ts)
 *      - is_deleted → session refused (signed out + reason=deleted)
 *      - suspended → /login?reason=suspended
 *      - admin-only path + non-admin → /dashboard?reason=admin_only
 *      - guest hitting non-guest-allowed → /guest
 *   3. Onboarding: not completed + not guest + not on /onboarding → /onboarding
 *
 * See docs/08 §"Route IA" + Round 2 decision 1, and docs/10 (phase).
 */

const SKIP_PROFILE_CHECK_PREFIXES = ['/onboarding', '/api/', '/auth/']

type SupabaseCookie = {
  name: string
  value: string
  options?: CookieOptions
}

function skipProfileCheck(pathname: string) {
  return SKIP_PROFILE_CHECK_PREFIXES.some(p => pathname.startsWith(p))
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const devBypassEnabled = isDevAuthBypassEnabled()
  const selectedSlot = getDevAuthSlot(request.cookies.get(DEV_AUTH_COOKIE)?.value)

  if (!user && !isPublicRoute(pathname) && !devBypassEnabled) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const effectiveUserId =
    user?.id ?? (devBypassEnabled ? getDevAuthUserId(process.env, selectedSlot) : '')

  if (!effectiveUserId) return supabaseResponse

  if (skipProfileCheck(pathname)) return supabaseResponse

  const profileClient = user
    ? supabase
    : createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {},
          },
          auth: { persistSession: false },
        },
      )

  const { data: profile } = await profileClient
    .from('users')
    .select('onboarding_completed, is_guest, is_suspended, is_admin, is_university_verified, is_deleted')
    .eq('id', effectiveUserId)
    .single()

  const role: Role | null = getRole(profile)

  // Deleted: kill the session and bounce.
  if (profile?.is_deleted) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'deleted')
    return NextResponse.redirect(url)
  }

  // Suspended.
  if (role === 'suspended') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'suspended')
    return NextResponse.redirect(url)
  }

  // Admin-only routes.
  if (isAdminRoute(pathname) && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.searchParams.set('reason', 'admin_only')
    return NextResponse.redirect(url)
  }

  // Guests: restrict to the allowlist (docs/08 round 2 decision 1).
  if (role === 'guest' && !isGuestAllowed(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/guest'
    return NextResponse.redirect(url)
  }

  // Verified students must complete onboarding before anything else.
  if (role !== 'guest' && !profile?.onboarding_completed) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|bodies|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
