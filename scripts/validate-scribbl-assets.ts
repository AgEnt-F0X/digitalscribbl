import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const avatarPresetAssetIds = {
  masculine: [
    'm-classic-straight',
    'm-relaxed-shoulder-tilt',
    'm-hands-behind-back',
    'm-broad-shoulders',
    'm-soft-casual',
    'm-oversized-shirt-fit',
    'm-subtle-forward-lean',
    'm-open-shoulder-relaxed',
    'm-upright-confident',
    'm-side-weight-shift',
  ],
  feminine: [
    'f-soft-straight',
    'f-peace-sign',
    'f-shoulder-tilt',
    'f-oversized-shirt-fit',
    'f-hands-behind-back',
    'f-soft-side-lean',
    'f-relaxed-casual',
    'f-tiny-wave',
    'f-confident-upright',
    'f-inward-shoulder-pose',
  ],
} as const

const AVATAR_REQUIRED_IDS = ['skin-fill', 'shirt-base', 'shirt-drawable', 'shirt-overlay']
const EDITOR_REQUIRED_IDS = ['shirt-base', 'shirt-drawable', 'shirt-overlay']

export function validateSvgContent(content: string, requiredIds: string[]) {
  const errors: string[] = []
  if (!content.includes('viewBox="0 0 400 600"')) {
    errors.push('Invalid viewBox')
  }
  for (const id of requiredIds) {
    if (!content.includes(`id="${id}"`)) {
      errors.push(`Missing id="${id}"`)
    }
  }
  return errors
}

function validateSvg(path: string, requiredIds: string[], errors: string[]) {
  if (!existsSync(path)) {
    errors.push(`Missing SVG: ${path}`)
    return
  }
  const content = readFileSync(path, 'utf8')
  errors.push(...validateSvgContent(content, requiredIds).map(error => `${error}: ${path}`))
}

export function validateScribblAssets() {
  const errors: string[] = []

  for (const [category, ids] of Object.entries(avatarPresetAssetIds)) {
    for (const id of ids) {
      for (const side of ['front', 'back'] as const) {
        validateSvg(
          join('src', 'assets', 'scribbl', 'avatar-presets', category, id, `${id}-${side}.svg`),
          AVATAR_REQUIRED_IDS,
          errors,
        )
      }
    }
  }

  for (const side of ['front', 'back'] as const) {
    validateSvg(
      join('src', 'assets', 'scribbl', 'shirt-editor', `shirt-editor-${side}.svg`),
      EDITOR_REQUIRED_IDS,
      errors,
    )
  }

  return errors
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = validateScribblAssets()
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    process.exit(1)
  }

  console.log('Scribbl asset validation passed.')
}
