'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Flag, PenLine, Trash2, Wifi, WifiOff } from 'lucide-react'
import ShirtShell from '@/components/shirt/ShirtShell'
import { useShirtChannel } from '@/lib/hooks/useShirtChannel'
import { createActionCooldown } from '@/lib/utils/actionCooldown'
import { showToast } from '@/lib/hooks/useToast'
import { SHIRT_H, SHIRT_W } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import type { Panel, ScribbleRow, ShirtRow } from '@/lib/supabase/types'

interface ShirtViewProps {
  shirt:             ShirtRow
  ownerId:           string
  ownerName:         string
  panel:             Panel
  existingScribbles: Pick<ScribbleRow, 'id' | 'x' | 'y' | 'w' | 'h' | 'canvas_svg'>[]
  currentUserId:     string | null
  currentUserName:   string | null
  canScribble:       boolean
  isOwner:           boolean
  bodyStyle?:         string
  shirtColor?:        string
  headFrontUrl?:      string | null
  headBackUrl?:       string | null
  yearbookQuote?:     string | null
  textureUrl?:        string
  /** Server-fetched free-tier degrade flags. See docs/09. */
  disablePresence?:  boolean
  disableBroadcast?: boolean
  onScribblePlaced?:  () => void
}

/**
 * View-only shirt canvas for the profile page: renders saved scribbles,
 * lets the owner remove (and others report) individual scribbles, and shows
 * live presence. All *signing* happens in the Scribble Studio at
 * `/shirts/[shirtId]/scribble` — this component only links there. The old
 * inline drawing studio that used to live here was removed when the studio
 * became the single signing surface (docs/23 FL1).
 */
