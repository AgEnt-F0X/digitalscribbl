import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AVATAR_PRESETS,
  createDefaultAvatarConfig,
  getAvatarPresetsByCategory,
  isAvatarPresetId,
  normalizeTransform,
} from '../src/features/avatar/data/avatarPresets.ts'
import { DEFAULT_SKIN_TONE_ID, getSkinTone, isSkinToneId, SKIN_TONES } from '../src/features/avatar/data/skinTones.ts'

test('avatar preset registry contains all locked preset ids', () => {
  assert.equal(AVATAR_PRESETS.length, 20)
  assert.equal(getAvatarPresetsByCategory('masculine').length, 10)
  assert.equal(getAvatarPresetsByCategory('feminine').length, 10)

  for (const preset of AVATAR_PRESETS) {
    assert.deepEqual(preset.viewBox, [0, 0, 400, 600])
    assert.match(preset.frontSvgPath, new RegExp(`${preset.id}-front\\.svg$`))
    assert.match(preset.backSvgPath, new RegExp(`${preset.id}-back\\.svg$`))
    assert.equal(isAvatarPresetId(preset.id), true)
  }

  assert.equal(isAvatarPresetId('unknown-preset'), false)
})

test('skin tone lookup uses fixed presets and safe fallback', () => {
  assert.equal(SKIN_TONES.length, 5)
  assert.equal(isSkinToneId(DEFAULT_SKIN_TONE_ID), true)
  assert.equal(isSkinToneId('custom-slider-tone'), false)
  assert.equal(getSkinTone('not-real').id, DEFAULT_SKIN_TONE_ID)
})

test('default avatar config and transform normalization stay bounded', () => {
  const config = createDefaultAvatarConfig('f-soft-straight')
  assert.equal(config.presetId, 'f-soft-straight')
  assert.equal(config.skinToneId, DEFAULT_SKIN_TONE_ID)

  const transform = normalizeTransform(
    { x: Number.NaN, y: 12, scale: 99, rotation: -99 },
    { x: 200, y: 100, scale: 1, rotation: 0 },
  )

  assert.deepEqual(transform, { x: 200, y: 12, scale: 2.8, rotation: -18 })
})
