import test from 'node:test'
import assert from 'node:assert/strict'

import {
  HERO_PRESET_IDS,
  resolveAvatar,
} from '../lib/utils/avatarResolve.ts'
import { DEFAULT_AVATAR_PRESET_ID } from '../src/features/avatar/data/avatarPresets.ts'
import { DEFAULT_SKIN_TONE_ID } from '../src/features/avatar/data/skinTones.ts'

test('resolveAvatar prefers explicit avatar_config.presetId over body_style', () => {
  const resolved = resolveAvatar({
    avatar_config: { presetId: 'f-soft-side-lean', skinToneId: 'skin_03_medium_brown' },
    body_style: 'M2',
    head_front_url: 'https://x.example/me.png',
    head_back_url: null,
  })

  assert.equal(resolved.presetId, 'f-soft-side-lean')
  assert.equal(resolved.config.skinToneId, 'skin_03_medium_brown')
  assert.equal(resolved.config.frontFaceImageUrl, 'https://x.example/me.png')
  assert.equal(resolved.isExplicit, true)
})

test('resolveAvatar maps each legacy body_style to its canonical hero preset', () => {
  const legacyMap: Record<string, string> = {
    M1: 'm-soft-casual',
    M2: 'm-classic-straight',
    M3: 'm-upright-confident',
    F1: 'f-confident-upright',
    F2: 'f-soft-side-lean',
    F3: 'f-relaxed-casual',
  }

  for (const [bodyStyle, expectedPresetId] of Object.entries(legacyMap)) {
    const resolved = resolveAvatar({ body_style: bodyStyle })
    assert.equal(resolved.presetId, expectedPresetId, `${bodyStyle} should map to ${expectedPresetId}`)
    assert.equal(resolved.isExplicit, false, `${bodyStyle} mapping is implicit, not explicit`)
    assert.equal((HERO_PRESET_IDS as readonly string[]).includes(resolved.presetId), true,
      `legacy mapping target ${resolved.presetId} must be a hero preset`)
  }
})

test('resolveAvatar falls back to default when both inputs are missing', () => {
  const resolved = resolveAvatar(null)
  assert.equal(resolved.presetId, DEFAULT_AVATAR_PRESET_ID)
  assert.equal(resolved.config.skinToneId, DEFAULT_SKIN_TONE_ID)
  assert.equal(resolved.isExplicit, false)
})

test('resolveAvatar handles malformed avatar_config gracefully', () => {
  const a = resolveAvatar({ avatar_config: { presetId: 'not-a-real-preset' }, body_style: 'F2' })
  assert.equal(a.presetId, 'f-soft-side-lean', 'invalid presetId should fall through to body_style mapping')
  assert.equal(a.isExplicit, false)

  const b = resolveAvatar({ avatar_config: 'garbage' as unknown, body_style: null })
  assert.equal(b.presetId, DEFAULT_AVATAR_PRESET_ID)
  assert.equal(b.isExplicit, false)
})

test('resolveAvatar merges head urls from the row when avatar_config omits them', () => {
  const resolved = resolveAvatar({
    avatar_config: { presetId: 'm-classic-straight', skinToneId: 'skin_02_wheat' },
    body_style: 'M2',
    head_front_url: 'https://x.example/face.png',
    head_back_url: 'https://x.example/back.png',
  })
  assert.equal(resolved.config.frontFaceImageUrl, 'https://x.example/face.png')
  assert.equal(resolved.config.backHairImageUrl, 'https://x.example/back.png')
})

test('HERO_PRESET_IDS exposes exactly 6 launch-critical poses', () => {
  assert.equal(HERO_PRESET_IDS.length, 6)
  const masculineCount = HERO_PRESET_IDS.filter(id => id.startsWith('m-')).length
  const feminineCount = HERO_PRESET_IDS.filter(id => id.startsWith('f-')).length
  assert.equal(masculineCount, 3, 'three masculine hero poses')
  assert.equal(feminineCount, 3, 'three feminine hero poses')
})
