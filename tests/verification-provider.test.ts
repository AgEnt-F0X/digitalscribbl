import { describe, expect, it } from 'vitest'
import {
  describeVerificationSender,
  resolveVerificationMode,
  VerificationBlockedError,
} from '@/lib/identity/verification'

describe('resolveVerificationMode', () => {
  it('is blocked when no sender is configured', () => {
    expect(resolveVerificationMode({ providerConfigured: false })).toEqual({
      status: 'blocked',
      reason: 'no_provider',
    })
  })

  it('is blocked when a sender exists but the smtp sender address is missing', () => {
    expect(
      resolveVerificationMode({ providerConfigured: true, senderAddress: undefined }),
    ).toEqual({ status: 'blocked', reason: 'no_sender_address' })
  })

  it('is blocked when the smtp sender address is blank', () => {
    expect(
      resolveVerificationMode({ providerConfigured: true, senderAddress: '   ' }),
    ).toEqual({ status: 'blocked', reason: 'no_sender_address' })
  })

  it('is ready when a provider and sender address are both present', () => {
    expect(
      resolveVerificationMode({
        providerConfigured: true,
        senderAddress: 'Scribbl <no-reply@bennett.edu.in>',
      }),
    ).toEqual({ status: 'ready', reason: null })
  })
})

describe('describeVerificationSender', () => {
  it('never exposes the smtp sender address to the client', () => {
    const described = describeVerificationSender({
      providerConfigured: true,
      senderAddress: 'Scribbl <no-reply@bennett.edu.in>',
    })
    expect(JSON.stringify(described)).not.toContain('no-reply@bennett.edu.in')
  })

  it('gives the same public message whether ready or blocked', () => {
    const ready = describeVerificationSender({
      providerConfigured: true,
      senderAddress: 'Scribbl <no-reply@bennett.edu.in>',
    })
    const blocked = describeVerificationSender({ providerConfigured: false })
    expect(ready.message).toBe(blocked.message)
  })
})

describe('VerificationBlockedError', () => {
  it('carries a machine-readable reason', () => {
    const error = new VerificationBlockedError('no_provider')
    expect(error.reason).toBe('no_provider')
    expect(error).toBeInstanceOf(Error)
  })
})
