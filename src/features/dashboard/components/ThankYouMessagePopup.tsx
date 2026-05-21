'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ThankYouMessagePopupProps {
  /** Current message from DB. If matches the default, popup is eligible to show. */
  currentMessage: string | null
  /** True if onboarding finished — used as a hint that this is the user's first dashboard view. */
  onboardingCompleted: boolean
}

const DEFAULT_MESSAGE = 'Thanks for signing my shirt ❤️'
const STORAGE_KEY = 'scribbl:thank-you-popup-dismissed'
const MAX_LEN = 180

/**
 * Once-only popup that appears the first time the user lands on the
 * dashboard after onboarding, asking them to write the thank-you message
 * that will be shown to anyone who signs their shirt. See docs/08 §10
 * (Round 2.1).
 *
 * Show conditions (ALL must be true):
 *   - onboardingCompleted = true (otherwise the user shouldn't be on dashboard yet)
 *   - current message equals the seeded default OR is empty
 *   - localStorage flag is not set
 *
 * On save OR dismiss, the localStorage flag is set so we never nag again.
 * The message can always be edited in /settings.
 */
export default function ThankYouMessagePopup({ currentMessage, onboardingCompleted }: ThankYouMessagePopupProps) {
  const isDefault = !currentMessage || currentMessage.trim() === DEFAULT_MESSAGE
  const [visible, setVisible] = useState(false)
  const [draft, setDraft] = useState(currentMessage ?? DEFAULT_MESSAGE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!onboardingCompleted) return
    if (!isDefault) return
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(STORAGE_KEY)) return
    setVisible(true)
  }, [isDefault, onboardingCompleted])

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setVisible(false)
  }

  async function save() {
    const trimmed = draft.trim()
    if (trimmed.length === 0) {
      setError('Write something or skip.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thank_you_message: trimmed }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.error === 'string' ? body.error : 'Could not save — try again.')
        return
      }
      dismiss()
    } catch {
      setError('Network hiccup — try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="thank-you-popup-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-black/10 bg-[#fffdf7] p-6 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skip for now"
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-500 hover:bg-black/5 hover:text-gray-700"
        >
          <X size={16} />
        </button>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f8b48]">
          One last thing
        </p>
        <h2 id="thank-you-popup-title" className="mt-1 font-display text-2xl font-bold text-ink-900">
          Write your thank-you note
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          This is the message friends see right after they sign your shirt. It&apos;s the small
          warm moment they&apos;ll remember. You can edit it later in Settings.
        </p>

        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, MAX_LEN))}
          rows={4}
          className="mt-4 w-full resize-none rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-ink-900"
          placeholder="Thank you for signing my shirt. This is going to stay with me forever."
          aria-label="Thank-you message"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>{error ?? 'Visible only to people who sign your shirt.'}</span>
          <span>{draft.length}/{MAX_LEN}</span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-black/5"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-2xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-700 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save message'}
          </button>
        </div>
      </div>
    </div>
  )
}
