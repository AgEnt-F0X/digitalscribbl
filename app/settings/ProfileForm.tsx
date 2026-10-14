'use client'

import { useState, useTransition } from 'react'
import { BODY_STYLES, SHIRT_COLORS } from '@/lib/constants'
import Avatar from '@/components/avatar/Avatar'
import ShirtAccessPanel from './ShirtAccessPanel'
import type { ShirtVisibility } from '@/lib/identity/signing'

interface Props {
  initial: {
    display_name:     string
    yearbook_quote:   string | null
    thank_you_message: string | null
    body_style:       string
    shirt_color:      string
    shirt_id:         string | null
    shirt_locked:     boolean
    /** The primary shirt's access mode — `open` unless the owner changed it. */
    shirt_visibility: string | null
    circle:           { user_id: string; display_name: string }[]
    blocked:          { blocked_id: string; display_name: string }[]
  }
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
      ${ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {ok ? '✅' : '❌'} {msg}
    </div>
  )
}

export default function ProfileForm({ initial }: Props) {
  const [displayName,     setDisplayName]     = useState(initial.display_name)
  const [yearbookQuote,   setYearbookQuote]   = useState(initial.yearbook_quote ?? '')
  const [thankYouMessage, setThankYouMessage] = useState(initial.thank_you_message ?? '')
  const [bodyStyle,       setBodyStyle]       = useState(initial.body_style)
  const [shirtColor,      setShirtColor]      = useState(initial.shirt_color)
  const [shirtLocked,     setShirtLocked]     = useState(initial.shirt_locked)
  const [toast,           setToast]           = useState<{ msg: string; ok: boolean } | null>(null)
  const [isPending,       startTransition]    = useTransition()

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function save(fields: Record<string, unknown>) {
    const res = await fetch('/api/settings/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const data = await res.json()
    if (!res.ok) showToast(data.error ?? 'Something went wrong', false)
    else showToast('Saved!', true)
  }

  async function toggleShirtLock() {
    if (!initial.shirt_id) return
    const next = !shirtLocked
    const res = await fetch('/api/shirt/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shirt_id: initial.shirt_id, locked: next }),
    })
    if (res.ok) {
      setShirtLocked(next)
      showToast(next ? 'Shirt locked 🔒' : 'Shirt unlocked 🔓', true)
    } else {
      showToast('Failed to update lock', false)
    }
  }

  return (
    <div className="space-y-8">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* ── Profile ─────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink-900 mb-5">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={80}
              className="input w-full"
              placeholder="What should we call you?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yearbook quote <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={yearbookQuote}
              onChange={e => setYearbookQuote(e.target.value)}
              maxLength={300}
              rows={3}
              className="input w-full resize-none"
              placeholder="Something to remember you by…"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{yearbookQuote.length}/300</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thank-you toast <span className="text-gray-400 font-normal">(shown after someone signs)</span>
            </label>
            <textarea
              value={thankYouMessage}
              onChange={e => setThankYouMessage(e.target.value)}
              maxLength={180}
              rows={3}
              className="input w-full resize-none"
              placeholder="Thanks for signing my shirt. This will stay with me."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{thankYouMessage.length}/180</p>
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => save({
              display_name: displayName,
              yearbook_quote: yearbookQuote,
              thank_you_message: thankYouMessage,
            }))}
            className="btn-primary text-sm"
          >
            {isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </section>

      {/* ── Who can sign ─────────────────────────────────────── */}
      {/* Replaces the v1 two-option "Shirt privacy" radio pair. Doc 07: the
          access mode belongs to the SHIRT, not to the profile, so it is edited
          per shirt and the default needs no configuration. */}
      {initial.shirt_id && (
        <ShirtAccessPanel
          shirtId={initial.shirt_id}
          initialVisibility={(initial.shirt_visibility as ShirtVisibility) ?? 'open'}
          circle={initial.circle}
          blocked={initial.blocked}
        />
      )}

      {/* ── Avatar ──────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-base font-semibold text-ink-900 mb-5">Avatar</h2>

        {/* Body style */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Body style</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {BODY_STYLES.map(b => (
              <button
                key={b.id}
                onClick={() => setBodyStyle(b.id)}
                className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                  bodyStyle === b.id ? 'border-ink-900' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Avatar
                  bodyStyle={b.id}
                  size="sm"
                />
                <span className="text-[10px] text-gray-500 mt-1">{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shirt color */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Shirt colour</p>
          <div className="flex gap-3 flex-wrap">
            {SHIRT_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setShirtColor(c.hex)}
                title={c.label}
                className={`w-9 h-9 rounded-full border-4 transition-all ${
                  shirtColor === c.hex ? 'border-ink-900 scale-110' : 'border-gray-200 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <button
          disabled={isPending}
          onClick={() => startTransition(() => save({ body_style: bodyStyle, shirt_color: shirtColor }))}
          className="btn-primary text-sm"
        >
          {isPending ? 'Saving…' : 'Save avatar'}
        </button>
      </section>

      {/* ── Pause signing ───────────────────────────────────── */}
      {/* Doc 16 synthesis disagreement D: replace the 4-mode picker's
          `locked` option with this single toggle so the privacy panel only
          chooses _who_, never _whether_. */}
      {initial.shirt_id && (
        <section className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Pause signing</h2>
              <p className="text-xs text-gray-400 mt-1">
                {shirtLocked
                  ? 'Signing is paused — your shirt is read-only for now. Flip back on whenever.'
                  : 'Signing is on. Flip this off if you want the shirt to go read-only without changing your privacy.'}
              </p>
            </div>
            <button
              onClick={toggleShirtLock}
              aria-label={shirtLocked ? 'Resume signing' : 'Pause signing'}
              aria-pressed={shirtLocked}
              className={`flex-shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                shirtLocked ? 'bg-ink-900' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                shirtLocked ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
