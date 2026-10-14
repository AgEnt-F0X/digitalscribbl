/**
 * Server-side resolution of "may this person sign this shirt right now?"
 *
 * This is the adapter between the pure rule in `signing.ts` and the database.
 * `canSignShirt` decides; this module fetches the three facts it needs
 * (visibility, circle membership, block) so no route has to reimplement the
 * query and drift.
 *
 * Every write path that reveals content goes through here: scribble placement,
 * shirt social notes, and the profile's "sign this shirt" affordance. Reading
 * the shirt's mode in four places by hand is how the two models got out of
 * sync in the first place.
 *
 * Uses the service-role client because the viewer's own circle membership and
 * block status are deliberately not readable via PostgREST — a `using (true)`
 * policy would leak every circle's guest list to any authenticated user
 * (migration 005).
 */

import type { createServiceClient } from '@/lib/supabase/server'
import { canSignShirt, type ShirtVisibility } from './signing'

type ServiceDb = Awaited<ReturnType<typeof createServiceClient>>

export interface ShirtAccess {
  /** The shirt's mode. `open` unless the owner changed it. */
  visibility: ShirtVisibility
  ownerId: string
  isLocked: boolean
  /** Owner has permanently blocked this person. Beats every mode. */
  isBlocked: boolean
  /** Viewer is on this shirt's circle (only meaningful for `circle`). */
  isCircleMember: boolean
  /** Owner is suspended or the viewer is suspended. */
  ownerSuspended: boolean
  viewerSuspended: boolean
}

export type AccessFailure =
  | 'shirt_not_found'
  | 'own_shirt'
  | 'blocked'
  | 'not_in_circle'
  | 'viewer_suspended'
  | 'owner_suspended'
  | 'shirt_locked'

export interface AccessCheck {
  allowed: boolean
  reason: AccessFailure | null
  /** True when the scribble may be drawn but must wait for the owner's okay. */
  needsApproval: boolean
  access: ShirtAccess | null
}

/**
 * Coerce a possibly-null legacy value into a mode.
 *
 * `null` and anything unrecognised become `open`, matching the column default:
 * a shirt is signable the moment it exists, and a bad value must not
 * accidentally lock a student out of their own scribble day.
 */
export function normalizeVisibility(value: string | null | undefined): ShirtVisibility {
  return value === 'circle' || value === 'approval' ? value : 'open'
}

/** Copy for a refusal, written so nobody feels accused. */
export function describeAccessFailure(reason: AccessFailure | null): string {
  switch (reason) {
    case 'own_shirt':
      return "This is your own shirt — friends sign it, you decorate it."
    case 'blocked':
      return "This shirt isn't taking signatures from you right now."
    case 'not_in_circle':
      return 'This shirt is for a small circle the owner picked. Ask them to add you.'
    case 'viewer_suspended':
      return 'Your account is paused, so you cannot sign right now.'
    case 'owner_suspended':
      return "This shirt isn't available right now."
    case 'shirt_locked':
      return 'This shirt is paused for new signatures.'
    default:
      return 'You cannot sign this shirt right now.'
  }
}

/**
 * Load a shirt's access posture for one viewer.
 *
 * Returns null when the shirt does not exist, so callers can answer 404 rather
 * than leaking "this shirt exists but you may not sign it".
 */
export async function loadShirtAccess(
  db: ServiceDb,
  shirtId: string,
  viewerId: string,
): Promise<ShirtAccess | null> {
  const { data: shirt } = await db
    .from('shirts')
    .select('id, owner_id, visibility, is_locked')
    .eq('id', shirtId)
    .maybeSingle()

  if (!shirt) return null

  const visibility = normalizeVisibility(shirt.visibility)
  const ownerId = shirt.owner_id as string | null

  const [{ data: viewer }, { data: owner }, { data: block }, { data: circle }] =
    await Promise.all([
      db.from('users').select('is_suspended').eq('id', viewerId).maybeSingle(),
      ownerId
        ? db.from('users').select('is_suspended').eq('id', ownerId).maybeSingle()
        : Promise.resolve({ data: null }),
      db
        .from('shirt_blocks')
        .select('shirt_id')
        .eq('shirt_id', shirtId)
        .eq('blocked_id', viewerId)
        .maybeSingle(),
      db
        .from('shirt_circle')
        .select('shirt_id')
        .eq('shirt_id', shirtId)
        .eq('user_id', viewerId)
        .maybeSingle(),
    ])

  return {
    visibility,
    ownerId: ownerId ?? '',
    isLocked: Boolean(shirt.is_locked),
    isBlocked: Boolean(block),
    isCircleMember: Boolean(circle),
    ownerSuspended: Boolean(owner?.is_suspended),
    viewerSuspended: Boolean(viewer?.is_suspended),
  }
}

/**
 * Full check, in the order that produces the most useful refusal.
 *
 * Order matters: suspension and self-signing are answered before the mode,
 * because "you cannot sign your own shirt" is true even on an open one, and a
 * suspended account is refused regardless of who invited them.
 */
export async function checkShirtAccess(
  db: ServiceDb,
  shirtId: string,
  viewerId: string,
): Promise<AccessCheck> {
  const access = await loadShirtAccess(db, shirtId, viewerId)
  if (!access) {
    return { allowed: false, reason: 'shirt_not_found', needsApproval: false, access: null }
  }

  if (access.viewerSuspended) {
    return { allowed: false, reason: 'viewer_suspended', needsApproval: false, access }
  }
  if (access.ownerSuspended) {
    return { allowed: false, reason: 'owner_suspended', needsApproval: false, access }
  }
  if (viewerId === access.ownerId) {
    return { allowed: false, reason: 'own_shirt', needsApproval: false, access }
  }
  if (access.isBlocked) {
    return { allowed: false, reason: 'blocked', needsApproval: false, access }
  }

  const decision = canSignShirt({
    shirt: { visibility: access.visibility },
    isOwner: false,
    isBlocked: access.isBlocked,
    isCircleMember: access.isCircleMember,
  })

  if (!decision.allowed) {
    return {
      allowed: false,
      reason: (decision.reason ?? 'not_in_circle') as AccessFailure,
      needsApproval: false,
      access,
    }
  }

  return {
    allowed: true,
    reason: null,
    needsApproval: Boolean(decision.needsApproval),
    access,
  }
}
