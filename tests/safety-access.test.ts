import { test } from 'vitest'
import assert from 'node:assert/strict'

import {
  getAccountKind,
  isAllowedEmailDomain,
  normalizeReportReason,
} from '../lib/utils/safetyAccess.ts'

test('university verification is based on configured email domains', () => {
  assert.equal(isAllowedEmailDomain('student@college.edu', ['college.edu']), true)
  assert.equal(isAllowedEmailDomain('student@other.edu', ['college.edu']), false)
  assert.equal(isAllowedEmailDomain('bad-email', ['college.edu']), false)
})

test('an unconfigured allowlist fails closed instead of admitting everyone', () => {
  // Regression guard. v1 returned true when allowedDomains was empty, so a
  // deploy that forgot NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS promoted every Google
  // account to a verified student who could own a shirt and a yearbook page.
  // An empty list now means "no domain is allowed".
  assert.equal(isAllowedEmailDomain('anyone@gmail.com', []), false)
  assert.equal(isAllowedEmailDomain('', []), false)
  assert.equal(getAccountKind('anyone@gmail.com', []), 'external')
})

test('account kind separates university and external users', () => {
  assert.equal(getAccountKind('student@college.edu', ['college.edu']), 'university')
  assert.equal(getAccountKind('friend@gmail.com', ['college.edu']), 'external')
})


test('report reasons are capped and non-empty', () => {
  assert.equal(normalizeReportReason('  abusive content  '), 'abusive content')
  assert.equal(normalizeReportReason('x'.repeat(500))?.length, 240)
  assert.equal(normalizeReportReason(''), null)
})
