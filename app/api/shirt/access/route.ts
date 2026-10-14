import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireApiUser } from '@/lib/auth/server'
import { SHIRT_VISIBILITIES, type ShirtVisibility } from '@/lib/identity/signing'

export const runtime = 'nodejs'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * PATCH /api/shirt/access
 *
 * The write half of the one-door model (doc 07). One endpoint for the whole
 * access panel, because all of it is the same decision: *who may sign this
 * shirt*. Body takes `shirt_id` plus exactly one action:
 *
 *   { visibility }                  switch mode: open | circle | approval
 *   { add_circle_user_id }          grant someone access on a `circle` shirt
 *   { remove_circle_user_id }       revoke that
 *   { block_user_id }               block permanently, beating every mode
 *   { unblock_user_id }             lift a block
 *
 * Everything is owner-only and checked against the shirt itself, never against
 * a role or a batch. `block` is deliberately separate from `visibility` so
 * switching a shirt back to `open` can never re-admit someone who was blocked.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const shirtId = typeof body?.shirt_id === 'string' ? body.shirt_id : null

  if (!shirtId || !UUID.test(shirtId)) {
    return NextResponse.json({ error: 'shirt_id is required', code: 'INVALID_BODY' }, { status: 400 })
  }

  const db = await createServiceClient()

  // Ownership is the only authority that matters here.
  const { data: shirt } = await db
    .from('shirts')
    .select('id, owner_id, visibility')
    .eq('id', shirtId)
    .maybeSingle()

  if (!shirt) return NextResponse.json({ error: 'Shirt not found' }, { status: 404 })

  if (shirt.owner_id !== auth.user.id) {
    return NextResponse.json({ error: 'Only the shirt owner can change this' }, { status: 403 })
  }

  // ── Mode ────────────────────────────────────────────────────────────────
  if (body.visibility !== undefined) {
    const next = String(body.visibility) as ShirtVisibility
    if (!SHIRT_VISIBILITIES.includes(next)) {
      return NextResponse.json({ error: 'Unknown mode', code: 'INVALID_BODY' }, { status: 422 })
    }

    const { error } = await db.from('shirts').update({ visibility: next }).eq('id', shirtId)
    if (error) return NextResponse.json({ error: 'Failed to save mode' }, { status: 500 })

    return NextResponse.json({ success: true, visibility: next })
  }

  // ── Circle ──────────────────────────────────────────────────────────────
  const addCircle = asUuid(body.add_circle_user_id)
  if (addCircle) {
    const { error } = await db.from('shirt_circle').insert({
      shirt_id: shirtId,
      user_id: addCircle,
      added_by: auth.user.id,
    })
    // 23505 = already a member, which is the outcome the owner wanted anyway.
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'Failed to add to circle' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  const removeCircle = asUuid(body.remove_circle_user_id)
  if (removeCircle) {
    await db.from('shirt_circle').delete().eq('shirt_id', shirtId).eq('user_id', removeCircle)
    return NextResponse.json({ success: true })
  }

  // ── Blocks ──────────────────────────────────────────────────────────────
  const blockId = asUuid(body.block_user_id)
  if (blockId) {
    if (blockId === auth.user.id) {
      return NextResponse.json({ error: 'You cannot block yourself' }, { status: 422 })
    }
    const { error } = await db.from('shirt_blocks').insert({
      shirt_id: shirtId,
      blocked_id: blockId,
    })
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'Failed to block' }, { status: 500 })
    }
    // Blocking implies they should not also be in the circle. Leaving a blocked
    // person on the guest list would mean a later unblock silently re-admits
    // them, which is exactly the confusion `block` exists to prevent.
    await db.from('shirt_circle').delete().eq('shirt_id', shirtId).eq('user_id', blockId)
    return NextResponse.json({ success: true })
  }

  const unblockId = asUuid(body.unblock_user_id)
  if (unblockId) {
    await db.from('shirt_blocks').delete().eq('shirt_id', shirtId).eq('blocked_id', unblockId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Nothing to change', code: 'INVALID_BODY' }, { status: 400 })
}

function asUuid(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value) ? value : null
}
