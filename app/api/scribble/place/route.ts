import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireApiUser } from '@/lib/auth/server'
import { calculateOccupancy } from '@/lib/utils/collision'
import { sanitizeScribbleSvg } from '@/lib/utils/sanitizeSvg'
import { hasDrawableFabricJson, normalizeScribbleBox } from '@/lib/utils/scribbleContract'
import {
  isBoxInsideDrawableRegion,
  SHIRT_COORDINATE_SPACE,
  SHIRT_TEMPLATE_ID,
} from '@/lib/utils/shirtTemplate'
import { canAttemptScribble } from '@/lib/utils/safetyAccess'
import { createFixedWindowRateLimiter, rateLimitResponseHeaders } from '@/lib/utils/rateLimit'
import { getPhase, isScribbleOpen } from '@/lib/utils/phase'
import { getPlatformFlags } from '@/lib/utils/platformFlags'
import { SHIRT_W, SHIRT_H, OCCUPANCY_FULL_THRESHOLD } from '@/lib/constants'
import type { Panel } from '@/lib/supabase/types'

export const runtime = 'nodejs'

const placeLimiter = createFixedWindowRateLimiter({ limit: 8, windowMs: 60_000 })

function panelOccupancyKey(panel: Panel) {
  const map: Record<Panel, string> = {
    front:   'front_occupancy',
    back:    'back_occupancy',
    sleeves: 'sleeves_occupancy',
  }
  return map[panel]
}

/**
 * POST /api/scribble/place
 *
 * Per the v1 product spec (docs/03-product-flows.md):
 *  - Scribbles MAY overlap. No collision blocking is performed.
 *  - Size + drawable-region constraints are enforced.
 *  - If the shirt locks while a user is mid-scribble, the in-flight scribble is
 *    still accepted IF the user has an active box_claim or the scribble was
 *    started within a short grace window. Otherwise locked = blocked.
 *  - Self-scribble is rejected (403).
 *  - Suspended users are rejected (403).
 */
