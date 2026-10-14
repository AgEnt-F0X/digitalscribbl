/**
 * Enrollment-first identity rules for the v2 launch cohort.
 *
 * The convocation roster is the source of truth for *who is a graduating
 * student*. This module owns the pure rules around it: how a typed enrollment
 * number becomes a comparable key, where its verification mail goes, and
 * whether a program is grouped by batch or by whole course.
 *
 * Deliberately no I/O here — the roster itself is private data and is loaded
 * only by server-side callers. See `lib/identity/roster.ts` for the loader.
 */

/** Programs with section/batch structure get 1..N; others are course-wide. */
export const DEFAULT_CSE_BATCH_COUNT = 52

/** Minimal, dependency-free shape of the official enrollment formats. */
const ENROLLMENT_PATTERN = /^[A-Z]\d{2}[A-Z]{2,5}[A-Z]?\d{3,5}$/

export interface GroupingScopeInput {
  /** Stable program key, e.g. `btech-cse`. */
  programKey: string
  /** True when the program has batch structure enabled in the admin config. */
  batchSelectionRequired: boolean
  /** Student-chosen batch, or null when course-wide. */
  batch: number | null
  /**
   * Section count for this program, from `programs.batch_count`. Falls back to
   * the CSE launch range when a caller has not loaded the program yet.
   */
  batchMax?: number | null
}

export interface GroupingScope {
  scope: 'batch' | 'course'
  batch: number | null
}

export interface BatchSelectionInput {
  batchSelectionRequired: boolean
  batch: number | null
  batchMin: number
  batchMax: number
}

/**
 * Normalize what a student types into the canonical uppercase key.
 *
 * Tolerates the spacing and hyphenation people actually use when reading an
 * enrollment number off a hall ticket. Returns null for anything that is not a
 * plausible enrollment id, so callers never match garbage against the roster.
 */
export function normalizeEnrollment(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const compact = raw.trim().toUpperCase().replace(/[\s-]+/g, '')
  if (!ENROLLMENT_PATTERN.test(compact)) return null
  return compact
}

/**
 * The institutional mailbox a student proves ownership of.
 *
 * Bennett provisions enrollment-number mailboxes, so the roster's enrollment id
 * doubles as the local part. Returns null when no domain is configured, so a
 * misconfigured deployment fails closed instead of mailing the wrong person.
 */
export function enrollmentVerificationEmail(
  enrollment: string,
  domain: string | null | undefined,
): string | null {
  const normalized = normalizeEnrollment(enrollment)
  const cleanDomain = domain?.trim().toLowerCase()
  if (!normalized || !cleanDomain) return null
  return `${normalized.toLowerCase()}@${cleanDomain}`
}

/**
 * Masked enrollment for logs, admin views, and any UI echo.
 *
 * The program prefix stays legible because staff need it to identify a record;
 * the serial digits never leave the server unmasked.
 */
export function maskEnrollment(enrollment: string): string {
  const normalized = normalizeEnrollment(enrollment) ?? enrollment.trim().toUpperCase()
  const match = /^([A-Z]\d{2}[A-Z]{2,5}[A-Z]?)(\d{3,5})$/.exec(normalized)
  if (!match) return '••'
  return `${match[1]}••••`
}

/**
 * Decide which cohort bucket a student belongs to.
 *
 * Falls back to course-wide whenever a batch-enabled program is missing a
 * batch or holds an out-of-range one. A phantom batch group is worse than a
 * course-wide group: it silently splits a cohort that should sign each other.
 */
export function resolveGroupingScope(input: GroupingScopeInput): GroupingScope {
  const { batch, batchSelectionRequired } = input
  if (!batchSelectionRequired) return { scope: 'course', batch: null }
  if (batch === null || !Number.isInteger(batch)) return { scope: 'course', batch: null }
  // The valid range is the program's own section count. Using the CSE launch
  // value for every program would let a 4-section course accept batch 20 and
  // create an empty batch group, silently splitting that cohort.
  const batchMax = input.batchMax ?? DEFAULT_CSE_BATCH_COUNT
  if (batch < 1 || batch > batchMax) return { scope: 'course', batch: null }
  return { scope: 'batch', batch }
}

/** Validation for the onboarding batch step; null means valid. */
export function assertBatchSelection(input: BatchSelectionInput): string | null {
  if (!input.batchSelectionRequired) return null
  const { batch, batchMin, batchMax } = input
  if (batch === null || batch === undefined) return 'Select your batch to continue.'
  if (!Number.isInteger(batch) || batch < batchMin || batch > batchMax) {
    return 'That batch is not available.'
  }
  return null
}
