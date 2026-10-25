import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isPrototypeMode, createPrototypeClient } from './prototype'

export async function createClient() {
  if (isPrototypeMode()) return createPrototypeClient()
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()             { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {
            // Called from a Server Component — cookie writes are ignored
          }
        },
      },
    }
  )
}

/** Service-role client — bypasses RLS. Use only in server-side API routes. */
export async function createServiceClient() {
  if (isPrototypeMode()) return createPrototypeClient()
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll()             { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {}
        },
      },
      auth: { persistSession: false },
    }
  )
}
