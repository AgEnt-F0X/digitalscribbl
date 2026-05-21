'use client'

import { NOTE_TEMPLATES } from '../data/noteTemplates'

interface QuickNoteTemplatesProps {
  onSelect: (text: string) => void
  heading?: boolean
}

export default function QuickNoteTemplates({ onSelect, heading = true }: QuickNoteTemplatesProps) {
  return (
    <div>
      {heading && (
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-2xl font-bold text-ink-900">Quick notes</p>
          <span className="text-xs font-semibold text-brand">editable</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {NOTE_TEMPLATES.map(template => (
          <button
            key={template}
            type="button"
            onClick={() => onSelect(template)}
            className="min-h-11 rounded-2xl border border-black/10 bg-paper-50 px-3 py-2 text-xs font-semibold text-ink-900 shadow-sm transition hover:-translate-y-0.5 hover:border-brand"
          >
            {template}
          </button>
        ))}
      </div>
    </div>
  )
}
