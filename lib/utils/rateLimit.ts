export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

interface FixedWindowOptions {
  limit: number
  windowMs: number
  now?: () => number
}

interface WindowState {
  count: number
  resetAt: number
}

export function createFixedWindowRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: FixedWindowOptions) {
  const buckets = new Map<string, WindowState>()

  return {
    check(key: string): RateLimitResult {
      const current = now()
      const existing = buckets.get(key)

      if (!existing || existing.resetAt <= current) {
        buckets.set(key, { count: 1, resetAt: current + windowMs })
        return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterMs: 0 }
      }

      if (existing.count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, existing.resetAt - current),
        }
      }

      existing.count += 1
      return { allowed: true, remaining: Math.max(0, limit - existing.count), retryAfterMs: 0 }
    },
  }
}

export function rateLimitResponseHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    ...(result.retryAfterMs > 0 ? { 'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)) } : {}),
  }
}
