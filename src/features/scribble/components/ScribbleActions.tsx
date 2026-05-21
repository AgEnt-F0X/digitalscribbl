'use client'

import { Eye, RotateCcw, Send } from 'lucide-react'

interface ScribbleActionsProps {
  canSend: boolean
  isSaving: boolean
  onSend: () => void
  onPreview: () => void
  onClear: () => void
}

export default function ScribbleActions({ canSend, isSaving, onSend, onPreview, onClear }: ScribbleActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend || isSaving}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={16} />
        {isSaving ? 'Publishing…' : 'Publish scribble'}
      </button>
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink-900 transition hover:bg-black/5"
      >
        <Eye size={16} />
        Preview
      </button>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600"
      >
        <RotateCcw size={16} />
        Clear draft
      </button>
    </div>
  )
}
