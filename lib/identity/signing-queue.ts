/**
 * The approval queue behind the `approval` shirt mode.
 *
 * The product question this answers: how do you give a student full control
 * without making her screen every drawing twice, and without making the
 * scribbler feel punished for using the feature she was invited to?
 *
 * The answer: one queue, one decision, no reason required.
 *   · The scribbler draws immediately and keeps seeing her own work.
 *   · The owner sees "3 people waiting" and approves or declines in one tap.
 *   · A decline says nothing about who or why, so the owner is never quoted back
 *     at themselves and the queue can never become an argument.
 *
 * Moderation stays fast because it is bounded: the owner can also switch the
 * shirt to `open` at any point, which releases everything still pending.
 */

export type ApprovalDecision = 'approved' | 'rejected'
export type ApprovalState = 'pending' | 'approved' | 'rejected'

export interface ScribbleApprovalRow {
  approval_status: string
  is_hidden: boolean
}

export interface DecideInput {
  scribble: ScribbleApprovalRow
  /** True when the caller owns the shirt the scribble sits on. */
  isOwner: boolean
  decision: ApprovalDecision
}

export type DecideResult =
  | { allowed: true; status: ApprovalState }
  | { allowed: false; reason: 'not_owner' | 'already_decided' }

/**
 * Can this decision be made?
 *
 * Hidden scribbles are treated as already decided: a scribble pulled for
 * moderation must not be resurrectable through the approval queue, otherwise
 * approve-and-report would be a no-op.
 */
export function decideScribble(input: DecideInput): DecideResult {
  if (!input.isOwner) return { allowed: false, reason: 'not_owner' }
  if (input.scribble.is_hidden) return { allowed: false, reason: 'already_decided' }
  if (input.scribble.approval_status !== 'pending') {
    return { allowed: false, reason: 'already_decided' }
  }
  return { allowed: true, status: input.decision }
}

/** What the owner shows in the dashboard: a count, never a list of names. */
export function pendingCountForOwner(rows: ScribbleApprovalRow[]): number {
  return rows.filter((row) => row.approval_status === 'pending' && !row.is_hidden).length
}

export interface ApprovalSummary {
  /** One line, safe to show the scribbler. */
  headline: string
  /** Whether to tell them a human is reviewing it. */
  mentionOwnerReview: boolean
  /**
   * Whether to show when the decision landed. False for a rejection: a
   * timestamp turns "declined" into a thing to argue about.
   */
  showDecisionTime: boolean
}

interface SummaryInput {
  decision: ApprovalState
  rejectedByOwner?: string
}

/**
 * Copy for the scribbler's own view of a pending or decided scribble.
 *
 * `rejectedByOwner` is accepted and deliberately dropped: naming the owner in a
 * rejection is how a private moderation decision becomes a public confrontation.
 */
export function buildApprovalSummary(input: SummaryInput): ApprovalSummary {
  if (input.decision === 'pending') {
    return {
      headline: "Your scribble is on the shirt, waiting for the owner's okay.",
      mentionOwnerReview: true,
      showDecisionTime: false,
    }
  }
  if (input.decision === 'approved') {
    return {
      headline: 'Your scribble is live on the shirt.',
      mentionOwnerReview: false,
      showDecisionTime: true,
    }
  }
  return {
    headline: "This shirt's owner didn't post this one.",
    mentionOwnerReview: false,
    showDecisionTime: false,
  }
}
