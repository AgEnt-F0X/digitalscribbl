/**
 * Scribble → Yearbook phase machine.
 *
 * Phase is stored in platform_settings.phase as a JSONB string. We cache
 * the read for 30 seconds because every request hits this and the value
 * only changes on admin action or cron.
 *
 * See docs/10 for the state machine. For v1 launch, the phase always
 * returns 'scribble_open' until admin flips it.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type Phase = 'scribble_open' | 'countdown' | 'transition' | 'yearbook'

const PHASE_TTL_MS = 30_000

let cached: { phase: Phase; expiresAt: number } | null = null

/**
 * Returns the current phase. Falls back to 'scribble_open' on any error —
 * the safe default for users mid-action, since aggressive locking is the
 * worst failure mode here.
 */
export async function getPhase(
  supabase: SupabaseClient<Database>,
): Promise<Phase> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.phase

  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'phase')
    .maybeSingle()

  const raw = data?.value
  const phase = normalisePhase(raw)
  cached = { phase, expiresAt: now + PHASE_TTL_MS }
  return phase
}

/** Force the cache to refresh on the next read. Call after admin flips phase. */
export function invalidatePhaseCache() {
  cached = null
}

export function isScribbleOpen(phase: Phase): boolean {
  return phase === 'scribble_open' || phase === 'countdown'
}

export function isYearbook(phase: Phase): boolean {
  return phase === 'yearbook'
}

function normalisePhase(raw: unknown): Phase {
  const value = typeof raw === 'string' ? raw : null
  if (value === 'scribble_open' || value === 'countdown' || value === 'transition' || value === 'yearbook') {
    return value
  }
  return 'scribble_open'
}
