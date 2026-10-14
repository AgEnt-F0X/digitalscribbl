import { describe, expect, it } from 'vitest'
import { resolveGroupingScope } from '@/lib/identity/enrollment'

describe('resolveGroupingScope honours the program batch range', () => {
  it('accepts a batch within a small program range', () => {
    expect(
      resolveGroupingScope({
        programKey: 'btech-biotech',
        batchSelectionRequired: true,
        batch: 4,
        batchMax: 4,
      }),
    ).toEqual({ scope: 'batch', batch: 4 })
  })

  it('rejects a batch beyond a program range smaller than the CSE default', () => {
    // A 4-section program must not accept batch 20: that would create a batch
    // group with no members, silently splitting a cohort.
    expect(
      resolveGroupingScope({
        programKey: 'btech-biotech',
        batchSelectionRequired: true,
        batch: 20,
        batchMax: 4,
      }),
    ).toEqual({ scope: 'course', batch: null })
  })

  it('rejects a batch beyond the configured CSE range of 52', () => {
    expect(
      resolveGroupingScope({
        programKey: 'btech-cse',
        batchSelectionRequired: true,
        batch: 53,
        batchMax: 52,
      }),
    ).toEqual({ scope: 'course', batch: null })
  })

  it('still defaults to course-wide when no range is supplied', () => {
    expect(
      resolveGroupingScope({
        programKey: 'btech-cse',
        batchSelectionRequired: true,
        batch: 7,
      }),
    ).toEqual({ scope: 'batch', batch: 7 })
  })
})
