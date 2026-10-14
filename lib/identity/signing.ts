/**
 * Who may sign which shirt — the one rule the whole product turns on.
 *
 * Design goal: the *default* must be as open as real scribble day, because a
 * wall of closed doors is what kills a signing window. Safety is opt-in and
 * per-shirt, so it costs a student nothing unless they ask for it.
 *
 * Three modes, not a permission matrix:
 *
 *   open      — anyone with the link signs, scribble lands immediately.
 *               The default, and what most students want.
 *   circle    — only people the owner added. The private shirt.
 *   approval  — anyone may draw, but the owner approves each person before the
 *               scribble appears. Escape hatch for anyone who wants an
 *               air-conditioned, fully-moderated shirt.
 *
 * The owner's own "block" is a separate, unconditional switch: it beats every
 * mode above and survives any mode change, so switching a shirt from approval
 * back to open never silently re-admits someone who was blocked.
 */

/** The three shirt modes, in the order they are offered in settings. */
export const SHIRT_VISIBILITIES = ['open', 'circle', 'approval'] as const

export type ShirtVisibility = (typeof SHIRT_VISIBILITIES)[number]

export interface ShirtAccessInput {
  shirt: { visibility: ShirtVisibility }
  isOwner: boolean
  /** Owner has blocked this person. Beats every other rule. */
  isBlocked?: boolean | undefined
  /** Viewer is a member of the shirt's circle (for `circle` mode). */
  isCircleMember?: boolean | undefined
}

export interface ShirtAccessDecision {
  allowed: boolean
  /** Machine-readable refusal, for API responses and analytics. */
  reason: 'own_shirt' | 'blocked' | 'not_in_circle' | null
  /**
   * True when the scribble may be drawn but must be held for the owner's
   * approval before it is visible to anyone else.
   */
  needsApproval?: boolean
}

/**
 * Decide whether a viewer may place a scribble on a shirt.
 *
 * Note this only governs *placement*. Approval state for a pending scribble is
 * separate and lives in `lib/identity/signing-queue`.
 */
export function canSignShirt(input: ShirtAccessInput): ShirtAccessDecision {
  const { shirt, isOwner, isBlocked, isCircleMember } = input

  if (isOwner) return { allowed: false, reason: 'own_shirt' }
  if (isBlocked) return { allowed: false, reason: 'blocked' }

  if (shirt.visibility === 'circle' && !isCircleMember) {
    return { allowed: false, reason: 'not_in_circle' }
  }

  if (shirt.visibility === 'approval') {
    return { allowed: true, reason: null, needsApproval: true }
  }

  return { allowed: true, reason: null }
}
