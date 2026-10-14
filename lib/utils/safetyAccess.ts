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
  // Fail closed. An unconfigured allowlist must never read as "allow everyone":
  // v1 returned true when the list was empty, so a deploy that forgot
  // NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS promoted every Google account to a
  // verified student able to own a shirt and a yearbook page. An empty list now
  // means "no domain is allowed", which is a loud misconfiguration rather than a
  // silent one — nobody is verified until the list is set. Guests can still sign
  // open shirts, so the app is degraded, not bricked.
  if (allowedDomains.length === 0) return false
  return allowedDomains.includes(domain)
}

export function getAccountKind(email: string | null | undefined, allowedDomains: string[]): AccountKind {
  return isAllowedEmailDomain(email, allowedDomains) ? 'university' : 'external'
}

export function normalizeReportReason(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 240)
}
