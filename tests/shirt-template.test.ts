import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getShirtTemplate,
  isBoxInsideDrawableRegion,
  isFullShirtCanvasBox,
  SHIRT_COORDINATE_SPACE,
} from '../lib/utils/shirtTemplate.ts'

test('front and back shirt templates share a stable coordinate system', () => {
  const front = getShirtTemplate('front')
  const back = getShirtTemplate('back')

  assert.equal(front.id, 'farewell-half-sleeve-v1')
  assert.equal(front.coordinateSpace, SHIRT_COORDINATE_SPACE)
  assert.deepEqual(front.viewBox, back.viewBox)
  assert.deepEqual(front.neckAnchor, back.neckAnchor)
  assert.equal(front.drawablePath.startsWith('M'), true)
})

test('drawable region accepts shirt-body placements and rejects collar/outside placements', () => {
  assert.equal(isBoxInsideDrawableRegion({ x: 96, y: 210, w: 90, h: 80 }, 'front'), true)
  assert.equal(isBoxInsideDrawableRegion({ x: 170, y: 8, w: 60, h: 42 }, 'front'), false)
  assert.equal(isBoxInsideDrawableRegion({ x: 2, y: 160, w: 56, h: 80 }, 'front'), false)
})

test('direct clipped drawing uses the full shirt canvas box', () => {
  assert.equal(isFullShirtCanvasBox({ x: 0, y: 0, w: 400, h: 600 }), true)
  assert.equal(isFullShirtCanvasBox({ x: 10, y: 20, w: 180, h: 120 }), false)
})
