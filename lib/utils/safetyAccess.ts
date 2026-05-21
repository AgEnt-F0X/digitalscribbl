import type { ShirtPermission } from '@/lib/supabase/types'

export type AccountKind = 'university' | 'external'

export function getAllowedEmailDomains(env: NodeJS.ProcessEnv = process.env) {
  return (env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map(domain => domain.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedEmailDomain(email: string | null | undefined, allowedDomains: string[]) {
  const domain = email?.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return allowedDomains.length === 0 || allowedDomains.includes(domain)
}

export function getAccountKind(email: string | null | undefined, allowedDomains: string[]): AccountKind {
  return isAllowedEmailDomain(email, allowedDomains) ? 'university' : 'external'
}

/**
 * Decides whether a viewer should be allowed to attempt placing a scribble.
 *
 * v1 surface area is two modes — `batch_only` and `request_only` — chosen
 * via the settings UI. `open` and `locked` are LEGACY values: anyone with
 * `open` saved from an older flow keeps the open behaviour until they re-
 * save; `locked` is the same outcome as toggling Pause-signing (now the
 * actual UI for that intent). Doc 16 synthesis disagreement D.
 */
export function canAttemptScribble({
  isOwner,
  permission,
  sameBatch,
  approvedRequest,
}: {
  isOwner: boolean
  permission: ShirtPermission | string
  sameBatch: boolean
  approvedRequest: boolean
}) {
  if (isOwner) return false
  if (permission === 'locked') return false
  if (approvedRequest) return true
  if (permission === 'open') return true
  if (permission === 'batch_only') return sameBatch
  return false
}

export function normalizeReportReason(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 240)
}