export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = auth

  const rate = placeLimiter.check(user.id)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many save attempts. Wait a moment and try again.', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitResponseHeaders(rate) },
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 })

  const {
    owner_id,
    shirt_number = 1,
    panel,
    placement_mode = 'compose',
    template_id = SHIRT_TEMPLATE_ID,
    coordinate_space = SHIRT_COORDINATE_SPACE,
    x: rawX,
    y: rawY,
    w: rawW,
    h: rawH,
    canvas_svg,
    canvas_json,
    voice_url = null,
    voice_duration_ms = null,
  } = body as {
    owner_id:      string
    shirt_number?: number
    placement_mode?: 'box' | 'direct' | 'compose'
    template_id?: string
    coordinate_space?: string
    panel:         Panel
    x: unknown; y: unknown; w: unknown; h: unknown
    canvas_svg:    string
    canvas_json:   unknown
    voice_url?:    string | null
    voice_duration_ms?: number | null
  }
  // `is_anonymous` is intentionally ignored: doc 08 round 2 decision 2.
  // The DB column still exists from migration 009 but is never written.

  // ── Input validation ─────────────────────────────────────────
  if (!owner_id || !panel || !canvas_svg || !canvas_json) {
    return NextResponse.json(
      { error: 'Missing required fields', code: 'INVALID_BODY' },
      { status: 400 },
    )
  }

  if (user.id === owner_id) {
    return NextResponse.json(
      { error: 'You can\'t sign your own shirt', code: 'SELF_SCRIBBLE' },
      { status: 403 },
    )
  }

  if (!['front', 'back', 'sleeves'].includes(panel)) {
    return NextResponse.json({ error: 'Invalid panel', code: 'INVALID_PANEL' }, { status: 400 })
  }

  const normalizedPlacementMode =
    placement_mode === 'direct'  ? 'direct'  :
    placement_mode === 'box'     ? 'box'     :
    'compose'
  const normalizedTemplateId = template_id === SHIRT_TEMPLATE_ID ? template_id : SHIRT_TEMPLATE_ID
  const normalizedCoordinateSpace = coordinate_space === SHIRT_COORDINATE_SPACE
    ? coordinate_space
    : SHIRT_COORDINATE_SPACE

  const normalizedBox = normalizeScribbleBox(
    { x: rawX, y: rawY, w: rawW, h: rawH },
    normalizedPlacementMode === 'direct'
      ? { maxSize: Math.max(SHIRT_W, SHIRT_H) }
      : undefined,
  )
  if (!normalizedBox.ok) {
    return NextResponse.json(
      { error: normalizedBox.error, code: normalizedBox.code },
      { status: 400 },
    )
  }

  const { x, y, w, h } = normalizedBox.box

  // Full-canvas guard: reject scribbles that cover ≥95 % of the shirt.
  // The studio's `exportLayer()` returns tight bounds, so a near-full-canvas
  // dimension means the user painted wall-to-wall (intentionally or via FL2
  // direct-mode mismatch). These degrade the yearbook grid.
  if (w / SHIRT_W >= 0.95 && h / SHIRT_H >= 0.95) {
    return NextResponse.json(
      { error: 'Scribble covers nearly the full shirt — draw a smaller signature', code: 'FULL_CANVAS' },
      { status: 400 },
    )
  }

  if (normalizedPlacementMode !== 'direct' && !isBoxInsideDrawableRegion(normalizedBox.box, panel)) {
    return NextResponse.json(
      { error: 'Scribble must stay inside the shirt', code: 'OUTSIDE_REGION' },
      { status: 400 },
    )
  }

  if (!hasDrawableFabricJson(canvas_json)) {
    return NextResponse.json(
      { error: 'Canvas is empty — draw something first', code: 'EMPTY_CANVAS' },
      { status: 400 },
    )
  }

  const sanitizedSvg = sanitizeScribbleSvg(canvas_svg)
  if (!sanitizedSvg.ok) {
    const status = sanitizedSvg.error.includes('too large') ? 413 : 400
    return NextResponse.json({ error: sanitizedSvg.error, code: 'INVALID_SVG' }, { status })
  }

  // ── Voice note sanity (optional) ─────────────────────────────
  if (voice_url !== null) {
    if (typeof voice_url !== 'string' || !voice_url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid voice URL', code: 'INVALID_VOICE' },
        { status: 400 },
      )
    }
    if (typeof voice_duration_ms !== 'number' || voice_duration_ms < 0 || voice_duration_ms > 12_000) {
      return NextResponse.json(
        { error: 'Voice note must be 0–12 seconds', code: 'INVALID_VOICE_DURATION' },
        { status: 400 },
      )
    }
  }

  const db = await createServiceClient()

  // ── Phase + degrade-flag gate (doc 09 + doc 10) ──────────────
  const [phase, flags] = await Promise.all([getPhase(db), getPlatformFlags(db)])
  if (!isScribbleOpen(phase)) {
    return NextResponse.json(
      { error: 'Scribble phase has ended', code: 'PHASE_LOCKED' },
      { status: 410 },
    )
  }
  if (flags.disable_scribble_writes) {
    return NextResponse.json(
      { error: 'Scribbling is paused — try again in a few minutes', code: 'WRITES_DISABLED' },
      { status: 503 },
    )
  }
  if (voice_url && flags.disable_voice_notes) {
    return NextResponse.json(
      { error: 'Voice notes are paused — submit without a voice note', code: 'VOICE_DISABLED' },
      { status: 503 },
    )
  }

  // ── Get shirt + active box claim in parallel ─────────────────
  const [{ data: shirt }, { data: scribblerProfile }, { data: owner }, { data: claim }] = await Promise.all([
    db
      .from('shirts')
      .select('id, is_locked')
      .eq('owner_id', owner_id)
      .eq('shirt_number', shirt_number)
      .single(),
    db
      .from('users')
      .select('batch_id, is_suspended, is_guest')
      .eq('id', user.id)
      .single(),
    db
      .from('users')
      .select('shirt_permission, batch_id')
      .eq('id', owner_id)
      .single(),
    db
      .from('box_claims')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!shirt) return NextResponse.json({ error: 'Shirt not found', code: 'NOT_FOUND' }, { status: 404 })
  if (!owner) return NextResponse.json({ error: 'Owner not found', code: 'NOT_FOUND' }, { status: 404 })

  if (scribblerProfile?.is_suspended) {
    return NextResponse.json({ error: 'Account is suspended', code: 'SUSPENDED' }, { status: 403 })
  }

  // ── Lock check with in-flight grace ──────────────────────────
  if (shirt.is_locked) {
    // Grace window: if the user has an unexpired box_claim on this shirt or
    // started a scribble request within the last 5 minutes, allow it through
    // (they were mid-scribble when the owner locked).
    const hasActiveClaim = claim && new Date(claim.expires_at).getTime() > Date.now()
    if (!hasActiveClaim) {
      return NextResponse.json(
        { error: 'This shirt was just locked. Your scribble couldn\'t be saved.', code: 'LOCKED' },
        { status: 403 },
      )
    }
    // Continue — in-flight scribble is honored as the "last one".
  }

  // ── Permission check ─────────────────────────────────────────
  const { data: requestRecord } = await db
    .from('scribble_requests')
    .select('status')
    .eq('requester_id', user.id)
    .eq('owner_id', owner_id)
    .maybeSingle()

  const sameBatch = Boolean(
    owner.batch_id && scribblerProfile?.batch_id && owner.batch_id === scribblerProfile.batch_id,
  )
  const approvedRequest = requestRecord?.status === 'approved'

  // Guests bypass batch matching but must have an approved request OR
  // the permission must be 'open' (a direct link is enough).
  const isGuest = Boolean(scribblerProfile?.is_guest)
  const guestAllowed = isGuest && (owner.shirt_permission === 'open' || approvedRequest)

  if (!guestAllowed && !canAttemptScribble({
    isOwner: false,
    permission: owner.shirt_permission,
    sameBatch,
    approvedRequest,
  })) {
    const message = owner.shirt_permission === 'batch_only' && !sameBatch
      ? 'This shirt only accepts signatures from the same batch'
      : 'You need permission to sign this shirt'
    return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 })
  }

  // ── Platform-level checks ────────────────────────────────────
  const { data: settings } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', ['scribbling_enabled', 'deadline_date'])

  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
  const scribblingEnabled = settingsMap['scribbling_enabled']
  if (scribblingEnabled === false || scribblingEnabled === 'false') {
    return NextResponse.json(
      { error: 'Scribbling is paused right now', code: 'PAUSED' },
      { status: 403 },
    )
  }
  if (settingsMap['deadline_date']) {
    const deadline = new Date(settingsMap['deadline_date'] as string)
    if (new Date() > deadline) {
      return NextResponse.json(
        { error: 'The signing window has closed', code: 'DEADLINE_PASSED' },
        { status: 403 },
      )
    }
  }

  // ── Persist scribble ─────────────────────────────────────────
  // Per v1 product decision: no collision blocking — overlaps allowed.
  // Anonymous scribbles cut (doc 08 round 2 decision 2) — is_anonymous
  // never written; column stays in DB for history.
  const { data: newScribble, error: scribbleErr } = await db
    .from('scribbles')
    .insert({
      shirt_id:           shirt.id,
      scribbler_id:       user.id,
      panel,
      x, y, w, h,
      placement_mode:     normalizedPlacementMode,
      template_id:        normalizedTemplateId,
      coordinate_space:   normalizedCoordinateSpace,
      canvas_svg:         sanitizedSvg.svg,
      canvas_json:        canvas_json as Parameters<typeof db.from>[0] extends never ? never : unknown,
      voice_url:          voice_url ?? null,
      voice_duration_ms:  voice_duration_ms ?? null,
    })
    .select('id')
    .single()

  if (scribbleErr || !newScribble) {
    console.error('Scribble insert failed:', scribbleErr)
    return NextResponse.json(
      { error: 'Failed to save scribble', code: 'SAVE_FAILED' },
      { status: 500 },
    )
  }

  // ── Recalculate occupancy ────────────────────────────────────
  // Pull all existing scribbles for the panel after the insert to compute
  // accurate occupancy. (We could have skipped fetching pre-existing in
  // the parallel batch above to save a round-trip — but occupancy must
  // include the new scribble too.)
  const { data: existingScribbles } = await db
    .from('scribbles')
    .select('x, y, w, h')
    .eq('shirt_id', shirt.id)
    .eq('panel', panel)
    .eq('is_hidden', false)

  const newOccupancy = calculateOccupancy(existingScribbles ?? [], SHIRT_W, SHIRT_H)

  await db
    .from('shirts')
    .update({ [panelOccupancyKey(panel)]: newOccupancy })
    .eq('id', shirt.id)

  // Release any box claim the user had on this shirt
  await db.from('box_claims').delete().eq('shirt_id', shirt.id).eq('user_id', user.id)

  // Unlock next shirt if this panel is full (cap at 3)
  if (newOccupancy >= OCCUPANCY_FULL_THRESHOLD) {
    await unlockNextShirt(db, owner_id, shirt_number)
  }

  // ── Notification ─────────────────────────────────────────────
  const { data: scribbler } = await db
    .from('users')
    .select('display_name, thank_you_message')
    .eq('id', user.id)
    .single()

  const { data: ownerProfile } = await db
    .from('users')
    .select('display_name, thank_you_message')
    .eq('id', owner_id)
    .single()

  const displayName = scribbler?.display_name ?? 'Someone'

  await db.from('notifications').insert({
    user_id:             owner_id,
    type:                'scribble_received',
    title:               `${displayName} signed your shirt`,
    body:                panel === 'front' ? 'On the front' : panel === 'back' ? 'On the back' : 'On the sleeves',
    related_user_id:     user.id,
    related_shirt_id:    shirt.id,
    related_scribble_id: newScribble.id,
  })

  return NextResponse.json({
    success:           true,
    scribble_id:       newScribble.id,
    occupancy:         newOccupancy,
    thank_you_message: ownerProfile?.thank_you_message ?? 'Thanks for signing my shirt ❤️',
    owner_name:        ownerProfile?.display_name ?? null,
  })
}

async function unlockNextShirt(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  ownerId: string,
  currentShirtNum: number,
) {
  const next = currentShirtNum + 1
  if (next > 3) return  // Hard cap at 3 shirts

  const { data: existing } = await db
    .from('shirts')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('shirt_number', next)
    .maybeSingle()

  if (!existing) {
    await db.from('shirts').insert({ owner_id: ownerId, shirt_number: next })

    await db.from('notifications').insert({
      user_id: ownerId,
      type:    'shirt_unlocked',
      title:   `Shirt ${next} is unlocked!`,
      body:    'Your previous shirt filled up — a new blank one is ready.',
    })
  }
}
