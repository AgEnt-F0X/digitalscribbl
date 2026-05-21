interface ActionCooldownOptions {
  cooldownMs: number
  now?: () => number
}

export function createActionCooldown({
  cooldownMs,
  now = Date.now,
}: ActionCooldownOptions) {
  const lastRun = new Map<string, number>()

  return {
    canRun(action: string) {
      const current = now()
      const previous = lastRun.get(action)
      if (previous !== undefined && current - previous < cooldownMs) return false
      lastRun.set(action, current)
      return true
    },
    reset(action: string) {
      lastRun.delete(action)
    },
  }
}
