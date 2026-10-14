// Tests for components/marginalia/HeroStickerNotes — the shared hero
// composition primitive used by Dashboard + Profile.
//
// Doc 18 § 19 calls for full DOM-rendering tests of <Whiteboard> and
// <PlaceBackground>. Those require React Testing Library which is not yet
// wired into the test rig. Until then, this file verifies the *data
// contracts* of the marginalia module — slot palette shape, tone enum,
// mobile-collapse rule, and the default slot count. Visual rendering is
// covered by manual QA on /dev/sunlit-lawn.

import { test } from 'vitest'
import assert from 'node:assert/strict'

import {
  STICKER_TONES,
  DEFAULT_HERO_NOTE_SLOTS,
  type StickerTone,
} from '../components/marginalia/HeroStickerNotes.tsx'

test('STICKER_TONES exposes exactly the four canonical tones', () => {
  const expected: StickerTone[] = ['yellow', 'pink', 'green', 'blue']
  const actual = Object.keys(STICKER_TONES).sort()
  assert.deepEqual(actual, expected.sort(),
    'tone palette drifted — keep yellow/pink/green/blue or update the design doc')
})

test('STICKER_TONES values pair a bg-* with a text-* utility', () => {
  for (const [tone, classes] of Object.entries(STICKER_TONES)) {
    assert.match(classes, /\bbg-\[#[0-9a-f]{6}\]/i,
      `${tone} is missing a bg-[#hex] utility`)
    assert.match(classes, /\btext-\[#[0-9a-f]{6}\]/i,
      `${tone} is missing a text-[#hex] utility`)
  }
})

test('DEFAULT_HERO_NOTE_SLOTS has exactly four slots (matches reference image)', () => {
  assert.equal(DEFAULT_HERO_NOTE_SLOTS.length, 4,
    'reference image has four sticker notes around the avatar — adjust both doc 18 and this slot count together')
})

test('first two slots render on mobile, last two collapse on <md', () => {
  // Doc 18 § 12 — mobile composition rule. Slots 0-1 stay; 2-3 hide.
  const mobileVisible = DEFAULT_HERO_NOTE_SLOTS.filter(s => s.mobile)
  const desktopOnly = DEFAULT_HERO_NOTE_SLOTS.filter(s => !s.mobile)
  assert.equal(mobileVisible.length, 2, 'two slots must be mobile-visible')
  assert.equal(desktopOnly.length, 2, 'two slots must be desktop-only')
})

test('every slot uses a known tone from the palette', () => {
  const validTones = new Set<string>(Object.keys(STICKER_TONES))
  for (const slot of DEFAULT_HERO_NOTE_SLOTS) {
    assert.equal(validTones.has(slot.tone), true,
      `slot tone "${slot.tone}" is not in the STICKER_TONES palette`)
  }
})

test('slots pair clockwise + counter-clockwise rotations for visual balance', () => {
  // Doc 18 § 8 — drifting doodles placement rules also apply here:
  // "pair every clockwise-rotated doodle with a counter-clockwise one
  //  nearby" — for the sticker notes that means a mix of negative and
  //  positive rotations.
  const positiveRotations = DEFAULT_HERO_NOTE_SLOTS.filter(s => s.rotation > 0)
  const negativeRotations = DEFAULT_HERO_NOTE_SLOTS.filter(s => s.rotation < 0)
  assert.equal(positiveRotations.length > 0, true,
    'composition is missing clockwise-tilted notes')
  assert.equal(negativeRotations.length > 0, true,
    'composition is missing counter-clockwise-tilted notes')
})

test('slots position via either left OR right (never both)', () => {
  // Each slot anchors to one corner — both-sides positioning would
  // produce overlapping notes on narrow viewports.
  for (const slot of DEFAULT_HERO_NOTE_SLOTS) {
    const hasLeft  = slot.left !== undefined
    const hasRight = slot.right !== undefined
    assert.equal(hasLeft || hasRight, true,
      'slot is missing both left and right — would render at left:auto/right:auto')
    assert.equal(hasLeft && hasRight, false,
      'slot has both left and right — pick one corner per slot')
  }
})
