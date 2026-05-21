'use client'

// Login — Sunlit Lawn signature page (doc 18 § 3, row "Login").
//
// Composition:
//   Place layer (vivid, no fade)          ─ brand front door
//   Drifting doodles (low density, ≥md)   ─ paper-plane / heart marginalia
//   Whiteboard a-frame (centre-top)       ─ "Scribbl. / class of 2026"
//   Auth card (warmer eyebrow copy)       ─ OTP + Google, ink underlines
//   Asterisk divider above tagline        ─ section break primitive
//
// The Google button keeps its multi-colour Google chrome (decision: it is the
// most recognisable button in the world, restyling it would hurt conversion
// more than it would help theme coherence). Everything else picks up the
// Sunlit Lawn micro-interactions.

import { useState, useId, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAllowedEmailDomains, isAllowedEmailDomain } from '@/lib/utils/safetyAccess'
import PlaceBackground from '@/components/place/PlaceBackground'
import Whiteboard from '@/components/brand/Whiteboard'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import InkUnderline from '@/components/forms/InkUnderline'
import PencilLoader from '@/components/feedback/PencilLoader'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed:   'Sign-in failed. Please try again.',
  missing_code:  'Something went wrong with the sign-in flow. Please try again.',
  missing_email: 'Your provider did not return an email address.',
  profile_create_failed: 'Could not create your account. Please try again.',
}

function LoginContent() {
  const searchParams = useSearchParams()
  const errorKey = searchParams.get('error')
  const errorMsg = errorKey ? ERROR_MESSAGES[errorKey] : null

  const [loading, setLoading] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpMessage, setOtpMessage] = useState<string | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
  const [codeFocused, setCodeFocused] = useState(false)

  const supabase = createClient()
  const showDevTesting = process.env.NODE_ENV !== 'production'
  const allowedDomains = getAllowedEmailDomains()
  const primaryDomain = allowedDomains[0] ?? 'your college domain'

  const emailId = useId()
  const codeId = useId()

  const emailUnderlineActive = emailFocused || otpEmail.length > 0
  const codeUnderlineActive  = codeFocused  || otpCode.length > 0

  const signIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const sendOtp = async () => {
    const email = otpEmail.trim().toLowerCase()
    setOtpMessage(null)
    if (!isAllowedEmailDomain(email, allowedDomains)) {
      setOtpMessage(`Use your ${primaryDomain} email for the first profile verification. Guests can continue with Google.`)
      return
    }

    setOtpLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    setOtpLoading(false)
    if (error) {
      setOtpMessage(error.message)
      return
    }
    setOtpSent(true)
    setOtpMessage('Code sent. Check your university mailbox.')
  }

  const verifyOtp = async () => {
    const email = otpEmail.trim().toLowerCase()
    const token = otpCode.trim()
    setOtpMessage(null)
    if (!email || !token) {
      setOtpMessage('Enter your email and the code from your mailbox.')
      return
    }

    setOtpLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) {
      setOtpLoading(false)
      setOtpMessage(error.message)
      return
    }

    const res = await fetch('/api/auth/sync-user', { method: 'POST' })
    const data = await res.json().catch(() => null)
    setOtpLoading(false)
    if (!res.ok || !data?.next) {
      setOtpMessage(data?.error ?? 'Could not finish sign in.')
      return
    }
    window.location.href = data.next
  }

  return (
    <div className="scribbl-page relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {/* Layer 1 — Place: vivid lawn, the brand's front door. */}
      <PlaceBackground surface="login" illustration="lawn-golden-hour" alwaysVivid />

      {/* Layer 2 — Marginalia: a few low-density drifting doodles framing the
          composition. Hidden on mobile to keep the auth card the singular focus. */}
      <DriftingDoodles density="low" className="hidden md:block" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Brand whiteboard — the dominant identity moment on this page. */}
        <div className="mb-8 w-[200px] sm:w-[220px]">
          <Whiteboard
            variant="a-frame"
            title="Scribbl."
            subtitle="class of 2026"
            markerColor="black"
            rotation="left"
          />
        </div>

        <div className="card w-full p-8">
          <h2 className="text-eyebrow-display text-ink-900">ready to scribble?</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            First profile setup uses your university email OTP. Google can be linked for quick returns or guest access.
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
            >
              {errorMsg}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <label htmlFor={emailId} className="block">
              <span className="label">University email</span>
              <div className="relative">
                <input
                  id={emailId}
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={otpEmail}
                  onChange={e => setOtpEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder={`name@${primaryDomain}`}
                />
                <InkUnderline active={emailUnderlineActive} />
              </div>
            </label>

            {otpSent && (
              <label htmlFor={codeId} className="block">
                <span className="label">One-time code</span>
                <div className="relative">
                  <input
                    id={codeId}
                    className="input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                    placeholder="6 digit code"
                  />
                  <InkUnderline active={codeUnderlineActive} />
                </div>
              </label>
            )}

            {otpMessage && (
              <p
                aria-live="polite"
                className="rounded-xl border border-[color:var(--line-soft)] bg-paper-100 px-3 py-2 text-xs text-ink-500"
              >
                {otpMessage}
              </p>
            )}

            <button
              type="button"
              onClick={otpSent ? verifyOtp : sendOtp}
              disabled={otpLoading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {otpLoading ? (
                <>
                  <PencilLoader label="Sending" />
                  <span>Please wait…</span>
                </>
              ) : (
                <span>{otpSent ? 'Verify and continue' : 'Send university OTP'}</span>
              )}
            </button>
          </div>

          {/* Asterisk divider in place of the "OR" rule — section-break
              primitive (doc 18 § 8) doing the work of a chrome separator. */}
          <AsteriskDivider className="my-6" />

          <button
            type="button"
            onClick={signIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[color:var(--line-soft)] bg-white px-4 py-3 text-sm font-medium text-ink-900 shadow-sm transition hover:bg-paper-50 disabled:opacity-50"
          >
            {loading ? (
              <PencilLoader label="Connecting" />
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-ink-500">
            Non-university Google accounts can view and request access, but cannot create a shirt profile.
          </p>
        </div>

        <AsteriskDivider className="mt-8" />

        <p className="text-nostalgia text-center text-ink-500">
          Built for one farewell. Designed to last forever.
        </p>

        {showDevTesting && (
          <p className="mt-3 text-center text-xs text-ink-500">
            Dev testing:{' '}
            <Link href="/dev/test-users" className="underline underline-offset-2">
              switch local test users
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="scribbl-page min-h-screen" />}>
      <LoginContent />
    </Suspense>
  )
}
