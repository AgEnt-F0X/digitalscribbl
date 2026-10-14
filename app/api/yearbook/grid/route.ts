import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/yearbook/grid
 *
 * Returns yearbook grid data from the `yearbook_grid_stats` materialized view.
 * This avoids N+1 scribble-count queries that the previous yearbook page did.
 *
 * Query params:
 *   - batch (uuid, optional): filter to a single batch.
 *   - search (string, optional): substring match on display_name.
 *   - limit (number, default 200): max rows returned.
 *   - offset (number, default 0): pagination offset.
 */
export async function GET(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const batchId = searchParams.get('batch')
  const search = searchParams.get('search')
  const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

  const db = await createServiceClient()

  const query = db
    .from('yearbook_grid_stats')
    .select('*')
    .order('display_name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (batchId) query.eq('batch_id', batchId)
  if (search) query.ilike('display_name', `%${search}%`)

  const { data, error } = await query

  if (error) {
    console.error('yearbook/grid error:', error)
    return NextResponse.json({ error: 'Failed to fetch yearbook grid' }, { status: 500 })
  }

  return NextResponse.json({ data, total: data?.length ?? 0 })
}
