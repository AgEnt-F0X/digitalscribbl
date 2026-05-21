import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIsAdmin, requireApiUser } from '@/lib/auth/server'
import { invalidatePhaseCache, type Phase } from '@/lib/utils/phase'
import { invalidatePlatformFlagsCache } from '@/lib/utils/platformFlags'
import { writeAdminAuditLog } from '@/lib/utils/audit'

// Keys the admin UI is allowed to flip. Doc 09 promises a single-click
// switch for every soft-degrade flag and phase change — this allowlist
// is the gate that makes that promise reachable. Adding a key here is
// the normal path; do NOT loosen the check.
const ALLOWED_SETTING_KEYS = [
  // Phase machine (doc 10)
  'phase',
  'scribble_ends_at',
  'yearbook_opens_at',
  'transition_message',
  // Free-tier soft-degrade flags (doc 09)
  'disable_voice_notes',
  'disable_realtime_presence',
  'disable_realtime_broadcast',
  'disable_email_digest',
  'disable_new_signups',
  'disable_scribble_writes',
  'disable_head_uploads',
  'disable_share_link_creation',
  // Legacy (pre-phase-machine; kept for back-compat with /admin UI)
  'scribbling_enabled',
  'deadline_date',
  'auto_hide_threshold',
  'announcement',
] as const

type AllowedKey = typeof ALLOWED_SETTING_KEYS[number]

const VALID_PHASES: readonly Phase[] = ['scribble_open', 'countdown', 'transition', 'yearbook']

function isAllowedKey(key: unknown): key is AllowedKey {
  return typeof key === 'string' && (ALLOWED_SETTING_KEYS as readonly string[]).includes(key)
}

/**
 * Lightweight type check for the new keys. Booleans for `disable_*`, the
 * Phase string union for `phase`. Other keys pass through as-is.
 */
function validateValue(key: AllowedKey, value: unknown): { ok: true } | { ok: false; error: string } {
  if (key.startsWith('disable_')) {
    if (typeof value !== 'boolean') return { ok: false, error: `${key} must be a boolean` }
    return { ok: true }
  }
  if (key === 'phase') {
    if (typeof value !== 'string' || !VALID_PHASES.includes(value as Phase)) {
      return { ok: false, error: `phase must be one of ${VALID_PHASES.join(', ')}` }
    }
    return { ok: true }
  }
  return { ok: true }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = auth

  if (!(await getUserIsAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key, value } = (await req.json().catch(() => ({}))) as { key?: unknown; value?: unknown }

  if (!isAllowedKey(key)) {
    return NextResponse.json({ error: 'Invalid or missing key' }, { status: 400 })
  }

  const check = validateValue(key, value)
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 })
  }

  const db = await createServiceClient()

  // Snapshot the previous value before write so the audit log captures the
  // delta. Falls through silently on read failures — the write is the
  // important half.
  const { data: previous } = await db
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  const { error: writeErr } = await db.from('platform_settings').upsert({
    key,
    value: value as never,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  })

  if (writeErr) {
    return NextResponse.json({ error: 'Could not update setting' }, { status: 500 })
  }

  // Burst the relevant in-process caches so admin sees the change immediately
  // instead of waiting the 30/60s TTL. Caches still drift on warm Lambdas
  // we don't own — documented in `lib/utils/platformFlags.ts`.
  if (key === 'phase') invalidatePhaseCache()
  if (key.startsWith('disable_')) invalidatePlatformFlagsCache()

  await writeAdminAuditLog(db, {
    actor_user_id: user.id,
    action: 'setting_changed',
    target_kind: 'platform_setting',
    target_id: null,
    details: { key, previous_value: previous?.value ?? null, new_value: value },
  })

  return NextResponse.json({ success: true })
}
