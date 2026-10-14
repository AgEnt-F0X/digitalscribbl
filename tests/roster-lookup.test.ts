import { describe, expect, it } from 'vitest'
import { buildRosterIndex, lookupRosterEntry, ROSTER_UNAVAILABLE } from '@/lib/identity/roster'

const students = [
  {
    enrollment_number: 'E22CSEU0010',
    name: 'RUDRAKSH SINGH',
    program_level: 'UG',
    program_name: 'Bachelor of Technology (Computer Science and Engineering)',
    graduation_year: 2022,
    cse_batch: null,
    batch_selection_required: true,
  },
  {
    enrollment_number: 'E22BCAU0036',
    name: 'TANISH CHOPRA',
    program_level: 'UG',
    program_name: 'Bachelor of Computer Applications',
    graduation_year: 2022,
    cse_batch: null,
    batch_selection_required: false,
  },
]

describe('buildRosterIndex', () => {
  it('indexes students by normalized enrollment', () => {
    const index = buildRosterIndex(students)
    expect(index.get('E22CSEU0010')?.name).toBe('RUDRAKSH SINGH')
  })

  it('drops blank names so a nameless row can never become a verified identity', () => {
    const index = buildRosterIndex([{ ...students[0], name: '' }])
    expect(index.has('E22CSEU0010')).toBe(false)
  })

  it('ignores rows whose enrollment is not parseable', () => {
    const index = buildRosterIndex([{ ...students[0], enrollment_number: 'nope' }])
    expect(index.size).toBe(0)
  })
})

describe('lookupRosterEntry', () => {
  const index = buildRosterIndex(students)

  it('finds a student by enrollment regardless of typed formatting', () => {
    const entry = lookupRosterEntry(index, 'e22-cseu-0010')
    expect(entry === ROSTER_UNAVAILABLE ? null : entry?.programName).toContain('Computer Science')
  })

  it('returns null for an enrollment that is not on the roster', () => {
    expect(lookupRosterEntry(index, 'E22CSEU9999')).toBeNull()
  })

  it('returns null for unparseable input rather than throwing', () => {
    expect(lookupRosterEntry(index, '12345')).toBeNull()
  })

  it('fails closed when the roster could not be loaded', () => {
    expect(lookupRosterEntry(null, 'E22CSEU0010')).toBe(ROSTER_UNAVAILABLE)
  })

  it('never leaks the roster: the failure sentinel is a symbol, not data', () => {
    expect(typeof ROSTER_UNAVAILABLE).toBe('symbol')
  })
})
