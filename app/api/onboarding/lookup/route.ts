import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createFixedWindowRateLimiter, rateLimitResponseHeaders } from '@/lib/utils/rateLimit'
import { normalizeEnrollment } from '@/lib/identity/enrollment'
import { loadRosterIndex, lookupRosterEntry, ROSTER_UNAVAILABLE } from '@/lib/identity/roster'

export const runtime = 'nodejs'

// Same budget as scribble placement: strict enough that enumeration is
// pointless, loose enough that a real student mistyping twice is unaffected.
const lookupLimiter = createFixedWindowRateLimiter({ limit: 8, windowMs: 60_000 })

/**
 * POST /api/onboarding/lookup  { enrollment: string }
 *
 * Tells a student which program the roster put them in — and nothing else.
 * The roster's NAME is deliberately not returned: the lookup confirms a program
 * exists for that number, and the student's own typed name is what goes on the
 * profile. That keeps this endpoint from becoming a name-by-number oracle.
 *
 * Returns `{ found: false, code }` for both "not in the list" and "the list is
 * not configured yet". The roster file existing is a server fact the browser
 * must not be able to probe.
 */
export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rate = lookupLimiter.check(auth.user.id)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many lookups. Wait a moment and try again.' },
      { status: 429, headers: rateLimitResponseHeaders(rate) },
    )
  }

  const body = await req.json().catch(() => null)
  const normalized = normalizeEnrollment(typeof body?.enrollment === 'string' ? body.enrollment : null)

  if (!normalized) {
    return NextResponse.json({ found: false, code: 'invalid' }, { status: 200 })
  }

  const index = await loadRosterIndex()
  const entry = lookupRosterEntry(index, normalized)

  if (entry === ROSTER_UNAVAILABLE || entry === null) {
    // Identical shape for "roster missing" and "no such student": the browser
    // must not be able to distinguish them. An absent roster is an operator
    // problem, not something the student did wrong.
    return NextResponse.json({ found: false, code: 'not_found' }, { status: 200 })
  }

  // Program comes from the seeded `programs` table, keyed off the roster's name.
  // CSE is the only batch-enabled program at launch; every other program is
  // course-wide, and batch is optional everywhere.
  const db = await createServiceClient()
  const { data: program } = await db
    .from('programs')
    .select('id, key, name, batches_enabled, batch_count')
    .ilike('name', entry.programName)
    .maybeSingle()

  if (!program) {
    return NextResponse.json({ found: true, code: 'unlisted_program' }, { status: 200 })
  }

  const batchesEnabled = Boolean(program.batches_enabled)
  const batchCount = typeof program.batch_count === 'number' ? program.batch_count : null

  return NextResponse.json({
    found: true,
    program: {
      id: program.id,
      key: program.key,
      name: program.name,
      batchesEnabled,
      batchCount,
    },
    graduationYear: entry.graduationYear,
    batchSelectionRequired: entry.batchSelectionRequired,
  })
}