export default function ShirtView({
  shirt,
  ownerId,
  ownerName,
  panel,
  existingScribbles,
  currentUserId,
  currentUserName,
  canScribble,
  isOwner,
  shirtColor = '#F8F8F8',
  headFrontUrl,
  headBackUrl,
  yearbookQuote,
  disablePresence = false,
  disableBroadcast = false,
}: ShirtViewProps) {
  const router = useRouter()
  const actionCooldownRef = useRef(createActionCooldown({ cooldownMs: 900 }))

  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { viewerCount, isConnected, broadcastTextureUpdated } = useShirtChannel({
    ownerId,
    shirtNumber: shirt.shirt_number,
    currentPanel: panel,
    currentUserId,
    currentUserName,
    disablePresence,
    disableBroadcast,
  })

  const displayedScribbles = existingScribbles.filter(s => !removedIds.has(s.id))
  const headUrl = panel === 'back' ? (headBackUrl ?? headFrontUrl) : headFrontUrl
  // The studio signs front/back; map the sleeves tab to the front side.
  const studioHref = `/shirts/${shirt.id}/scribble${panel === 'back' ? '?side=back' : ''}`

  const panelOccupancy: Record<Panel, number> = {
    front: Number(shirt.front_occupancy ?? 0),
    back: Number(shirt.back_occupancy ?? 0),
    sleeves: Number(shirt.sleeves_occupancy ?? 0),
  }

  const panelTitle: Record<Panel, string> = {
    front: 'Front shirt',
    back: 'Back shirt',
    sleeves: 'Sleeve canvas',
  }

  const panelNote: Record<Panel, string> = {
    front: 'Sign where the shirt would actually be signed.',
    back: 'Best for bigger farewell notes and inside jokes.',
    sleeves: 'Small marks, initials, icons, and quick emojis.',
  }

  const handleRemoveScribble = useCallback(async (scribbleId: string) => {
    setRemovedIds(prev => new Set([...prev, scribbleId]))
    setRemoveError(null)

    const res = await fetch('/api/scribble/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scribble_id: scribbleId }),
    })

    if (res.ok) {
      broadcastTextureUpdated(panel)
      showToast({ tone: 'success', title: 'Scribble removed' })
      router.refresh()
    } else {
      setRemovedIds(prev => { const next = new Set(prev); next.delete(scribbleId); return next })
      setRemoveError('Could not remove scribble. Try again.')
      showToast({ tone: 'error', title: 'Could not remove scribble' })
    }
  }, [broadcastTextureUpdated, panel, router])

  const handleReportScribble = useCallback(async (scribbleId: string) => {
    if (reportedIds.has(scribbleId)) return
    if (!actionCooldownRef.current.canRun(`report:${scribbleId}`)) return
    setReportedIds(prev => new Set([...prev, scribbleId]))
    const res = await fetch('/api/scribble/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scribble_id: scribbleId }),
    })
    showToast({
      tone: res.ok || res.status === 409 ? 'success' : 'error',
      title: res.ok || res.status === 409 ? 'Report received' : 'Could not report scribble',
    })
  }, [reportedIds])

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-black/10 bg-[#f8f5ee] shadow-[0_24px_70px_rgba(45,35,22,0.08)]">
        <div className="flex flex-col gap-3 border-b border-black/10 bg-white/55 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-ink-900">{panelTitle[panel]}</h2>
              <span className="rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                {Math.round(panelOccupancy[panel])}% filled
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{panelNote[panel]}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-2.5 py-1">
              {isConnected ? <Wifi size={13} className="text-green-500" /> : <WifiOff size={13} className="text-gray-400" />}
              {viewerCount > 0 ? `${viewerCount} live` : 'solo'}
            </span>
            {!isOwner && canScribble && (
              <Link
                href={studioHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ink-700"
              >
                <PenLine size={13} />
                Sign now
              </Link>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <ShirtShell
            shirtColor={shirtColor}
            headUrl={headUrl}
            panel={panel}
            showHead
            className="max-w-[640px]"
          >
            <div className="absolute inset-0">
              {displayedScribbles.length === 0 && (
                <div className="absolute inset-4 flex items-center justify-center rounded-2xl border border-dashed border-black/15 text-center text-black/40">
                  <p className="max-w-[190px] text-xs font-medium">
                    Nobody has signed this surface yet. Be the first mark on the fabric.
                  </p>
                </div>
              )}

              {displayedScribbles.filter(s => s.canvas_svg).map(s => (
                <div
                  key={s.id}
                  aria-hidden
                  className="absolute bg-contain bg-center bg-no-repeat"
                  style={{
                    left: `${(s.x / SHIRT_W) * 100}%`,
                    top: `${(s.y / SHIRT_H) * 100}%`,
                    width: `${(s.w / SHIRT_W) * 100}%`,
                    height: `${(s.h / SHIRT_H) * 100}%`,
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.canvas_svg!)}")`,
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {(isOwner || canScribble) && displayedScribbles.map(s => {
                const isHovered = hoveredId === s.id
                const isReported = reportedIds.has(s.id)

                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={isOwner ? 'Remove scribble' : 'Report scribble'}
                    className={cn('absolute rounded-sm border transition', isHovered ? 'border-black/25 bg-black/5' : 'border-transparent bg-transparent')}
                    style={{
                      left: `${(s.x / SHIRT_W) * 100}%`,
                      top: `${(s.y / SHIRT_H) * 100}%`,
                      width: `${(s.w / SHIRT_W) * 100}%`,
                      height: `${(s.h / SHIRT_H) * 100}%`,
                    }}
                    onPointerEnter={() => setHoveredId(s.id)}
                    onPointerLeave={() => setHoveredId(null)}
                    onClick={() => {
                      if (isOwner) handleRemoveScribble(s.id)
                      else handleReportScribble(s.id)
                    }}
                  >
                    <span className={cn(
                      'absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm transition',
                      isOwner ? 'bg-red-600' : isReported ? 'bg-green-600' : 'bg-amber-500',
                      isHovered ? 'opacity-100' : 'opacity-75'
                    )}>
                      {isOwner ? <Trash2 size={13} /> : isReported ? <Check size={13} /> : <Flag size={13} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </ShirtShell>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/10 bg-white/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-h-[20px] text-sm">
            {removeError && <p className="text-red-600">{removeError}</p>}
            {!removeError && (
              <p className="text-xs text-gray-500">
                {isOwner
                  ? 'Tap a saved scribble to remove it from your shirt.'
                  : canScribble
                    ? `Open the studio and sign directly on ${ownerName}'s shirt.`
                    : `${ownerName}'s shirt is view-only for your account right now.`}
              </p>
            )}
          </div>

          {!isOwner && canScribble && (
            <Link
              href={studioHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-ink-700"
            >
              <PenLine size={16} />
              Scribble on this shirt
            </Link>
          )}
        </div>
      </section>

      {yearbookQuote && (
        <p className="text-center text-xs italic text-gray-500">&ldquo;{yearbookQuote}&rdquo;</p>
      )}
    </div>
  )
}
