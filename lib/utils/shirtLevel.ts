export interface ShirtLevelInput {
  uniqueScribblerCount: number
  visibleScribbleCount: number
  adminLevelOverride?: number | null
}

export interface ShirtLevel {
  level: number
  label: string
  color: string
  nextAt: number | null
  progress: number
  isAdminOverride: boolean
}

const LEVELS = [
  { level: 0, label: 'Blank canvas', minUnique: 0, color: '#d8d1c3' },
  { level: 1, label: 'First marks', minUnique: 1, color: '#6f8f55' },
  { level: 2, label: 'Circle warmup', minUnique: 8, color: '#3c7c9d' },
  { level: 3, label: 'Social shirt', minUnique: 18, color: '#7655d8' },
  { level: 4, label: 'Campus favorite', minUnique: 35, color: '#d97706' },
  { level: 5, label: 'Farewell icon', minUnique: 60, color: '#d83f6b' },
] as const

function clampLevel(value: number): number {
  return Math.max(0, Math.min(LEVELS.length - 1, Math.round(value)))
}

export function calculateShirtLevel(input: ShirtLevelInput): ShirtLevel {
  const safeUnique = Math.max(0, Math.floor(input.uniqueScribblerCount))
  const safeVisible = Math.max(0, Math.floor(input.visibleScribbleCount))

  if (typeof input.adminLevelOverride === 'number' && Number.isFinite(input.adminLevelOverride)) {
    const override = clampLevel(input.adminLevelOverride)
    const config = LEVELS[override]
    return {
      level: config.level,
      label: config.label,
      color: config.color,
      nextAt: LEVELS[override + 1]?.minUnique ?? null,
      progress: 100,
      isAdminOverride: true,
    }
  }

  const score = safeUnique
  const levelIndex = LEVELS.reduce((current, candidate, index) => (
    score >= candidate.minUnique ? index : current
  ), 0)
  const current = LEVELS[levelIndex]
  const next = LEVELS[levelIndex + 1]
  const progress = next
    ? Math.min(100, Math.round((score / next.minUnique) * 100))
    : 100

  return {
    level: current.level,
    label: current.label,
    color: current.color,
    nextAt: next?.minUnique ?? null,
    progress: safeVisible === 0 && safeUnique === 0 ? 0 : progress,
    isAdminOverride: false,
  }
}
