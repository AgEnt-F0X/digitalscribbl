import test from 'node:test'
import assert from 'node:assert/strict'

import { createFixedWindowRateLimiter } from '../lib/utils/rateLimit.ts'
import { createActionCooldown } from '../lib/utils/actionCooldown.ts'

test('fixed window rate limiter allows requests up to the configured limit', () => {
  const limiter = createFixedWindowRateLimiter({ limit: 2, windowMs: 1000, now: () => 1000 })

  assert.deepEqual(limiter.check('user-1'), { allowed: true, remaining: 1, retryAfterMs: 0 })
  assert.deepEqual(limiter.check('user-1'), { allowed: true, remaining: 0, retryAfterMs: 0 })
})

test('fixed window rate limiter blocks until the current window resets', () => {
  let now = 1000
  const limiter = createFixedWindowRateLimiter({ limit: 1, windowMs: 500, now: () => now })

  assert.equal(limiter.check('user-1').allowed, true)
  assert.deepEqual(limiter.check('user-1'), { allowed: false, remaining: 0, retryAfterMs: 500 })

  now = 1500
  assert.deepEqual(limiter.check('user-1'), { allowed: true, remaining: 0, retryAfterMs: 0 })
})

test('action cooldown prevents duplicate client actions during the cooldown window', () => {
  let now = 2000
  const cooldown = createActionCooldown({ cooldownMs: 750, now: () => now })

  assert.equal(cooldown.canRun('save-scribble'), true)
  assert.equal(cooldown.canRun('save-scribble'), false)

  now = 2750
  assert.equal(cooldown.canRun('save-scribble'), true)
})
