import { describe, expect, it } from 'vitest'
import { canSignShirt, SHIRT_VISIBILITIES, type ShirtVisibility } from '@/lib/identity/signing'

const openShirt: { visibility: ShirtVisibility } = { visibility: 'open' }
const circleShirt: { visibility: ShirtVisibility } = { visibility: 'circle' }
const approvalShirt: { visibility: ShirtVisibility } = { visibility: 'approval' }

describe('canSignShirt', () => {
  it('lets anyone with the link sign an open shirt — real-life scribble day', () => {
    expect(
      canSignShirt({ shirt: openShirt, isOwner: false, isBlocked: false, isCircleMember: false }),
    ).toEqual({ allowed: true, reason: null })
  })

  it('blocks the owner from signing their own shirt', () => {
    expect(canSignShirt({ shirt: openShirt, isOwner: true, isBlocked: false })).toEqual({
      allowed: false,
      reason: 'own_shirt',
    })
  })

  it('overrides every mode when the owner has blocked the person', () => {
    for (const shirt of [openShirt, circleShirt, approvalShirt]) {
      expect(
        canSignShirt({ shirt, isOwner: false, isBlocked: true, isCircleMember: true }),
      ).toEqual({ allowed: false, reason: 'blocked' })
    }
  })

  it('keeps a circle shirt to circle members', () => {
    expect(
      canSignShirt({ shirt: circleShirt, isOwner: false, isBlocked: false, isCircleMember: true }),
    ).toEqual({ allowed: true, reason: null })
    expect(
      canSignShirt({ shirt: circleShirt, isOwner: false, isBlocked: false, isCircleMember: false }),
    ).toEqual({ allowed: false, reason: 'not_in_circle' })
  })

  it('lets anyone draw on an approval shirt, but holds it for review', () => {
    expect(
      canSignShirt({ shirt: approvalShirt, isOwner: false, isBlocked: false }),
    ).toEqual({ allowed: true, reason: null, needsApproval: true })
  })
})

describe('SHIRT_VISIBILITIES', () => {
  it('has exactly the three modes the product offers', () => {
    expect(SHIRT_VISIBILITIES).toEqual(['open', 'circle', 'approval'])
  })
})
