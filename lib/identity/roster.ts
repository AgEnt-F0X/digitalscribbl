/**
 * Server-only access to the private convocation roster.
 *
 * The roster is real student PII (name + enrollment number for ~2,500 people).
 * Rules this module enforces so callers cannot get it wrong:
 *
 *  - It is never bundled into the client. Only `server-only` style server
 *    routes import this; nothing here is re-exported to a component.
 *  - Lookups are exact-key only, so a caller cannot enumerate or wildcard the
 *    roster, and each hit is charged to a rate limit upstream.
 *  - An unavailable roster fails closed via a sentinel rather than by silently
 *    returning "not found" — otherwise a broken deploy would quietly look like
 *    "your enrollment isn't in the list" and send every student to manual review.
 *
 * The dataset itself is produced by the extraction pipeline and is NOT stored
 * in this repository. Point `SCRIBBL_ROSTER_PATH` at it on the server.
 */
// Server-only by construction: this module imports node:fs, so it cannot be
// bundled into a client component. Do not import it from anything under a
// `'use client'` file.
import { readFile } from 'node:fs/promises'
import { normalizeEnrollment } from './enrollment'

/** Row shape emitted by the extraction pipeline. */
export interface RosterStudent {
  enrollment_number: string
  name: string
  program_level: string | null
  program_name: string
  graduation_year: number | null
  cse_batch: number | null
  batch_selection_required: boolean
}

export interface RosterEntry {
  enrollmentNumber: string
  /** Official name. Only ever returned to the owner of the verified mailbox. */
  name: string
  programLevel: string | null
  programName: string
  graduationYear: number | null
  batchSelectionRequired: boolean
}

/** Distinct from `null` so callers can tell "no such student" from "roster down". */
export const ROSTER_UNAVAILABLE = Symbol('roster-unavailable')

export type RosterIndex = Map<string, RosterEntry>
export type RosterLookup = RosterEntry | null | typeof ROSTER_UNAVAILABLE

function toEntry(student: RosterStudent): RosterEntry {
  return {
    enrollmentNumber: student.enrollment_number,
    name: student.name.trim(),
    programLevel: student.program_level,
    programName: student.program_name,
    graduationYear: student.graduation_year,
    batchSelectionRequired: Boolean(student.batch_selection_required),
  }
}

/**
 * Build the lookup index, discarding any row that cannot serve as a verified
 * identity: unparseable enrollment, or a missing name.
 */
export function buildRosterIndex(students: RosterStudent[]): RosterIndex {
  const index: RosterIndex = new Map()
  for (const student of students) {
    const enrollment = normalizeEnrollment(student.enrollment_number)
    if (!enrollment) continue
    if (!student.name || !student.name.trim()) continue
    index.set(enrollment, toEntry(student))
  }
  return index
}

export function lookupRosterEntry(index: RosterIndex | null, rawEnrollment: string): RosterLookup {
  if (index === null) return ROSTER_UNAVAILABLE
  const enrollment = normalizeEnrollment(rawEnrollment)
  if (!enrollment) return null
  return index.get(enrollment) ?? null
}

let cached: Promise<RosterIndex | null> | null = null

/**
 * Load and memoize the roster. Returns null when the file is absent or
 * unreadable so verification fails closed instead of passing everyone.
 */
export function loadRosterIndex(): Promise<RosterIndex | null> {
  if (cached) return cached
  cached = (async () => {
    const path = process.env.SCRIBBL_ROSTER_PATH
    if (!path) return null
    try {
      const raw = await readFile(path, 'utf8')
      return buildRosterIndex(JSON.parse(raw) as RosterStudent[])
    } catch (error) {
      console.error('[roster] failed to load roster dataset', error)
      return null
    }
  })()
  return cached
}

/**
 * Drop the memoized load.
 *
 * Needed beyond tests: a failed load currently memoizes `null` for the life of
 * the process. On a serverless cold start that's a retried function instance
 * at worst, but in a long-lived Node process one transient read error (a
 * network-mounted file, a deploy swapping the file) would silently disable
 * verification until restart. Callers that retry verification should reset.
 */
export function resetRosterCache() {
  cached = null
}
