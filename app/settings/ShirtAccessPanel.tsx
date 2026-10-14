'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Users, ShieldCheck, Ban, Check, X } from 'lucide-react'
import type { ShirtVisibility } from '@/lib/identity/signing'

interface Props {
  shirtId: string
  /** Current mode, read server-side from `shirts.visibility`. */
  initialVisibility: ShirtVisibility
  circle: { user_id: string; display_name: string }[]
  blocked: { blocked_id: string; display_name: string }[]
}

const MODES: {
  value: ShirtVisibility
  label: string
  desc: string
}[] = [
  {
    value: 'open',
    label: 'Anyone',
    desc: 'Anyone with your link signs right away. This is how scribble day actually works.',
  },
  {
    value: 'circle',
    label: 'Just my circle',
    desc: 'Only people you add below can sign. Nobody else can even open the shirt.',
  },
  {
    value: 'approval',
    label: 'Anyone, I approve each one',
    desc: 'Anyone can draw, but only you see it until you post it. Nothing appears without your okay.',
  },
]

/**
 * The shirt's access panel — the single place a student controls who signs.
 *
 * Doc 07's whole thesis in one component: **one door, not four.** No permission
 * matrix on the profile, no batch to pick, no group to create. One dropdown
 * that defaults to open, plus an unconditional block list.
 *
 * `block` deliberately sits outside the mode: switching from `approval` back to
 * `open` must never re-admit someone the owner blocked, so it is its own switch
 * rather than a property of any mode.
 */
export default function ShirtAccessPanel({ shirtId, initialVisibility, circle, blocked }: Props) {
  const router = useRouter()
  const [visibility, setVisibility] = useState<ShirtVisibility>(initialVisibility)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Optimistic local mirrors so the lists respond before the refetch lands.
  const [circleList, setCircleList] = useState(circle)
  const [blockList, setBlockList] = useState(blocked)
  const [newMember, setNewMember] = useState('')
  const [newBlocked, setNewBlocked] = useState('')

  async function patch(body: Record<string, unknown>) {
    setError(null)
    try {
      const res = await fetch('/api/shirt/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shirt_id: shirtId, ...body }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Could not save that')
        return false
      }
      startTransition(() => router.refresh())
      return true
    } catch {
      setError('Could not save that')
      return false
    }
  }


  return (
    <section className="card p-6">
      <h2 className="text-base font-semibold text-ink-900">Who can sign this shirt</h2>
      <p className="mb-5 text-xs text-gray-400">
        Nothing here is required. Leave it on Anyone and people can scribble the moment they open your link.
      </p>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {MODES.map((mode, index) => {
          const Icon = [Globe, Users, ShieldCheck][index]
          const selected = visibility === mode.value
          return (
            <button
              key={mode.value}
              type="button"
              disabled={pending}
              aria-pressed={selected}
              onClick={async () => {
                setVisibility(mode.value)
                await patch({ visibility: mode.value })
              }}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all disabled:opacity-60 ${
                selected
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon size={18} className={selected ? 'text-white' : 'text-ink-700'} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${selected ? 'text-white' : 'text-ink-900'}`}>
                  {mode.label}
                </span>
                <span className={`mt-0.5 block text-xs ${selected ? 'text-white/75' : 'text-gray-500'}`}>
                  {mode.desc}
                </span>
              </span>
              {selected && <Check size={16} className="mt-0.5 shrink-0 text-white" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      {/* ── Circle ─────────────────────────────────────────────── */}
      {visibility === 'circle' && (
        <div className="mt-6 border-t border-[color:var(--line-soft)] pt-5">
          <h3 className="text-sm font-semibold text-ink-900">Your circle</h3>
          <p className="mb-3 text-xs text-gray-400">
            These are the only people who can sign. Add as many as you like.
          </p>

          {circleList.length === 0 ? (
            <p className="mb-3 rounded-xl border border-dashed border-[color:var(--line-soft)] p-3 text-xs text-ink-500">
              Nobody yet — this shirt stays closed until you add someone.
            </p>
          ) : (
            <ul className="mb-3 space-y-1.5">
              {circleList.map(member => (
                <li key={member.user_id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-ink-900">{member.display_name}</span>
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={`Remove ${member.display_name}`}
                    onClick={async () => {
                      setCircleList(prev => prev.filter(m => m.user_id !== member.user_id))
                      await patch({ remove_circle_user_id: member.user_id })
                    }}
                    className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-paper-100 hover:text-ink-900 disabled:opacity-50"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="flex gap-2"
            onSubmit={async e => {
              e.preventDefault()
              const id = newMember.trim()
              if (!id) return
              setNewMember('')
              setCircleList(prev => [...prev, { user_id: id, display_name: `${id.slice(0, 8)}…` }])
              await patch({ add_circle_user_id: id })
            }}
          >
            <input
              value={newMember}
              onChange={e => setNewMember(e.target.value)}
              placeholder="Person's id"
              aria-label="Add someone to your circle"
              className="input flex-1 text-sm"
            />
            <button type="submit" disabled={pending || !newMember.trim()} className="btn-primary text-sm">
              Add
            </button>
          </form>
        </div>
      )}

      {/* ── Blocks ─────────────────────────────────────────────── */}
      <div className="mt-6 border-t border-[color:var(--line-soft)] pt-5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
          <Ban size={14} aria-hidden="true" />
          Blocked people
        </h3>
        <p className="mb-3 text-xs text-gray-400">
          A block beats every mode above and stays even if you switch modes. Nobody is told they were blocked.
        </p>

        {blockList.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {blockList.map(person => (
              <li key={person.blocked_id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-ink-900">{person.display_name}</span>
                <button
                  type="button"
                  disabled={pending}
                  aria-label={`Unblock ${person.display_name}`}
                  onClick={async () => {
                    setBlockList(prev => prev.filter(x => x.blocked_id !== person.blocked_id))
                    await patch({ unblock_user_id: person.blocked_id })
                  }}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-ink-600 transition hover:bg-paper-100 disabled:opacity-50"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex gap-2"
          onSubmit={async e => {
            e.preventDefault()
            const id = newBlocked.trim()
            if (!id) return
            setNewBlocked('')
            setBlockList(prev => [...prev, { blocked_id: id, display_name: `${id.slice(0, 8)}…` }])
            await patch({ block_user_id: id })
          }}
        >
          <input
            value={newBlocked}
            onChange={e => setNewBlocked(e.target.value)}
            placeholder="Person's id"
            aria-label="Block someone from this shirt"
            className="input flex-1 text-sm"
          />
          <button type="submit" disabled={pending || !newBlocked.trim()} className="btn-primary text-sm">
            Block
          </button>
        </form>
      </div>
    </section>
  )
}
