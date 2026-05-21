/**
 * Curated skin-tone control — two-dimensional (Round 3 upgrade per
 * `docs/13-pm-review.md` #4): a `depth` slider (0–100) for lightness, and
 * an `undertone` slider (-50 cool ↔ +50 warm) for warmth bias.
 *
 * Why two axes: real skin reads as more than lightness. A monochrome
 * lightness ramp matches the average of every depth band but lands wrong
 * for the ~40% of users whose skin is markedly warm or cool. The second
 * axis is a small, bounded nudge that keeps the curated range safe (no
 * raw colour picker = no moderation problem) but lets people land closer
 * to a tone they recognise as theirs.
 *
 * Back-compat:
 *  - Legacy 5-swatch ids continue to resolve to a `depth` (undertone = 0)
 *  - Old single-slider rows (`{value: number}`) resolve to that depth with
 *    a neutral undertone
 *  - Any raw `{hex}` value is preserved verbatim with a best-effort depth
 *    inferred from the closest anchor (undertone = 0)
 */

const ANCHORS: { stop: number; hex: string }[] = [
  { stop: 0,   hex: '#F6D7BF' }, // light warm
  { stop: 20,  hex: '#E8BD92' }, // fair/wheat
  { stop: 40,  hex: '#C98F63' }, // medium tan
  { stop: 60,  hex: '#9F6747' }, // medium brown
  { stop: 80,  hex: '#72442F' }, // deep brown
  { stop: 100, hex: '#4A2A1F' }, // very deep brown
]

const LEGACY_SWATCH_TO_DEPTH: Record<string, number> = {
  skin_01_light_warm:    0,
  skin_02_wheat:         20,
  skin_05_cool_tan:      40,
  skin_03_medium_brown:  55,
  skin_04_deep_brown:    78,
}

/**
 * Max RGB unit shift applied at undertone = ±50. Picked so the strongest
 * warm/cool feel stays inside the curated band — no greens, no purples.
 * `R` and `B` shift in opposite directions; `G` is left alone.
 */
const UNDERTONE_MAX_SHIFT = 18

export interface SkinTone {
  /** 0–100 depth value. Higher = darker. */
  depth: number
  /** -50 (cool) … +50 (warm). 0 = neutral curated anchor. */
  undertone: number
  /** Resolved hex after depth + undertone are baked in. */
  hex: string
}

export const DEFAULT_SKIN_DEPTH     = 30
export const DEFAULT_SKIN_UNDERTONE = 0

/** Legacy alias used by older callers; equal to `DEFAULT_SKIN_DEPTH`. */
export const DEFAULT_SKIN_VALUE = DEFAULT_SKIN_DEPTH

/** Hex anchors for visual representation in a slider track gradient. */
export const SKIN_TONE_ANCHORS = ANCHORS

/**
 * Resolve depth + undertone to a concrete SkinTone.
 */
export function skinToneFrom(depth: number, undertone: number = 0): SkinTone {
  const d = clamp(Math.round(depth), 0, 100)
  const u = clamp(Math.round(undertone), -50, 50)
  const baseHex = depthHex(d)
  const hex = applyUndertone(baseHex, u)
  return { depth: d, undertone: u, hex }
}

/**
 * Single-axis legacy entry point. Kept so existing callers (`skinToneFromValue`)
 * keep working unchanged.
 */
export function skinToneFromValue(input: number): SkinTone {
  return skinToneFrom(input, 0)
}

/**
 * Resolve any input shape — number, legacy id, hex, partial object — to a
 * SkinTone. Used at every boundary that might receive old data.
 */
export function resolveSkinTone(input: unknown): SkinTone {
  if (typeof input === 'number') return skinToneFrom(input, 0)

  if (input && typeof input === 'object') {
    const obj = input as {
      depth?: unknown
      undertone?: unknown
      value?: unknown
      mode?: unknown
      id?: unknown
      hex?: unknown
    }
    if (typeof obj.depth === 'number') {
      const u = typeof obj.undertone === 'number' ? obj.undertone : 0
      return skinToneFrom(obj.depth, u)
    }
    if (typeof obj.value === 'number') {
      const u = typeof obj.undertone === 'number' ? obj.undertone : 0
      return skinToneFrom(obj.value, u)
    }
    if (typeof obj.id === 'string' && LEGACY_SWATCH_TO_DEPTH[obj.id] != null) {
      return skinToneFrom(LEGACY_SWATCH_TO_DEPTH[obj.id], 0)
    }
    if (typeof obj.hex === 'string') {
      return { depth: nearestAnchorStop(obj.hex), undertone: 0, hex: obj.hex }
    }
  }

  if (typeof input === 'string') {
    if (LEGACY_SWATCH_TO_DEPTH[input] != null) {
      return skinToneFrom(LEGACY_SWATCH_TO_DEPTH[input], 0)
    }
    if (/^#[0-9a-f]{6}$/i.test(input)) {
      return { depth: nearestAnchorStop(input), undertone: 0, hex: input }
    }
  }

  return skinToneFrom(DEFAULT_SKIN_DEPTH, DEFAULT_SKIN_UNDERTONE)
}

// ── Internals ─────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function depthHex(value: number): string {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i]
    const b = ANCHORS[i + 1]
    if (value >= a.stop && value <= b.stop) {
      const t = (value - a.stop) / (b.stop - a.stop)
      return mixHex(a.hex, b.hex, t)
    }
  }
  return ANCHORS[ANCHORS.length - 1].hex
}

function applyUndertone(baseHex: string, undertone: number): string {
  if (undertone === 0) return baseHex
  const r = parseInt(baseHex.slice(1, 3), 16)
  const g = parseInt(baseHex.slice(3, 5), 16)
  const b = parseInt(baseHex.slice(5, 7), 16)
  // -50..50 → -1..1 scalar
  const k = undertone / 50
  const shift = Math.round(k * UNDERTONE_MAX_SHIFT)
  const nr = clamp(r + shift, 0, 255)
  const ng = g
  const nb = clamp(b - shift, 0, 255)
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}

function mixHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const blue = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
}

function nearestAnchorStop(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return DEFAULT_SKIN_DEPTH
  let best = ANCHORS[0]
  let bestD = Number.POSITIVE_INFINITY
  for (const a of ANCHORS) {
    const d = colourDistance(a.hex, hex)
    if (d < bestD) {
      bestD = d
      best = a
    }
  }
  return best.stop
}

function colourDistance(a: string, b: string): number {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const dr = ar - br
  const dg = ag - bg
  const db = ab - bb
  return dr * dr + dg * dg + db * db
}
