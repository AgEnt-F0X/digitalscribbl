import { describe, expect, it } from 'vitest'
import {
  buildApprovalSummary,
  decideScribble,
  pendingCountForOwner,
} from '@/lib/identity/signing-queue'

describe('decideScribble', () => {
  const pending = { approval_status: 'pending' as const, is_hidden: false }

  it('lets an owner approve a pending scribble', () => {
    expect(decideScribble({ scribble: pending, isOwner: true, decision: 'approved' })).toEqual({
      allowed: true,
      status: 'approved',
    })
  })

  it('lets an owner reject, and the rejection needs no reason', () => {
    expect(decideScribble({ scribble: pending, isOwner: true, decision: 'rejected' })).toEqual({
      allowed: true,
      status: 'rejected',
    })
  })

  it('refuses a decision from anyone but the shirt owner', () => {
    expect(
      decideScribble({ scribble: pending, isOwner: false, decision: 'approved' }),
    ).toEqual({ allowed: false, reason: 'not_owner' })
  })

  it('refuses to re-decide an already-decided scribble', () => {
    expect(
      decideScribble({
        scribble: { approval_status: 'approved', is_hidden: false },
        isOwner: true,
        decision: 'rejected',
      }),
    ).toEqual({ allowed: false, reason: 'already_decided' })
  })

  it('refuses to decide a hidden scribble — moderation is not a shortcut', () => {
    expect(
      decideScribble({
        scribble: { approval_status: 'pending', is_hidden: true },
        isOwner: true,
        decision: 'approved',
      }),
    ).toEqual({ allowed: false, reason: 'already_decided' })
  })
})

describe('buildApprovalSummary', () => {
  it('never tells the rejected scribbler who rejected it or why', () => {
    const summary = buildApprovalSummary({ decision: 'rejected', rejectedByOwner: 'Asha' })
    expect(JSON.stringify(summary)).not.toContain('Asha')
    expect(summary.showDecisionTime).toBe(false)
  })

  it('tells a pending scribbler exactly what is happening', () => {
    const summary = buildApprovalSummary({ decision: 'pending' })
    expect(summary.headline).toMatch(/wait/i)
    expect(summary.mentionOwnerReview).toBe(true)
  })
})

describe('pendingCountForOwner', () => {
  it('counts only pending, non-hidden scribbles', () => {
    const rows = [
      { approval_status: 'pending', is_hidden: false },
      { approval_status: 'pending', is_hidden: true },
      { approval_status: 'approved', is_hidden: false },
    ]
    expect(pendingCountForOwner(rows)).toBe(1)
  })
})
