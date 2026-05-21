/**
 * Free-tier soft-degrade flag reader. See docs/09 for the full list.
 *
 * Each flag lives in platform_settings as a JSONB boolean. We cache reads
 * for 60s because we hit them on every relevant request and they only
 * change on admin action or the daily system-health cron.
 *
 * On any read failure, flags default to FALSE (= feature stays enabled).
 * Failing-open here is intentional: a broken settings table should not
 * accidentally degrade the product. Admin will see the read error in
 * /admin/system-health.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type FlagKey =
  | 'disable_voice_notes'
  | 'disable_realtime_presence'
  | 'disable_realtime_broadcast'
  | 'disable_email_digest'
  | 'disable_new_signups'
  | 'disable_scribble_writes'
  | 'disable_head_uploads'
  | 'disable_share_link_creation'

const ALL_FLAGS: readonly FlagKey[] = [
  'disable_voice_notes',
  'disable_realtime_presence',
  'disable_realtime_broadcast',
  'disable_email_digest',
  'disable_new_signups',
  'disable_scribble_writes',
  'disable_head_uploads',
  'disable_share_link_creation',
]

type FlagState = Record<FlagKey, boolean>

const FLAG_TTL_MS = 60_000

let cached: { flags: FlagState; expiresAt: number } | null = null

function defaultFlags(): FlagState {
  return Object.fromEntries(ALL_FLAGS.map(k => [k, false])) as FlagState
}

/**
 * Returns all degrade flags. Always returns every key so callers can do
 * a single destructure without undefined-checking.
 */
export async function getPlatformFlags(
  supabase: SupabaseClient<Database>,
): Promise<FlagState> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.flags

  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ALL_FLAGS as unknown as string[])

  if (error || !data) {
    return defaultFlags()
  }

  const flags = defaultFlags()
  for (const row of data) {
    const key = row.key as FlagKey
    if (ALL_FLAGS.includes(key)) {
      flags[key] = row.value === true || row.value === 'true'
    }
  }

  cached = { flags, expiresAt: now + FLAG_TTL_MS }
  return flags
}

/**
 * Check a single flag. Convenience over getPlatformFlags()[key].
 */
export async function isFlagOn(
  supabase: SupabaseClient<Database>,
  key: FlagKey,
): Promise<boolean> {
  const flags = await getPlatformFlags(supabase)
  return flags[key]
}

/** Force-refresh on next read. Call after admin toggles a flag. */
export function invalidatePlatformFlagsCache() {
  cached = null
}
