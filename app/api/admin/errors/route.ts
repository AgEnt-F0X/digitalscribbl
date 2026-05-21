import { NextRequest, NextResponse } from 'next/server'
import { getUserIsAdmin, requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function requireAdmin() {
  const auth = await requireApiUser()
  if (!auth) return null
  if (!(await getUserIsAdmin(auth.user.id))) return null
  return auth
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') ?? 100)))
  const unresolvedOnly = searchParams.get('unresolved') === 'true'

  const db = await createServiceClient()
  let query = db
    .from('error_logs')
    .select('id, user_id, route, error_code, message, metadata, user_agent, created_at, resolved_at, resolved_by')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unresolvedOnly) query = query.is('resolved_at', null)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Could not fetch error logs' }, { status: 500 })

  return NextResponse.json({ logs: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : null
  const resolved = body?.resolved !== false

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const db = await createServiceClient()
  const { error } = await db
    .from('error_logs')
    .update({
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? auth.user.id : null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Could not update error log' }, { status: 500 })
  return NextResponse.json({ success: true })
}
