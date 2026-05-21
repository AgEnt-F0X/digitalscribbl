'use client'

import Link from 'next/link'
import { ArrowLeft, Eye, Maximize2, Minus, PenTool, Plus, Save, Send } from 'lucide-react'

interface ScribbleTopBarProps {
  currentUserName: string
  canPublish: boolean
  isSaving: boolean
  onPreview: () => void
  onSaveDraft: () => void
  onPublish: () => void
  zoom: number
  onZoom: (zoom: number) => void
  onFitZoom: () => void
  /**
   * Show the "Just sign" CTA. Visible while the user hasn't placed any ink
   * on the current side yet (or when the canvas is empty). The studio
   * owns this signal.
   */
  showJustSign: boolean
  signatureModeActive: boolean
  onEnterSignatureMode: () => void
}

const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 25

export default function ScribbleTopBar({
  currentUserName,
  canPublish,
  isSaving,
  onPreview,
  onSaveDraft,
  onPublish,
  zoom,
  onZoom,
  onFitZoom,
  showJustSign,
  signatureModeActive,
  onEnterSignatureMode,
}: ScribbleTopBarProps) {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-paper-100/95 px-3 py-2.5 backdrop-blur md:px-4 md:py-3">
      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold hover:bg-black/5 md:px-3"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to dashboard</span>
        </Link>
        <Link href="/dashboard" className="font-display text-2xl font-bold leading-none text-ink-900 md:text-3xl">
          Scribbl
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {showJustSign && !signatureModeActive && (
          <button
            type="button"
            onClick={onEnterSignatureMode}
            title="Skip the full canvas — drop your signature directly on the shirt"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-brand/30 bg-brand-soft px-3 py-2 text-sm font-bold text-brand transition hover:bg-brand/15"
          >
            <PenTool size={15} />
            <span className="hidden sm:inline">Just sign</span>
          </button>
        )}

        {/* Zoom cluster — visible on md+ so the BottomBar's wider zoom cluster
            can stay primary on small screens. */}
        <div className="hidden items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-1 text-sm font-semibold md:inline-flex">
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
          <span className="min-w-[42px] text-center tabular-nums" aria-live="polite">
            {zoom}%
          </span>
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
            aria-label="Fit to screen"
            title="Fit to screen (100%)"
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-bold uppercase tracking-[0.12em] hover:bg-black/5"
          >
            <Maximize2 size={13} />
            Fit
          </button>
        </div>

        {isSaving && (
          <span className="md:hidden text-xs font-semibold text-ink-500" aria-live="polite">Saving…</span>
        )}
        <button
          type="button"
          onClick={onPreview}
          className="hidden min-h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 md:inline-flex"
        >
          <Eye size={16} />
          Preview shirt
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          className="hidden min-h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 md:inline-flex"
        >
          <Save size={16} />
          Save draft
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSaving}
          className="hidden min-h-11 items-center gap-2 rounded-2xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45 md:inline-flex"
        >
          <Send size={16} />
          {signatureModeActive
            ? (isSaving ? 'Signing…' : 'Sign')
            : (isSaving ? 'Publishing...' : 'Publish scribble')}
        </button>
        <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1 md:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-200 text-sm font-bold text-ink-900">
            {currentUserName.slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-[120px] truncate pr-2 text-sm font-semibold">{currentUserName}</span>
        </div>
      </div>
    </nav>
  )
}
