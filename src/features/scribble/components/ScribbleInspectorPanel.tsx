'use client'

import { Copy, Mic, RotateCcw, Trash2, X } from 'lucide-react'
import ScribblePermissionStatus from './ScribblePermissionStatus'
import QuickNoteTemplates from './QuickNoteTemplates'
import StickerPicker from './StickerPicker'
import type { CanvasMode, OutsideNote, OutsideStickerReaction } from '../types'

type SelectedOutsideObject =
  | { type: 'outside-note'; id: string }
  | { type: 'outside-reaction'; id: string }
  | null

interface ScribbleInspectorPanelProps {
  ownerName: string
  activeMode: CanvasMode
  permissionState: 'can' | 'request' | 'locked' | 'own'
  signedCount: number
  textDraft: string
  onTextDraft: (value: string) => void
  onInsertText: (text: string) => void
  onSelectSticker: (stickerId: string) => void
  voiceUrl: string | null
  voiceDurationMs: number | null
  voiceUploading: boolean
  onVoiceFile: (file: File) => void
  onClearVoice: () => void
  selectedObject: SelectedOutsideObject
  outsideNotes: OutsideNote[]
  outsideReactions: OutsideStickerReaction[]
  onUpdateOutsideNote: (id: string, patch: Partial<OutsideNote>) => void
  onUpdateOutsideReaction: (id: string, patch: Partial<OutsideStickerReaction>) => void
  onDuplicateSelected: () => void
  onDeleteSelected: () => void
}

export default function ScribbleInspectorPanel({
  ownerName,
  activeMode,
  permissionState,
  signedCount,
  textDraft,
  onTextDraft,
  onInsertText,
  onSelectSticker,
  voiceUrl,
  voiceDurationMs,
  voiceUploading,
  onVoiceFile,
  onClearVoice,
  selectedObject,
  outsideNotes,
  outsideReactions,
  onUpdateOutsideNote,
  onUpdateOutsideReaction,
  onDuplicateSelected,
  onDeleteSelected,
}: ScribbleInspectorPanelProps) {
  const selectedNote = selectedObject?.type === 'outside-note'
    ? outsideNotes.find(note => note.id === selectedObject.id)
    : null
  const selectedReaction = selectedObject?.type === 'outside-reaction'
    ? outsideReactions.find(reaction => reaction.id === selectedObject.id)
    : null

  return (
    <aside className="space-y-4">
      <section className="sketch-panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Signing for</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-ink-900">{ownerName}</h2>
          </div>
          <ScribblePermissionStatus state={permissionState} />
        </div>
        <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3">
          <p className="text-sm font-semibold text-ink-500">People who signed</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{signedCount}</p>
        </div>
      </section>

      <section className="sketch-panel p-4">
        <p className="font-display text-2xl font-bold text-ink-900">Publish options</p>

        <div className="mt-3 rounded-2xl border border-black/10 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Voice note</p>
              <p className="text-xs text-ink-500">
                Optional. Max 12 seconds. Only {ownerName.split(' ')[0]} and you will hear it.
              </p>
            </div>
            {voiceUrl ? (
              <button
                type="button"
                onClick={onClearVoice}
                className="rounded-xl border border-red-100 p-2 text-red-600 hover:bg-red-50"
                aria-label="Remove voice note"
              >
                <X size={15} />
              </button>
            ) : (
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs font-bold hover:bg-black/5">
                <Mic size={15} />
                {voiceUploading ? 'Uploading...' : 'Add'}
                <input
                  type="file"
                  accept="audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav"
                  disabled={voiceUploading}
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) onVoiceFile(file)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            )}
          </div>
          {voiceUrl && (
            <div className="mt-3 space-y-2">
              <audio controls src={voiceUrl} className="w-full" />
              <p className="text-xs text-ink-500">{Math.ceil((voiceDurationMs ?? 0) / 1000)}s attached to this scribble.</p>
            </div>
          )}
        </div>
      </section>

      {(selectedNote || selectedReaction) ? (
        <section className="rounded-[24px] border border-brand/25 bg-white p-4 shadow-sm">
          <p className="font-display text-2xl font-bold text-ink-900">
            {selectedNote ? 'Edit selected note' : 'Edit selected sticker'}
          </p>
          {selectedNote && (
            <div className="mt-3 space-y-3">
              <textarea
                value={selectedNote.text}
                onChange={event => onUpdateOutsideNote(selectedNote.id, { text: event.target.value })}
                className="min-h-[96px] w-full resize-none rounded-2xl border border-black/10 bg-paper-50 p-3 text-sm outline-none focus:border-brand"
              />
              <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                Rotate
                <input
                  type="range"
                  min={-24}
                  max={24}
                  value={selectedNote.transform.rotation}
                  onChange={event => onUpdateOutsideNote(selectedNote.id, {
                    transform: { ...selectedNote.transform, rotation: Number(event.target.value) },
                  })}
                  className="mt-2 h-6 w-full accent-brand"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                Size
                <input
                  type="range"
                  min={0.6}
                  max={1.6}
                  step={0.05}
                  value={selectedNote.transform.scale}
                  onChange={event => onUpdateOutsideNote(selectedNote.id, {
                    transform: { ...selectedNote.transform, scale: Number(event.target.value) },
                  })}
                  className="mt-2 h-6 w-full accent-brand"
                />
              </label>
            </div>
          )}
          {selectedReaction && (
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                Size
                <input
                  type="range"
                  min={0.6}
                  max={1.8}
                  step={0.05}
                  value={selectedReaction.transform.scale}
                  onChange={event => onUpdateOutsideReaction(selectedReaction.id, {
                    transform: { ...selectedReaction.transform, scale: Number(event.target.value) },
                  })}
                  className="mt-2 h-6 w-full accent-brand"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                Rotate
                <input
                  type="range"
                  min={-40}
                  max={40}
                  value={selectedReaction.transform.rotation}
                  onChange={event => onUpdateOutsideReaction(selectedReaction.id, {
                    transform: { ...selectedReaction.transform, rotation: Number(event.target.value) },
                  })}
                  className="mt-2 h-6 w-full accent-brand"
                />
              </label>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5"
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold opacity-50"
            >
              <RotateCcw size={14} />
              Layer
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </section>
      ) : (
        <section className="sketch-panel p-4">
          <p className="font-display text-2xl font-bold text-ink-900">
            {activeMode === 'shirt' ? 'Add shirt text' : 'Add outside note'}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-500">
            {activeMode === 'shirt'
              ? 'This inserts editable text into the clipped shirt canvas.'
              : 'This creates a separate outside-note object around the profile.'}
          </p>
          <textarea
            value={textDraft}
            onChange={event => onTextDraft(event.target.value)}
            placeholder={activeMode === 'shirt' ? 'Write on the shirt...' : 'Leave a note outside the shirt...'}
            className="mt-3 min-h-[104px] w-full resize-none rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => onInsertText(textDraft)}
            disabled={!textDraft.trim()}
            className="mt-3 w-full min-h-11 rounded-2xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-700 disabled:opacity-40"
          >
            Insert editable text
          </button>
        </section>
      )}

      <section className="sketch-panel p-4">
        <QuickNoteTemplates onSelect={onInsertText} />
      </section>
      <section className="sketch-panel p-4">
        <StickerPicker onSelect={onSelectSticker} />
      </section>
    </aside>
  )
}
