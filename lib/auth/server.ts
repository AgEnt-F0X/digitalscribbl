import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DEV_AUTH_COOKIE, getDevAuthSlot, getDevAuthUserId, isDevAuthBypassEnabled } from './dev'

export interface AppAuthUser {
  id: string
  email: string | null
  user_metadata?: Record<string, unknown>
}

interface AuthContext {
  user: AppAuthUser | null
  supabase: Awaited<ReturnType<typeof createClient>> | Awaited<ReturnType<typeof createServiceClient>>
  isBypass: boolean
}

/**
 * Snapshot of account status fields the API layer consults to refuse access
 * after the proxy has waved a request through. The proxy skips `/api/*` per
 * Next 16 conventions, so deleted/suspended users with a still-valid token
 * could otherwise keep writing until the next token rotation.
 * See docs/15-dev-review.md §3a.
 */
type AccountStatus = {
  is_deleted: boolean
  is_suspended: boolean
}

async function fetchAccountStatus(userId: string): Promise<AccountStatus | null> {
  const db = await createServiceClient()
  const { data } = await db
    .from('users')
    .select('is_deleted, is_suspended')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  return {
    is_deleted: Boolean(data.is_deleted),
    is_suspended: Boolean(data.is_suspended),
  }
}

async function resolveBypassUser() {
  if (!isDevAuthBypassEnabled()) return null

  const cookieStore = await cookies()
  const selectedSlot = getDevAuthSlot(cookieStore.get(DEV_AUTH_COOKIE)?.value)
  const userId = getDevAuthUserId(process.env, selectedSlot)
  const db = await createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('id, display_name')
    .eq('id', userId)
    .single()

  if (!profile) return null

  return {
    user: {
      id: profile.id,
      email: null,
      user_metadata: {
        full_name: profile.display_name,
        dev_slot: selectedSlot,
      },
    } satisfies AppAuthUser,
    supabase: db,
    isBypass: true,
  } satisfies AuthContext
}

export async function getServerAuthContext(): Promise<AuthContext> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (user) {
    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        user_metadata: user.user_metadata,
      },
      supabase: authClient,
      isBypass: false,
    }
  }

  return (await resolveBypassUser()) ?? {
    user: null,
    supabase: authClient,
    isBypass: false,
  }
}

export async function requirePageUser() {
  const context = await getServerAuthContext()
  if (!context.user) redirect('/login')
  return context as AuthContext & { user: AppAuthUser }
}

export async function requireApiUser() {
  const context = await getServerAuthContext()
  if (!context.user) return null

  // Belt-and-braces: proxy.ts already enforces these for page routes, but
  // it intentionally skips `/api/*`. Re-check at the API boundary so a
  // deleted-but-still-tokened user can't keep writing.
  const status = await fetchAccountStatus(context.user.id)
  if (!status) return null
  if (status.is_deleted || status.is_suspended) return null

  return context as AuthContext & { user: AppAuthUser }
}

export async function getUserIsAdmin(userId: string) {
  const db = await createServiceClient()
  const { data } = await db
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return Boolean(data?.is_admin)
}

export async function requirePageAdmin() {
  const context = await requirePageUser()
  if (!(await getUserIsAdmin(context.user.id))) redirect('/dashboard')

  return {
    ...context,
    adminDb: await createServiceClient(),
  }
}
