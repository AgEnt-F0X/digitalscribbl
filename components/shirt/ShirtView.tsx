'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Flag, MapPin, Minus, PenLine, Plus, RotateCcw, Save, Trash2, Users, Wifi, WifiOff, X } from 'lucide-react'
import DrawingCanvas, { type DrawingCanvasRef, type DrawingTool } from '@/components/scribble/DrawingCanvas'
import ScribbleToolbar from '@/components/scribble/ScribbleToolbar'
import ShirtShell from '@/components/shirt/ShirtShell'
import { useShirtChannel } from '@/lib/hooks/useShirtChannel'
import { clampScribbleBoxToCanvas, hasDrawableFabricJson, type ScribbleBox } from '@/lib/utils/scribbleContract'
import {
  getShirtTemplate,
  isBoxInsideDrawableRegion,
  SHIRT_COORDINATE_SPACE,
  SHIRT_TEMPLATE_ID,
} from '@/lib/utils/shirtTemplate'
import { createActionCooldown } from '@/lib/utils/actionCooldown'
import { showToast } from '@/lib/hooks/useToast'
import { CANVAS_COLORS, SHIRT_H, SHIRT_W, TOOL_PEN, TOOL_TEXT } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import type { Panel, ScribbleRow, ShirtRow } from '@/lib/supabase/types'

type ScribbleMode = 'browse' | 'drawing'
type SigningMode = 'direct' | 'compose'
type SuggestedSpotKind = 'best' | 'big' | 'edge'

interface SuggestedSpot {
  x: number
  y: number
  w: number
  h: number
  label: string
}

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

const ZOOM_LEVELS = [1, 1.35, 1.75, 2.25, 3]
const QUICK_EMOJI = '🫶'
const COMPOSE_BOX_SIZE = { w: 180, h: 130 }

function defaultComposeBox(): ScribbleBox {
  return {
    x: Math.round((SHIRT_W - COMPOSE_BOX_SIZE.w) / 2),
    y: 250,
    ...COMPOSE_BOX_SIZE,
  }
}

function overlapArea(a: SuggestedSpot, b: Pick<ScribbleRow, 'x' | 'y' | 'w' | 'h'>) {
  const left = Math.max(a.x, b.x)
  const right = Math.min(a.x + a.w, b.x + b.w)
  const top = Math.max(a.y, b.y)
  const bottom = Math.min(a.y + a.h, b.y + b.h)

  return Math.max(0, right - left) * Math.max(0, bottom - top)
}

