import { test } from 'vitest'
import assert from 'node:assert/strict'

import { normalizeScribblePoint } from '../src/features/scribble/types.ts'
import { validateSvgContent } from '../scripts/validate-scribbl-assets.ts'
import { HANDWRITING_STYLES } from '../src/features/scribble/data/handwritingStyles.ts'
import { NOTE_TEMPLATES } from '../src/features/scribble/data/noteTemplates.ts'
import { SCRIBBL_STICKERS } from '../src/features/scribble/data/stickers.ts'

test('normalizeScribblePoint clamps shirt-space coordinates to 0..1', () => {
  assert.deepEqual(normalizeScribblePoint({ x: -0.2, y: 1.6 }), { x: 0, y: 1 })
  assert.deepEqual(normalizeScribblePoint({ x: 0.42, y: 0.75 }), { x: 0.42, y: 0.75 })
})

test('scribbl SVG validator rejects missing required layer ids', () => {
  const errors = validateSvgContent('<svg viewBox="0 0 400 600"><g id="shirt-base" /></svg>', [
    'shirt-base',
    'shirt-drawable',
    'shirt-overlay',
  ])

  assert.deepEqual(errors, ['Missing id="shirt-drawable"', 'Missing id="shirt-overlay"'])
})

test('creative registries expose the locked editor options', () => {
  // Order locked after Route 1 scribble studio v2: `signature` is the entry
  // point for the "Just sign" mode in `ScribbleStudio.tsx`, so it sits first
  // in the registry. If you reorder, audit every `getHandwritingStyle(...)`
  // call site — index-based lookups are NOT used, but the picker render
  // order is the user's first impression of the font palette.
  assert.deepEqual(HANDWRITING_STYLES.map(style => style.id), [
    'signature',
    'casual',
    'neat',
    'marker',
    'playful',
    'tiny-note',
    'bold-farewell',
  ])
  assert.deepEqual(NOTE_TEMPLATES, [
    'You rock!',
    'Keep shining!',
    'Legend!',
    'Will miss you!',
    'Best memories!',
    'Never change!',
    'Stay awesome!',
    'Good vibes only!',
  ])
  assert.deepEqual(SCRIBBL_STICKERS.map(sticker => sticker.id), [
    'heart',
    'star',
    'smile',
    'crown',
    'lightning',
    'sparkle',
    'fire',
    'flower',
    'paper-plane',
    'arrow',
    'bear-doodle',
    'speech-bubble',
  ])
})
