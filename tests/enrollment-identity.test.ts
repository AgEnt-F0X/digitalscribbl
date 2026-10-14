import { describe, expect, it } from 'vitest'
import {
  assertBatchSelection,
  enrollmentVerificationEmail,
  maskEnrollment,
  normalizeEnrollment,
  resolveGroupingScope,
  type GroupingScopeInput,
} from '@/lib/identity/enrollment'

describe('normalizeEnrollment', () => {
  it('uppercases and strips surrounding whitespace', () => {
    expect(normalizeEnrollment('  e22cseu0010  ')).toBe('E22CSEU0010')
  })

  it('strips internal spaces and hyphens the way students type them', () => {
    expect(normalizeEnrollment('E22 CSEU 0010')).toBe('E22CSEU0010')
    expect(normalizeEnrollment('e22-cseu-0010')).toBe('E22CSEU0010')
  })

  it('rejects empty input', () => {
    expect(normalizeEnrollment('   ')).toBeNull()
  })

  it('rejects a bare institution prefix that is not a real student id', () => {
    expect(normalizeEnrollment('E22')).toBeNull()
  })
})

describe('enrollmentVerificationEmail', () => {
  it('builds the institutional mailbox from enrollment plus domain', () => {
    expect(enrollmentVerificationEmail('E22CSEU0010', 'bennett.edu.in')).toBe(
      'e22cseu0010@bennett.edu.in',
    )
  })

  it('lowercases and trims the configured domain', () => {
    expect(enrollmentVerificationEmail('E22CSEU0010', ' Bennett.edu.in ')).toBe(
      'e22cseu0010@bennett.edu.in',
    )
  })

  it('refuses to build an address when no domain is configured', () => {
    expect(enrollmentVerificationEmail('E22CSEU0010', '')).toBeNull()
  })
})

describe('maskEnrollment', () => {
  it('keeps the program prefix visible and masks the serial digits', () => {
    expect(maskEnrollment('E22CSEU0010')).toBe('E22CSEU••••')
  })

  it('masks conservatively for short or unrecognized ids', () => {
    expect(maskEnrollment('E22')).toBe('••')
  })
})

describe('resolveGroupingScope', () => {
  const cse: GroupingScopeInput = {
    programKey: 'btech-cse',
    batchSelectionRequired: true,
    batch: 12,
  }

  it('uses batch-scoped groups for a batch-enabled program with a chosen batch', () => {
    expect(resolveGroupingScope(cse)).toEqual({ scope: 'batch', batch: 12 })
  })

  it('falls back to course-wide groups when batches are not enabled for the program', () => {
    expect(
      resolveGroupingScope({ ...cse, batchSelectionRequired: false, batch: null }),
    ).toEqual({ scope: 'course', batch: null })
  })

  it('falls back to course-wide when a batch-enabled program has no batch chosen', () => {
    expect(resolveGroupingScope({ ...cse, batch: null })).toEqual({
      scope: 'course',
      batch: null,
    })
  })

  it('ignores an out-of-range batch rather than creating a phantom batch group', () => {
    expect(resolveGroupingScope({ ...cse, batch: 0 })).toEqual({ scope: 'course', batch: null })
    expect(resolveGroupingScope({ ...cse, batch: 53 })).toEqual({ scope: 'course', batch: null })
  })
})

describe('assertBatchSelection', () => {
  it('accepts a valid batch for a batch-enabled program', () => {
    expect(
      assertBatchSelection({ batchSelectionRequired: true, batch: 52, batchMin: 1, batchMax: 52 }),
    ).toBeNull()
  })

  it('requires a batch when the program has batches enabled', () => {
    expect(
      assertBatchSelection({ batchSelectionRequired: true, batch: null, batchMin: 1, batchMax: 52 }),
    ).toBe('Select your batch to continue.')
  })

  it('rejects a batch outside the enabled range', () => {
    expect(
      assertBatchSelection({ batchSelectionRequired: true, batch: 53, batchMin: 1, batchMax: 52 }),
    ).toBe('That batch is not available.')
  })

  it('ignores batch input entirely for course-wide programs', () => {
    expect(
      assertBatchSelection({
        batchSelectionRequired: false,
        batch: 99,
        batchMin: 1,
        batchMax: 52,
      }),
    ).toBeNull()
  })
})
