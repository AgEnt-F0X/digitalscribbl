'use client'

import { Eye, Maximize2, Minus, Plus, Send, Trash2 } from 'lucide-react'
import type { CanvasMode } from '../types'

interface ScribbleBottomBarProps {
  activeMode: CanvasMode
  permissionState: 'can' | 'request' | 'locked' | 'own'
  zoom: number
  onZoom: (zoom: number) => void
  onFitZoom: () => void
  onClear: () => void
  onPreview: () => void
  onPublish: () => void
  canPublish: boolean
  isSaving: boolean
  publishLabel?: string
}

const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 25

function statusText(activeMode: CanvasMode, permissionState: ScribbleBottomBarProps['permissionState']) {
  if (permissionState === 'can') {
    return activeMode === 'shirt'
      ? 'Drawing stays inside the shirt'
      : 'Outside notes stay around the profile'
  }
  if (permissionState === 'request') return 'Ask permission to scribble'
  if (permissionState === 'own') return 'You cannot sign your own shirt'
  return 'Waiting for approval'
}

export default function ScribbleBottomBar({
  activeMode,
  permissionState,
  zoom,
  onZoom,
  onFitZoom,
  onClear,
  onPreview,
  onPublish,
  canPublish,
  isSaving,
  publishLabel,
}: ScribbleBottomBarProps) {
  const status = statusText(activeMode, permissionState)
  const sendingLabel = isSaving ? 'Publishing…' : (publishLabel ?? 'Publish scribble')
  const mobileSendingLabel = isSaving ? 'Publishing…' : (publishLabel ?? 'Publish')
  return (
    <footer
      className="sticky bottom-0 z-30 border-t border-black/10 bg-paper-100/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Mobile: condensed Publish bar with a slim zoom cluster on the left
          so the user can zoom on phones without opening the bottom sheet. */}
      <div className="flex items-center gap-2 px-3 py-2 md:hidden">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-[36px] text-center tabular-nums">{zoom}%</span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={onFitZoom}
            aria-label="Fit"
            title="Fit to screen"
            className="ml-1 inline-flex items-center rounded-lg px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-black/5"
          >
            <Maximize2 size={12} />
          </button>
        </div>
        <p className="hidden min-w-0 flex-1 truncate text-xs font-semibold text-ink-500 xs:block">{status}</p>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSaving}
          className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Send size={16} />
          {mobileSendingLabel}
        </button>
      </div>

      {/* Desktop: full toolbar */}
      <div className="hidden gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_auto_auto_auto] md:items-center">
        <p className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink-500">
          {status}
        </p>
        <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => onZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            title="Zoom out"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Minus size={15} />
          </button>
          <span className="min-w-[42px] text-center tabular-nums">{zoom}%</span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            title="Zoom in"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Plus size={15} />
          </button>
          <span aria-hidden className="mx-1 h-5 w-px bg-black/10" />
          <button
            type="button"
            onClick={onFitZoom}
            aria-label="Fit"
            title="Fit to screen (100%)"
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-bold uppercase tracking-[0.12em] hover:bg-black/5"
          >
            <Maximize2 size={13} />
            Fit
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex flex-1 min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex flex-1 min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Clear draft
          </button>
        </div>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSaving}
          className="rounded-2xl bg-ink-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {sendingLabel}
        </button>
      </div>
    </footer>
  )
}
