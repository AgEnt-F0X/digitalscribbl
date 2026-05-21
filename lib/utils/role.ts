/**
 * Single source of truth for "what can this user do".
 *
 * Roles are derived from flags at the API/page boundary, never stored.
 * If you find yourself reading is_admin / is_guest / is_university_verified
 * directly anywhere else, that's a bug — call getRole() instead.
 *
 * See docs/08 §13.
 */

export type Role = 'suspended' | 'admin' | 'verified' | 'guest'

export interface RoleFlags {
  is_deleted?:              boolean | null
  is_suspended?:            boolean | null
  is_admin?:                boolean | null
  is_university_verified?:  boolean | null
  is_guest?:                boolean | null
}

/**
 * Returns the user's effective role, or null if the account is deleted
 * (deleted accounts must not get a session — auth callback must refuse).
 *
 * Precedence: deleted > suspended > admin > verified > guest.
 *
 * - Suspended wins over admin so a misbehaving admin is still blocked.
 * - Admin implies verified, never guest (DB constraint enforces this).
 */
export function getRole(flags: RoleFlags | null | undefined): Role | null {
  if (!flags) return null
  if (flags.is_deleted) return null
  if (flags.is_suspended) return 'suspended'
  if (flags.is_admin) return 'admin'
  if (flags.is_university_verified) return 'verified'
  if (flags.is_guest) return 'guest'
  return null
}

/** Convenience predicates so call sites don't have to compare strings. */
export const isAdmin     = (role: Role | null) => role === 'admin'
export const isVerified  = (role: Role | null) => role === 'verified' || role === 'admin'
export const isGuest     = (role: Role | null) => role === 'guest'
export const isBlocked   = (role: Role | null) => role === 'suspended' || role === null

/**
 * Allowed route prefixes per role. Used by proxy.ts and any server action
 * that needs to gate access. Routes not in any list fall back to "verified
 * only" (the safest default).
 *
 * Keep this in sync with docs/08 §"Route IA" and the route table in doc 10.
 */
export const ROUTE_ACCESS = {
  // Anyone, including signed-out
  public: ['/login', '/auth/', '/dev', '/', '/u/', '/i/'],

  // Guests can hit these. Subset of verified routes that don't require
  // ownership / batch context.
  guest: [
    '/guest',
    '/shirts/',
    '/profile/',
    '/u/',
    '/i/',
    '/groups/join/',
    '/onboarding/guest',
    '/activity',
    '/api/',
    '/auth/',
  ],

  // Verified + admin. (Admin gets /admin/* additionally.)
  verified: [
    '/dashboard',
    '/settings',
    '/explore',
    '/groups',
    '/yearbook',
    '/activity',
    '/profile/',
    '/u/',
    '/i/',
    '/shirts/',
    '/onboarding',
    '/api/',
    '/auth/',
  ],

  // Admin-only prefixes (in addition to verified).
  adminOnly: ['/admin'],
} as const

export function isPublicRoute(pathname: string): boolean {
  return ROUTE_ACCESS.public.some(prefix => pathname === prefix || pathname.startsWith(prefix))
}

export function isGuestAllowed(pathname: string): boolean {
  return ROUTE_ACCESS.guest.some(prefix => pathname.startsWith(prefix))
}

export function isAdminRoute(pathname: string): boolean {
  return ROUTE_ACCESS.adminOnly.some(prefix => pathname.startsWith(prefix))
}
