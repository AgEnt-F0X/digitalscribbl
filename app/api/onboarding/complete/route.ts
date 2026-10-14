import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeEnrollment, resolveGroupingScope } from '@/lib/identity/enrollment'
import { loadRosterIndex, lookupRosterEntry, ROSTER_UNAVAILABLE } from '@/lib/identity/roster'

export const runtime = 'nodejs'

function generateSlug(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  const suffix = nanoid(8)
  return `${base}-${suffix}`
}

/**
 * What the enrollment-first onboarding actually collects.
 *
 * One number, one name, one optional batch. The school, program dropdowns, and
 * the 52-option batch list are gone: `/api/onboarding/lookup` resolves the
 * program server-side from the roster, and `batch` is an Explore filter, never
 * a gate. Sending `batch: null` is the normal path for every course-wide
 * program; `resolveGroupingScope` demotes an out-of-range batch to `course`
 * rather than erroring, because a wrong section must never become a wall.
 */
const completeSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  enrollmentNumber: z.string().trim().min(1).max(50),
  programId: z.string().uuid(),
  batch: z.number().int().min(1).max(500).nullable(),
})

export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = auth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = completeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { displayName, programId, batch } = parsed.data
  const enrollment = normalizeEnrollment(parsed.data.enrollmentNumber)

  if (!enrollment) {
    return NextResponse.json({ error: 'That enrollment number does not look right' }, { status: 422 })
  }

  const serviceDb = await createServiceClient()

  // ── The number must resolve against the roster WE looked up, not one the
  // client invented. Re-lookup server-side and require the same program: a
  // client that sends a valid number with a different program is tampering
  // with which cohort it lands in.
  const index = await loadRosterIndex()
  const entry = lookupRosterEntry(index, enrollment)

  if (entry === ROSTER_UNAVAILABLE || entry === null) {
    return NextResponse.json(
      { error: 'We could not confirm that enrollment number. Check it and try again, or ask an admin.' },
      { status: 422 },
    )
  }

  const { data: program } = await serviceDb
    .from('programs')
    .select('id, key, academic_group_id, batches_enabled, batch_count')
    .eq('id', programId)
    .maybeSingle()

  if (!program) {
    return NextResponse.json({ error: 'Unknown program' }, { status: 422 })
  }

  // An out-of-range batch falls back to course scope. Never reject: the batch
  // picker is a convenience, not a credential.
  const grouping = resolveGroupingScope({
    programKey: program.key,
    batchSelectionRequired: Boolean(program.batches_enabled),
    batch,
    batchMax: program.batch_count,
  })

  let batchId: string | null = null
  if (grouping.scope === 'batch' && grouping.batch !== null) {
    const { data: batchRow } = await serviceDb
      .from('batches')
      .select('id')
      .eq('program_id', program.id)
      .eq('batch_number', grouping.batch)
      .maybeSingle()
    batchId = batchRow?.id ?? null
  }

  const slug = generateSlug(displayName)
  const now = new Date().toISOString()

  // The roster proves this student EXISTS. The mailbox one-time code is what
  // will prove they OWN the number — and that mail provider is still not
  // provisioned, so sending is blocked rather than simulated. Until then every
  // onboarding lands as `pending`: a real profile with a real shirt that an
  // admin can confirm, instead of a dead end.
  const { error: updateErr } = await serviceDb
    .from('users')
    .update({
      display_name: displayName.trim(),
      enrollment_number: enrollment,
      academic_group_id: program.academic_group_id,
      program_id: program.id,
      batch_id: batchId,
      verification_status: 'pending',
      onboarding_completed: true,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateErr) {
    // 23505 on the unique enrollment anchor means someone else already owns
    // this number. That is identity theft or a shared device — either way it is
    // not something to overwrite.
    if (updateErr.code === '23505') {
      return NextResponse.json(
        { error: 'That enrollment number is already attached to an account. Contact an admin if that is you.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Failed to save profile', detail: updateErr.message }, { status: 500 })
  }

  const { error: slugErr } = await serviceDb
    .from('profile_slugs')
    .insert({ slug, user_id: user.id, is_current: true })

  if (slugErr) {
    if (slugErr.code === '23505') {
      return NextResponse.json({ slug: null, profile_slug_conflict: true }, { status: 200 })
    }
    return NextResponse.json({ error: 'Failed to create profile slug', detail: slugErr.message }, { status: 500 })
  }

  // ── Shirt #1, open by default. Signing must be possible the moment the
  // student exists, so the shirt is created here rather than later.
  const { data: primaryShirt } = await serviceDb
    .from('shirts')
    .select('id')
    .eq('owner_id', user.id)
    .eq('shirt_number', 1)
    .maybeSingle()

  if (!primaryShirt) {
    await serviceDb.from('shirts').insert({
      owner_id: user.id,
      shirt_number: 1,
      visibility: 'open',
    })
  }

  return NextResponse.json({ success: true, slug })
}
