import { test } from 'vitest'
import assert from 'node:assert/strict'

import { calculateShirtLevel } from '../lib/utils/shirtLevel.ts'

test('shirt level is driven by verified unique scribblers, not only raw scribble count', () => {
  const result = calculateShirtLevel({
    uniqueScribblerCount: 4,
    visibleScribbleCount: 40,
  })

  assert.equal(result.level, 1)
  assert.equal(result.label, 'First marks')
})

test('shirt level reaches higher color phases as unique verified signing grows', () => {
  const result = calculateShirtLevel({
    uniqueScribblerCount: 36,
    visibleScribbleCount: 50,
  })

  assert.equal(result.level, 4)
  assert.equal(result.label, 'Campus favorite')
})

test('admin level override is clamped and explicitly marked', () => {
  const result = calculateShirtLevel({
    uniqueScribblerCount: 0,
    visibleScribbleCount: 0,
    adminLevelOverride: 99,
  })

  assert.equal(result.level, 5)
  assert.equal(result.isAdminOverride, true)
})
