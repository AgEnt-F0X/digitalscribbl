import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireApiUser } from '@/lib/auth/server'
import { decideScribble } from '@/lib/identity/signing-queue'
import { getPhase, isScribbleOpen } from '@/lib/utils/phase'

export const runtime = 'nodejs'

/**
 * POST /api/scribble/approve  { scribble_id, decision: 'approved' | 'rejected' }
 *
 * The owner's half of the `approval` shirt mode (doc 07). Replaces
 * `/api/scribble/request`, which asked permission *before* drawing.
 *
 * Deliberately thin, because the interesting decisions already live in pure
 * functions:
 *   · `decideScribble` — owner-only, and a hidden scribble counts as already
 *     decided so approve-and-report cannot resurrect pulled content.
 *   · `isScribbleOpen` — approving reveals content, so it respects the same
 *     sealing window as placement.
 *
 * A decline names nobody and stores no reason. The scribbler is told it was not
 * posted, with no timestamp, so a private moderation decision cannot be quoted
 * back as an argument.
 */
export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const scribbleId = typeof body?.scribble_id === 'string' ? body.scribble_id : null
  const decision = body?.decision === 'approved' || body?.decision === 'rejected'
    ? (body.decision as 'approved' | 'rejected')
    : null

  if (!scribbleId || !decision) {
    return NextResponse.json(
      { error: 'scribble_id and decision are required', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

  const db = await createServiceClient()

  const { data: scribble } = await db
    .from('scribbles')
    .select('id, shirt_id, scribbler_id, panel, approval_status, is_hidden, shirts!inner(owner_id)')
    .eq('id', scribbleId)
    .single()

  if (!scribble) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ownerId = (scribble.shirts as unknown as { owner_id: string }).owner_id

  const verdict = decideScribble({
    scribble: { approval_status: scribble.approval_status, is_hidden: scribble.is_hidden },
    isOwner: auth.user.id === ownerId,
    decision,
  })

  if (!verdict.allowed) {
    const status = verdict.reason === 'not_owner' ? 403 : 409
    return NextResponse.json(
      { error: verdict.reason === 'not_owner' ? 'Only the shirt owner can decide' : 'Already decided' },
      { status },
    )
  }

  // Approving is a reveal, so it must not happen after the shirts seal.
  if (decision === 'approved') {
    const phase = await getPhase(db)
    if (!isScribbleOpen(phase)) {
      return NextResponse.json(
        { error: 'The signing window has closed', code: 'SEALED' },
        { status: 403 },
      )
    }
  }

  const { error } = await db
    .from('scribbles')
    .update({
      approval_status: verdict.status,
      decided_at: new Date().toISOString(),
      decided_by: auth.user.id,
    })
    .eq('id', scribbleId)

  if (error) {
    return NextResponse.json({ error: 'Failed to save decision' }, { status: 500 })
  }

  // Occupancy only ever counted approved scribbles, so approving one changes the
  // shirt's fullness. Recalculate rather than drift.
  if (decision === 'approved') {
    await recalculatePanelOccupancy(db, scribble.shirt_id, scribble.panel)
  }

  return NextResponse.json({ success: true, approval_status: verdict.status })
}

async function recalculatePanelOccupancy(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  shirtId: string,
  panel: string,
) {
  const { calculateOccupancy } = await import('@/lib/utils/collision')
  const { SHIRT_W, SHIRT_H } = await import('@/lib/constants')

  const column = panel === 'back' ? 'back_occupancy' : panel === 'sleeves' ? 'sleeves_occupancy' : 'front_occupancy'

  const { data: visible } = await db
    .from('scribbles')
    .select('x, y, w, h')
    .eq('shirt_id', shirtId)
    .eq('panel', panel)
    .eq('is_hidden', false)
    .eq('approval_status', 'approved')

  await db
    .from('shirts')
    .update({ [column]: calculateOccupancy(visible ?? [], SHIRT_W, SHIRT_H) })
    .eq('id', shirtId)
}
