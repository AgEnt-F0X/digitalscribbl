import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadRosterIndex, resetRosterCache, ROSTER_UNAVAILABLE, lookupRosterEntry } from '@/lib/identity/roster'

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
]

afterEach(() => {
  resetRosterCache()
  delete process.env.SCRIBBL_ROSTER_PATH
})

describe('loadRosterIndex', () => {
  it('returns null when no roster path is configured, so verification fails closed', async () => {
    expect(await loadRosterIndex()).toBeNull()
  })

  it('loads and indexes a valid dataset', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'roster-'))
    const path = join(dir, 'students.json')
    await writeFile(path, JSON.stringify(students), 'utf8')
    process.env.SCRIBBL_ROSTER_PATH = path
    try {
      const index = await loadRosterIndex()
      expect(lookupRosterEntry(index, 'E22CSEU0010')).not.toBeNull()
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('does not cache a failure: a later valid path is picked up after reset', async () => {
    process.env.SCRIBBL_ROSTER_PATH = join(tmpdir(), 'definitely-missing-roster.json')
    expect(await loadRosterIndex()).toBeNull()
    // Simulate the process recovering (file deployed, mount remounted).
    resetRosterCache()
    const dir = await mkdtemp(join(tmpdir(), 'roster-'))
    const path = join(dir, 'students.json')
    await writeFile(path, JSON.stringify(students), 'utf8')
    process.env.SCRIBBL_ROSTER_PATH = path
    try {
      const index = await loadRosterIndex()
      expect(lookupRosterEntry(index, 'E22CSEU0010')).not.toBe(ROSTER_UNAVAILABLE)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
