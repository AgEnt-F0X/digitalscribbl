import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { canAttemptScribble } from '@/lib/utils/safetyAccess'

export const runtime = 'nodejs'

type IncomingSocialNote = {
  note_type?: unknown
  body?: unknown
  emoji?: unknown
  x?: unknown
  y?: unknown
  rotation?: unknown
}

function clamp01(value: unknown, fallback: number) {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.max(0, Math.min(1, num))
}

function clampRotation(value: unknown) {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.max(-45, Math.min(45, num))
}

function normalizeNote(input: IncomingSocialNote, index: number) {
  const allowedTypes = ['plain', 'sticky', 'speech-bubble', 'sticker']
  const noteType = typeof input.note_type === 'string' && allowedTypes.includes(input.note_type)
    ? input.note_type
    : 'plain'
  const body = typeof input.body === 'string' ? input.body.trim().slice(0, 180) : null
  const emoji = typeof input.emoji === 'string' ? input.emoji.trim().slice(0, 48) : null

  if (noteType !== 'sticker' && !body) return null
  if (noteType === 'sticker' && !emoji) return null

  return {
    note_type: noteType,
    body,
    emoji,
    x: clamp01(input.x, 0.28 + index * 0.08),
    y: clamp01(input.y, 0.3 + index * 0.08),
    rotation: clampRotation(input.rotation),
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const shirtId = typeof body?.shirt_id === 'string' ? body.shirt_id : null
  const incomingNotes = Array.isArray(body?.notes) ? body.notes.slice(0, 12) as IncomingSocialNote[] : []

  if (!shirtId) return NextResponse.json({ error: 'shirt_id is required' }, { status: 400 })

  const notes = incomingNotes
    .map((note, index) => normalizeNote(note, index))
    .filter((note): note is NonNullable<typeof note> => Boolean(note))

  if (notes.length === 0) {
    return NextResponse.json({ error: 'Add at least one outside note or reaction' }, { status: 400 })
  }

  const db = await createServiceClient()
  const { data: shirt } = await db
    .from('shirts')
    .select('id, owner_id, is_locked')
    .eq('id', shirtId)
    .single()

  if (!shirt || !shirt.owner_id) return NextResponse.json({ error: 'Shirt not found' }, { status: 404 })
  if (shirt.owner_id === auth.user.id) return NextResponse.json({ error: 'You cannot sign your own shirt' }, { status: 403 })
  if (shirt.is_locked) return NextResponse.json({ error: 'This shirt is locked' }, { status: 423 })

  const [{ data: owner }, { data: scribbler }, { data: request }] = await Promise.all([
    db.from('users').select('shirt_permission, batch_id, is_suspended').eq('id', shirt.owner_id).single(),
    db.from('users').select('batch_id, is_suspended, is_guest').eq('id', auth.user.id).single(),
    db.from('scribble_requests')
      .select('status')
      .eq('requester_id', auth.user.id)
      .eq('owner_id', shirt.owner_id)
      .maybeSingle(),
  ])

  if (!owner || !scribbler || owner.is_suspended || scribbler.is_suspended) {
    return NextResponse.json({ error: 'Signing is not available' }, { status: 403 })
  }

  const sameBatch = Boolean(owner.batch_id && scribbler.batch_id && owner.batch_id === scribbler.batch_id)
  const approvedRequest = request?.status === 'approved'
  const canScribble = canAttemptScribble({
    isOwner: false,
    permission: owner.shirt_permission,
    sameBatch: scribbler.is_guest ? false : sameBatch,
    approvedRequest,
  })

  if (!canScribble) return NextResponse.json({ error: 'You need permission to leave a note' }, { status: 403 })

  const { data: inserted, error } = await db
    .from('shirt_social_notes')
    .insert(notes.map(note => ({
      ...note,
      shirt_id: shirtId,
      author_id: auth.user.id,
    })))
    .select('id')

  if (error) {
    console.error('Social note insert failed:', error)
    return NextResponse.json({ error: 'Could not save outside notes' }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: inserted?.length ?? notes.length })
}
