/**
 * Verification-mode boundary for enrollment-based onboarding.
 *
 * Ownership of an enrollment mailbox is proven with a one-time code sent by
 * the institution's mail provider. That provider is not provisioned yet, so
 * this module refuses to pretend it works:
 *
 *  - With no provider configured, sending is *blocked*, not simulated. A stub
 *    that "succeeds" without sending a mail would let anyone claim any
 *    enrollment number, which is the exact failure this project is guarding.
 *  - The blocked reason is machine-readable for ops, but the user-facing copy
 *    is identical whether ready or blocked, so the response reveals nothing
 *    about server configuration and doubles as the generic "we can't confirm
 *    this yet" message.
 */

/** Why sending is unavailable. Safe to log; never shown verbatim to students. */
export type VerificationBlockReason = 'no_provider' | 'no_sender_address'

export type VerificationMode =
  | { status: 'ready'; reason: null }
  | { status: 'blocked'; reason: VerificationBlockReason }

export interface VerificationConfig {
  /** True when a mail provider is configured (provider credentials present). */
  providerConfigured: boolean
  /** The address outgoing mail is sent from, if the provider has one. */
  senderAddress?: string | undefined
}

/** Raised by senders when verification cannot be attempted. */
export class VerificationBlockedError extends Error {
  readonly reason: VerificationBlockReason
  constructor(reason: VerificationBlockReason) {
    super(`verification blocked: ${reason}`)
    this.name = 'VerificationBlockedError'
    this.reason = reason
  }
}

export function resolveVerificationMode(config: VerificationConfig): VerificationMode {
  if (!config.providerConfigured) return { status: 'blocked', reason: 'no_provider' }
  if (!config.senderAddress || !config.senderAddress.trim()) {
    return { status: 'blocked', reason: 'no_sender_address' }
  }
  return { status: 'ready', reason: null }
}

/**
 * Public, non-revealing description of the verification channel.
 *
 * `message` is intentionally constant: clients use it for the "we emailed a
 * code" copy and for the "unavailable right now" copy, so it must not change
 * based on configuration.
 */
export function describeVerificationSender(config: VerificationConfig): {
  available: boolean
  message: string
} {
  const mode = resolveVerificationMode(config)
  return {
    available: mode.status === 'ready',
    message: 'If that enrollment number is on the convocation list, we send a one-time code to its university mailbox.',
  }
}