function findSuggestedSpot(
  kind: SuggestedSpotKind,
  panel: Panel,
  scribbles: Pick<ScribbleRow, 'x' | 'y' | 'w' | 'h'>[],
): SuggestedSpot {
  const size = kind === 'big'
    ? { w: 180, h: 130 }
    : kind === 'edge'
      ? { w: 92, h: 82 }
      : { w: 126, h: 92 }

  const candidates: SuggestedSpot[] = []

  if (kind === 'edge') {
    const y = panel === 'sleeves' ? 170 : 150
    candidates.push(
      { x: 22, y, w: size.w, h: size.h, label: 'left edge' },
      { x: SHIRT_W - size.w - 22, y, w: size.w, h: size.h, label: 'right edge' },
      { x: 34, y: y + 74, w: size.w, h: size.h, label: 'lower left edge' },
      { x: SHIRT_W - size.w - 34, y: y + 74, w: size.w, h: size.h, label: 'lower right edge' },
    )
  } else {
    const yMin = panel === 'front' ? 122 : 96
    const yMax = SHIRT_H - size.h - 54
    const step = kind === 'big' ? 44 : 34

    for (let y = yMin; y <= yMax; y += step) {
      for (let x = 42; x <= SHIRT_W - size.w - 42; x += step) {
        candidates.push({ x, y, w: size.w, h: size.h, label: kind === 'big' ? 'wide note spot' : 'open spot' })
      }
    }
  }

  return candidates
    .map(candidate => {
      const overlap = scribbles.reduce((total, scribble) => total + overlapArea(candidate, scribble), 0)
      const centerX = candidate.x + candidate.w / 2
      const centerY = candidate.y + candidate.h / 2
      const centrality = Math.abs(centerX - SHIRT_W / 2) * 0.4 + Math.abs(centerY - SHIRT_H * 0.43) * 0.2
      return { candidate, score: overlap * 12 + centrality }
    })
    .sort((a, b) => a.score - b.score)[0]?.candidate ?? {
      x: 80,
      y: 160,
      w: size.w,
      h: size.h,
      label: 'open spot',
    }
}

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
  bodyStyle = 'M1',
  shirtColor = '#F8F8F8',
  headFrontUrl,
  headBackUrl,
  yearbookQuote,
  onScribblePlaced,
  disablePresence = false,
  disableBroadcast = false,
}: ShirtViewProps) {
  const router = useRouter()
  const drawingRef = useRef<DrawingCanvasRef>(null)
  const studioScrollRef = useRef<HTMLDivElement>(null)
  const actionCooldownRef = useRef(createActionCooldown({ cooldownMs: 900 }))

  const [mode, setMode] = useState<ScribbleMode>('browse')
  const [signingMode, setSigningMode] = useState<SigningMode>('direct')
  const [tool, setTool] = useState<DrawingTool>(TOOL_PEN)
  const [color, setColor] = useState<string>(CANVAS_COLORS[0])
  const [brushSize, setBrushSize] = useState(4)
  const [opacity, setOpacity] = useState(1)
  const [fillShapes, setFillShapes] = useState(false)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [fontStyle, setFontStyle] = useState<'normal' | 'bold' | 'italic'>('normal')
  const [zoomIndex, setZoomIndex] = useState(0)
  const [showAvatarInStudio, setShowAvatarInStudio] = useState(true)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusSpot, setFocusSpot] = useState<SuggestedSpot | null>(null)
  const [draftJson, setDraftJson] = useState<object | null>(null)
  const [composeBox, setComposeBox] = useState<ScribbleBox>(() => defaultComposeBox())

  const {
    viewerCount,
    isConnected,
    broadcastTextureUpdated,
  } = useShirtChannel({
    ownerId,
    shirtNumber: shirt.shirt_number,
    currentPanel: panel,
    currentUserId,
    currentUserName,
    disablePresence,
    disableBroadcast,
  })

  useEffect(() => {
    if (mode !== 'drawing') return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        drawingRef.current?.undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode])

  const displayedScribbles = existingScribbles.filter(s => !removedIds.has(s.id))
  const headUrl = panel === 'back' ? (headBackUrl ?? headFrontUrl) : headFrontUrl
  const zoom = ZOOM_LEVELS[zoomIndex]
  const shirtTemplate = getShirtTemplate(panel)
  const draftKeyFor = useCallback((nextMode: SigningMode) => (
    `scribbl:draft:${ownerId}:${shirt.shirt_number}:${panel}:${currentUserId ?? 'guest'}:${nextMode}`
  ), [currentUserId, ownerId, panel, shirt.shirt_number])
  const draftKey = draftKeyFor(signingMode)

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

  const enterStudio = useCallback(() => {
    const nextMode: SigningMode = 'direct'
    const nextDraftKey = draftKeyFor(nextMode)
    const savedDraft = typeof window !== 'undefined' ? window.localStorage.getItem(nextDraftKey) : null
    let restoredHasDrawing = false
    setSigningMode(nextMode)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as object
        setDraftJson(hasDrawableFabricJson(parsed) ? parsed : null)
        if (hasDrawableFabricJson(parsed)) {
          restoredHasDrawing = true
          showToast({ tone: 'info', title: 'Draft restored', body: 'Your unsaved mark is back on the canvas.' })
        }
      } catch {
        setDraftJson(null)
      }
    } else {
      setDraftJson(null)
    }
    setMode('drawing')
    setZoomIndex(1)
    setTool(TOOL_PEN)
    setHasDrawing(restoredHasDrawing)
    setError(null)
    setFocusSpot(null)
    setComposeBox(findSuggestedSpot('big', panel, displayedScribbles))
  }, [displayedScribbles, draftKeyFor, panel])

  const cancelStudio = useCallback(() => {
    setMode('browse')
    setZoomIndex(0)
    setHasDrawing(false)
    setError(null)
    setFocusSpot(null)
    setDraftJson(null)
    if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey)
  }, [draftKey])

  const switchSigningMode = useCallback((nextMode: SigningMode) => {
    setSigningMode(nextMode)
    setTool(TOOL_PEN)
    setError(null)
    setFocusSpot(null)
    const nextDraftKey = draftKeyFor(nextMode)
    const savedDraft = typeof window !== 'undefined' ? window.localStorage.getItem(nextDraftKey) : null
    if (!savedDraft) {
      setDraftJson(null)
      setHasDrawing(false)
      return
    }

    try {
      const parsed = JSON.parse(savedDraft) as object
      const drawable = hasDrawableFabricJson(parsed)
      setDraftJson(drawable ? parsed : null)
      setHasDrawing(drawable)
      if (drawable) {
        showToast({
          tone: 'info',
          title: nextMode === 'direct' ? 'Direct draft restored' : 'Compose draft restored',
          body: 'Your unsaved mark is back on the canvas.',
        })
      }
    } catch {
      setDraftJson(null)
      setHasDrawing(false)
    }
  }, [draftKeyFor])

  const handleLocalStroke = useCallback((fabricJson: object) => {
    const drawable = hasDrawableFabricJson(fabricJson)
    setHasDrawing(drawable)
    if (drawable) setFocusSpot(null)
    if (typeof window === 'undefined') return
    if (drawable) {
      window.localStorage.setItem(draftKey, JSON.stringify(fabricJson))
    } else {
      window.localStorage.removeItem(draftKey)
    }
  }, [draftKey])

  const focusSuggestedSpot = useCallback((kind: SuggestedSpotKind) => {
    const spot = findSuggestedSpot(kind, panel, displayedScribbles)
    const nextZoomIndex = kind === 'big' ? 2 : 1

    setFocusSpot(spot)
    setComposeBox(spot)
    setZoomIndex(nextZoomIndex)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const scrollEl = studioScrollRef.current
        if (!scrollEl) return

        const scaleX = scrollEl.scrollWidth / SHIRT_W
        const scaleY = scrollEl.scrollHeight / SHIRT_H
        const left = (spot.x + spot.w / 2) * scaleX - scrollEl.clientWidth / 2
        const top = (spot.y + spot.h / 2) * scaleY - scrollEl.clientHeight / 2

        scrollEl.scrollTo({
          left: Math.max(0, left),
          top:  Math.max(0, top),
          behavior: 'smooth',
        })
      })
    })
  }, [displayedScribbles, panel])

  const handleComposePlacement = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (signingMode !== 'compose') return
    const rect = event.currentTarget.getBoundingClientRect()
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * SHIRT_W,
      y: ((event.clientY - rect.top) / rect.height) * SHIRT_H,
    }
    const candidate = clampScribbleBoxToCanvas({
      x: point.x - composeBox.w / 2,
      y: point.y - composeBox.h / 2,
      w: composeBox.w,
      h: composeBox.h,
    }, { maxSize: 260 })

    if (!isBoxInsideDrawableRegion(candidate, panel)) {
      setError('Place the note inside the shirt body, away from the collar and edges.')
      showToast({ tone: 'warning', title: 'Choose a shirt area', body: 'Notes need to sit inside the drawable shirt region.' })
      return
    }

    setError(null)
    setFocusSpot({ ...candidate, label: 'composed note spot' })
    setComposeBox(candidate)
  }, [composeBox.h, composeBox.w, panel, signingMode])

  const handleSaveScribble = useCallback(async () => {
    if (!drawingRef.current) return
    if (!actionCooldownRef.current.canRun(`save:${draftKey}`)) {
      showToast({ tone: 'warning', title: 'Saving already queued', body: 'Wait a moment before trying again.' })
      return
    }
    setIsSaving(true)
    setError(null)

    try {
      const layer = await drawingRef.current.exportLayer({ fullCanvas: signingMode === 'compose' })
      if (!layer || drawingRef.current.isEmpty()) {
        setError('Draw or add something before saving.')
        setIsSaving(false)
        return
      }

      const saveBox = signingMode === 'direct' ? layer.box : composeBox
      if (signingMode === 'compose' && !isBoxInsideDrawableRegion(saveBox, panel)) {
        setError('Move the composed note inside the shirt before saving.')
        setIsSaving(false)
        return
      }

      const res = await fetch('/api/scribble/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_mode: signingMode,
          template_id: SHIRT_TEMPLATE_ID,
          coordinate_space: SHIRT_COORDINATE_SPACE,
          owner_id: ownerId,
          shirt_number: shirt.shirt_number,
          panel,
          x: saveBox.x,
          y: saveBox.y,
          w: saveBox.w,
          h: saveBox.h,
          canvas_svg: layer.canvasSvg,
          canvas_json: layer.canvasJson,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const messages: Record<string, string> = {
          EMPTY_CANVAS: 'Draw or add something before saving.',
          INVALID_BOX: 'That mark could not be placed on the shirt. Try a smaller area.',
          DIRECT_LAYER_REQUIRED: 'Direct drawing must be saved as a clipped shirt layer. Refresh and try again.',
          INVALID_SVG: 'This drawing could not be saved safely. Try clearing and drawing again.',
          FORBIDDEN: body.error ?? 'You cannot scribble on this shirt right now.',
          SAVE_FAILED: 'Failed to save scribble. Please try again.',
          RATE_LIMITED: 'Too many save attempts. Wait a moment and try again.',
        }
        setError(messages[String(body.code)] ?? body.error ?? 'Something went wrong')
        setIsSaving(false)
        return
      }

      broadcastTextureUpdated(panel)
      if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey)
      showToast({ tone: 'success', title: 'Scribble saved', body: `${ownerName}'s shirt was updated.` })
      setMode('browse')
      setZoomIndex(0)
      setHasDrawing(false)
      onScribblePlaced?.()
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      showToast({ tone: 'error', title: 'Network error', body: 'Your drawing draft is still saved locally.' })
    } finally {
      setIsSaving(false)
    }
  }, [broadcastTextureUpdated, composeBox, draftKey, onScribblePlaced, ownerId, ownerName, panel, router, shirt.shirt_number, signingMode])

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

  const renderSavedScribbles = (interactive: boolean) => (
    <>
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

      {interactive && displayedScribbles.map(s => {
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
    </>
  )

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
            {mode === 'browse' && !isOwner && canScribble && (
              <button
                onClick={enterStudio}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ink-700"
              >
                <PenLine size={13} />
                Sign now
              </button>
            )}
            {mode === 'drawing' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                <Users size={13} />
                Studio open
              </span>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <ShirtShell
            shirtColor={shirtColor}
            headUrl={headUrl}
            panel={panel}
            showHead={mode === 'browse' || showAvatarInStudio}
            className={cn(mode === 'drawing' && !showAvatarInStudio ? 'max-w-[760px]' : 'max-w-[640px]')}
          >
            {mode === 'browse' && (
              <div className="absolute inset-0">
                {displayedScribbles.length === 0 && (
                  <div className="absolute inset-4 flex items-center justify-center rounded-2xl border border-dashed border-black/15 text-center text-black/40">
                    <p className="max-w-[190px] text-xs font-medium">
                      Nobody has signed this surface yet. Be the first mark on the fabric.
                    </p>
                  </div>
                )}
                {renderSavedScribbles(isOwner || canScribble)}
              </div>
            )}

            {mode === 'drawing' && (
              <div
                ref={studioScrollRef}
                className="absolute inset-0 overflow-auto bg-white/0"
                style={{ touchAction: signingMode === 'compose' ? 'none' : 'pan-x pan-y' }}
              >
                <div
                  className="relative min-h-full min-w-full"
                  style={{
                    width: `${zoom * 100}%`,
                    height: `${zoom * 100}%`,
                  }}
                >
                  {renderSavedScribbles(false)}
                  {signingMode === 'compose' && (
                    <div
                      className="absolute inset-0 z-20 cursor-crosshair"
                      onPointerDown={handleComposePlacement}
                      aria-label="Choose where to place your composed note"
                    />
                  )}
                  {(focusSpot || signingMode === 'compose') && (
                    <div
                      className="pointer-events-none absolute z-30 rounded-2xl border-2 border-ink-900/50 bg-ink-900/5 shadow-[0_0_0_9999px_rgba(255,255,255,0.18)]"
                      style={{
                        left: `${((signingMode === 'compose' ? composeBox.x : focusSpot!.x) / SHIRT_W) * 100}%`,
                        top: `${((signingMode === 'compose' ? composeBox.y : focusSpot!.y) / SHIRT_H) * 100}%`,
                        width: `${((signingMode === 'compose' ? composeBox.w : focusSpot!.w) / SHIRT_W) * 100}%`,
                        height: `${((signingMode === 'compose' ? composeBox.h : focusSpot!.h) / SHIRT_H) * 100}%`,
                      }}
                    >
                      <span className="absolute -top-7 left-0 rounded-full bg-ink-900 px-2 py-1 text-[10px] font-semibold text-white">
                        {signingMode === 'compose' ? 'composed note spot' : focusSpot!.label}
                      </span>
                    </div>
                  )}
                  {signingMode === 'direct' && (
                    <DrawingCanvas
                      key={draftKey}
                      ref={drawingRef}
                      w={SHIRT_W}
                      h={SHIRT_H}
                      tool={tool}
                      color={color}
                      brushSize={brushSize}
                      opacity={opacity}
                      fillShapes={fillShapes}
                      fontSize={fontSize}
                      fontStyle={fontStyle}
                      onStroke={handleLocalStroke}
                      initialJson={draftJson}
                      clipPath={shirtTemplate.drawablePath}
                    />
                  )}
                </div>
              </div>
            )}
          </ShirtShell>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/10 bg-white/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-h-[20px] text-sm">
            {error && <p className="text-red-600">{error}</p>}
            {removeError && <p className="text-red-600">{removeError}</p>}
            {!error && !removeError && mode === 'browse' && (
              <p className="text-xs text-gray-500">
                {isOwner
                  ? 'Tap a saved scribble to remove it from your shirt.'
                  : canScribble
                    ? `Open the studio and sign directly on ${ownerName}'s shirt.`
                    : `${ownerName}'s shirt is view-only for your account right now.`}
              </p>
            )}
            {!error && mode === 'drawing' && (
              <p className="text-xs text-gray-500">
                {signingMode === 'direct'
                  ? 'Direct mode clips every stroke to the shirt SVG region.'
                  : 'Compose mode saves your note as a placed layer inside the shirt region.'}
              </p>
            )}
          </div>

          {mode === 'browse' && !isOwner && canScribble && (
            <button
              onClick={enterStudio}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-ink-700"
            >
              <PenLine size={16} />
              Scribble on this shirt
            </button>
          )}

          {mode === 'drawing' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setZoomIndex(i => Math.max(0, i - 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-900 transition hover:bg-gray-50"
                title="Zoom out"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-[48px] text-center text-xs font-medium text-gray-500">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-900 transition hover:bg-gray-50"
                title="Zoom in"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={cancelStudio}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 transition hover:bg-gray-50"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSaveScribble}
                disabled={isSaving || !hasDrawing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </section>

      {mode === 'drawing' && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => switchSigningMode('direct')}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                  signingMode === 'direct'
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-gray-200 bg-white text-ink-900 hover:bg-gray-50'
                )}
              >
                Direct shirt draw
              </button>
              <button
                onClick={() => switchSigningMode('compose')}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                  signingMode === 'compose'
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-gray-200 bg-white text-ink-900 hover:bg-gray-50'
                )}
              >
                Compose then place
              </button>
              <span className="text-xs text-gray-500">
                {signingMode === 'direct'
                  ? 'Draw like a real shirt signing. The shirt clips the strokes.'
                  : 'Tap the shirt to place this note, then save it.'}
              </span>
            </div>

            {signingMode === 'compose' && (
              <div className="grid gap-3 rounded-2xl border border-dashed border-black/15 bg-paper-100 p-3 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Compose note</p>
                  <p className="mt-1 text-xs text-gray-500">This scratch canvas becomes one movable shirt layer.</p>
                </div>
                <div className="h-[130px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-inner">
                  <DrawingCanvas
                    key={draftKey}
                    ref={drawingRef}
                    w={COMPOSE_BOX_SIZE.w}
                    h={COMPOSE_BOX_SIZE.h}
                    tool={tool}
                    color={color}
                    brushSize={brushSize}
                    opacity={opacity}
                    fillShapes={fillShapes}
                    fontSize={fontSize}
                    fontStyle={fontStyle}
                    onStroke={handleLocalStroke}
                    initialJson={draftJson}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTool(TOOL_TEXT)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-ink-900 transition hover:bg-gray-50"
            >
              Write my name
            </button>
            <button
              onClick={() => setTool(TOOL_PEN)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-ink-900 transition hover:bg-gray-50"
            >
              Draw something
            </button>
            <button
              onClick={() => drawingRef.current?.addEmoji(QUICK_EMOJI)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-ink-900 transition hover:bg-gray-50"
            >
              Add {QUICK_EMOJI}
            </button>
            <button
              onClick={() => focusSuggestedSpot('best')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-ink-900 transition hover:bg-gray-50"
            >
              <MapPin size={14} />
              Find open spot
            </button>
            <button
              onClick={() => focusSuggestedSpot('big')}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-ink-900 transition hover:bg-gray-50"
            >
              Big note area
            </button>
            <button
              onClick={() => focusSuggestedSpot('edge')}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-ink-900 transition hover:bg-gray-50"
            >
              Edge mark
            </button>
            <button
              onClick={() => setShowAvatarInStudio(value => !value)}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs font-medium transition',
                showAvatarInStudio
                  ? 'border-ink-900 bg-ink-900 text-white hover:bg-ink-700'
                  : 'border-gray-200 bg-white text-ink-900 hover:bg-gray-50'
              )}
            >
              {showAvatarInStudio ? 'Avatar visible' : 'Shirt only'}
            </button>
            <button
              onClick={() => {
                drawingRef.current?.clear()
                setHasDrawing(false)
                setFocusSpot(null)
              }}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
            >
              <RotateCcw size={14} />
              Reset mark
            </button>
            </div>
          </div>

          <ScribbleToolbar
            tool={tool}
            color={color}
            brushSize={brushSize}
            opacity={opacity}
            fillShapes={fillShapes}
            fontSize={fontSize}
            fontStyle={fontStyle}
            onTool={setTool}
            onColor={setColor}
            onBrushSize={setBrushSize}
            onOpacity={setOpacity}
            onFill={setFillShapes}
            onFontSize={setFontSize}
            onFontStyle={setFontStyle}
            onUndo={() => drawingRef.current?.undo()}
            onClear={() => drawingRef.current?.clear()}
            onPlace={handleSaveScribble}
            onEmoji={emoji => drawingRef.current?.addEmoji(emoji)}
            isPlacing={isSaving}
            canPlace={hasDrawing}
          />
        </div>
      )}

      {yearbookQuote && mode === 'browse' && (
        <p className="text-center text-xs italic text-gray-500">&ldquo;{yearbookQuote}&rdquo;</p>
      )}
    </div>
  )
}
