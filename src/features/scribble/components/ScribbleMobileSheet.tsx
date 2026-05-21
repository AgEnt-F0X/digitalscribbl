'use client'

import { useEffect } from 'react'
import { ChevronUp, Mic, Palette, Smile, Trash2, Type, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import HandwritingStylePicker from './HandwritingStylePicker'
import QuickNoteTemplates from './QuickNoteTemplates'
import ScribbleToolbar from './ScribbleToolbar'
import StickerPicker from './StickerPicker'
import type { CanvasMode, OutsideNote, OutsideStickerReaction, ScribbleTool } from '../types'

export type MobileSheetTab = 'tools' | 'text' | 'stickers' | 'voice'

type SelectedOutsideObject =
  | { type: 'outside-note'; id: string }
  | { type: 'outside-reaction'; id: string }
  | null

interface ScribbleMobileSheetProps {
  activeMode: CanvasMode
  tab: MobileSheetTab
  onTab: (tab: MobileSheetTab) => void
  expanded: boolean
  onExpanded: (expanded: boolean) => void

  // toolbar state
  tool: ScribbleTool
  color: string
  brushSize: number
  fontStyleId: string
  highlightEnabled: boolean
  fillShapes: boolean
  recentColors: string[]
  onTool: (tool: ScribbleTool) => void
  onColor: (color: string) => void
  onBrushSize: (size: number) => void
  onFontStyle: (styleId: string) => void
  onHighlight: (enabled: boolean) => void
  onFillShapes: (enabled: boolean) => void
  onUndo: () => void
  onRedo: () => void
  onClearDraft: () => void

  // text tab
  textDraft: string
  onTextDraft: (value: string) => void
  onInsertText: (text: string) => void

  // stickers tab
  onSelectSticker: (stickerId: string) => void

  // voice tab
  voiceUrl: string | null
  voiceDurationMs: number | null
  voiceUploading: boolean
  onVoiceFile: (file: File) => void
  onClearVoice: () => void
  ownerFirstName: string

  // selection editor (auto-shown when an outside object is selected)
  selectedObject: SelectedOutsideObject
  selectedNote: OutsideNote | null
  selectedReaction: OutsideStickerReaction | null
  onUpdateOutsideNote: (id: string, patch: Partial<OutsideNote>) => void
  onUpdateOutsideReaction: (id: string, patch: Partial<OutsideStickerReaction>) => void
  onDuplicateSelected: () => void
  onDeleteSelected: () => void
  onClearSelection: () => void
}

const TABS: { id: MobileSheetTab; label: string; icon: typeof Palette }[] = [
  { id: 'tools', label: 'Tools', icon: Palette },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'stickers', label: 'Stickers', icon: Smile },
  { id: 'voice', label: 'Voice', icon: Mic },
]

/**
 * Mobile-only bottom sheet for ScribbleStudio. Two snap points:
 *   collapsed  → only the drag handle + tab strip are visible (≈88px)
 *   expanded   → the sheet rises to expose ≈60vh of tab content.
 *
 * The sheet always floats *over* the canvas. The canvas does not resize when
 * the sheet expands, so the user never sees layout shift on the shirt.
 *
 * Drag/swipe is intentionally not wired — taps on the handle or a tab are the
 * primary affordance. This matches the PD §9 guidance ("CSS-only sheet, drag
 * is optional polish") and avoids a touch-event listener that would fight
 * the Fabric.js canvas underneath.
 */
export default function ScribbleMobileSheet(props: ScribbleMobileSheetProps) {
  const {
    activeMode,
    tab,
    onTab,
    expanded,
    onExpanded,
    selectedObject,
    selectedNote,
    selectedReaction,
  } = props

  const hasSelection = Boolean(selectedObject && (selectedNote || selectedReaction))

  // When an outside object is selected, auto-expand the sheet so the user
  // immediately sees the rotation / scale / delete controls instead of tiny
  // canvas handles. Empty selection collapses back to where we were.
  useEffect(() => {
    if (hasSelection) onExpanded(true)
  }, [hasSelection, onExpanded])

  function handleTabClick(next: MobileSheetTab) {
    if (tab === next && expanded) {
      onExpanded(false)
      return
    }
    onTab(next)
    onExpanded(true)
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 md:hidden"
      // Sit just above the mobile ScribbleBottomBar (≈60px tall + iOS safe-area).
      // This keeps the Publish CTA in the BottomBar always reachable, even when
      // the sheet is expanded over the canvas.
      style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
      aria-hidden={false}
    >
      <div
        className={cn(
          'pointer-events-auto relative mx-auto flex h-[60vh] max-h-[560px] w-full flex-col overflow-hidden rounded-t-[28px] border-t border-x border-black/10 bg-paper-50/[0.98] shadow-[0_-18px_48px_rgba(45,35,22,0.10)] backdrop-blur transition-transform duration-300 ease-out',
        )}
        style={{
          // When collapsed, translate the sheet downward so only the tab strip + handle peek above the BottomBar.
          transform: expanded ? 'translateY(0)' : 'translateY(calc(60vh - 92px))',
        }}
      >
        {/* Drag / tap handle */}
        <button
          type="button"
          onClick={() => onExpanded(!expanded)}
          aria-label={expanded ? 'Collapse tool sheet' : 'Expand tool sheet'}
          className="flex w-full items-center justify-center py-2"
        >
          <span className="block h-1.5 w-12 rounded-full bg-ink-100" />
        </button>

        {/* Tab strip — always visible */}
        <div role="tablist" aria-label="Scribble tools" className="flex shrink-0 items-stretch gap-1 border-b border-black/5 px-2 pb-2">
          {TABS.map(item => {
            const Icon = item.icon
            const active = tab === item.id && (expanded || !hasSelection)
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`scribble-mobile-tab-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-bold transition',
                  active
                    ? 'bg-brand-soft text-brand'
                    : 'text-ink-500 hover:bg-black/5',
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => onExpanded(!expanded)}
            aria-label={expanded ? 'Collapse sheet' : 'Expand sheet'}
            className="ml-1 flex min-h-[56px] w-11 items-center justify-center rounded-2xl text-ink-500 hover:bg-black/5"
          >
            <ChevronUp
              size={20}
              className={cn('transition-transform', expanded && 'rotate-180')}
            />
          </button>
        </div>

        {/* Tab content — only visible when expanded */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {hasSelection ? (
            <SelectionEditor
              selectedNote={selectedNote}
              selectedReaction={selectedReaction}
              onUpdateOutsideNote={props.onUpdateOutsideNote}
              onUpdateOutsideReaction={props.onUpdateOutsideReaction}
              onDuplicateSelected={props.onDuplicateSelected}
              onDeleteSelected={props.onDeleteSelected}
              onClearSelection={props.onClearSelection}
            />
          ) : (
            <div id={`scribble-mobile-tab-${tab}`} role="tabpanel">
              {tab === 'tools' && (
                <ToolsTab {...props} />
              )}
              {tab === 'text' && (
                <TextTab {...props} activeMode={activeMode} />
              )}
              {tab === 'stickers' && (
                <StickerPicker
                  heading={false}
                  columns={4}
                  onSelect={props.onSelectSticker}
                />
              )}
              {tab === 'voice' && (
                <VoiceTab
                  ownerFirstName={props.ownerFirstName}
                  voiceUrl={props.voiceUrl}
                  voiceDurationMs={props.voiceDurationMs}
                  voiceUploading={props.voiceUploading}
                  onVoiceFile={props.onVoiceFile}
                  onClearVoice={props.onClearVoice}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolsTab(props: ScribbleMobileSheetProps) {
  return (
    <div className="space-y-3">
      <ScribbleToolbar
        variant="mobile"
        activeMode={props.activeMode}
        tool={props.tool}
        color={props.color}
        brushSize={props.brushSize}
        fontStyleId={props.fontStyleId}
        highlightEnabled={props.highlightEnabled}
        fillShapes={props.fillShapes}
        recentColors={props.recentColors}
        onTool={props.onTool}
        onColor={props.onColor}
        onBrushSize={props.onBrushSize}
        onFontStyle={props.onFontStyle}
        onHighlight={props.onHighlight}
        onFillShapes={props.onFillShapes}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
      />
      <button
        type="button"
        onClick={props.onClearDraft}
        className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        <Trash2 size={16} />
        Clear current draft
      </button>
    </div>
  )
}

function TextTab(props: ScribbleMobileSheetProps & { activeMode: CanvasMode }) {
  const placeholder = props.activeMode === 'shirt'
    ? 'Write on the shirt...'
    : 'Leave a note outside the shirt...'

  return (
    <div className="space-y-3">
      <textarea
        value={props.textDraft}
        onChange={event => props.onTextDraft(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-brand"
      />
      <button
        type="button"
        onClick={() => props.onInsertText(props.textDraft)}
        disabled={!props.textDraft.trim()}
        className="w-full min-h-11 rounded-2xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-700 disabled:opacity-40"
      >
        {props.activeMode === 'shirt' ? 'Insert on shirt' : 'Place outside note'}
      </button>

      <div className="rounded-2xl border border-black/10 bg-white p-3">
        <QuickNoteTemplates heading={false} onSelect={props.onInsertText} />
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-3">
        <HandwritingStylePicker
          variant="grid"
          value={props.fontStyleId}
          onChange={props.onFontStyle}
        />
        <button
          type="button"
          onClick={() => props.onHighlight(!props.highlightEnabled)}
          aria-pressed={props.highlightEnabled}
          className={cn(
            'mt-3 flex w-full min-h-11 items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition',
            props.highlightEnabled ? 'border-[#f2c84b] bg-[#fff4b8]' : 'border-black/10 bg-white hover:bg-black/5',
          )}
        >
          Highlight note
          <span className="block h-4 w-8 rounded-full bg-paper-100 shadow-inner">
            <span className={cn('block h-4 w-4 rounded-full bg-[#f2c84b] transition', props.highlightEnabled && 'translate-x-4')} />
          </span>
        </button>
      </div>
    </div>
  )
}

function VoiceTab({
  ownerFirstName,
  voiceUrl,
  voiceDurationMs,
  voiceUploading,
  onVoiceFile,
  onClearVoice,
}: {
  ownerFirstName: string
  voiceUrl: string | null
  voiceDurationMs: number | null
  voiceUploading: boolean
  onVoiceFile: (file: File) => void
  onClearVoice: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-black/10 bg-white p-3">
        <p className="text-sm font-semibold text-ink-900">Voice note</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">
          Optional. Max 12 seconds. Only {ownerFirstName} and you will hear it.
        </p>
        {voiceUrl ? (
          <div className="mt-3 space-y-3">
            <audio controls src={voiceUrl} className="w-full" />
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span>{Math.ceil((voiceDurationMs ?? 0) / 1000)}s attached</span>
              <button
                type="button"
                onClick={onClearVoice}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                <X size={14} />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-paper-50 px-3 py-3 text-sm font-bold text-ink-700 hover:border-brand/40 hover:text-brand">
            <Mic size={16} />
            {voiceUploading ? 'Uploading…' : 'Choose or record an audio clip'}
            <input
              type="file"
              accept="audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav"
              capture
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
      <p className="px-1 text-xs text-ink-500">
        On phones, tapping above opens your audio recorder. Keep it under 12 seconds.
      </p>
    </div>
  )
}

function SelectionEditor({
  selectedNote,
  selectedReaction,
  onUpdateOutsideNote,
  onUpdateOutsideReaction,
  onDuplicateSelected,
  onDeleteSelected,
  onClearSelection,
}: {
  selectedNote: OutsideNote | null
  selectedReaction: OutsideStickerReaction | null
  onUpdateOutsideNote: (id: string, patch: Partial<OutsideNote>) => void
  onUpdateOutsideReaction: (id: string, patch: Partial<OutsideStickerReaction>) => void
  onDuplicateSelected: () => void
  onDeleteSelected: () => void
  onClearSelection: () => void
}) {
  return (
    <div className="space-y-3" role="region" aria-label="Edit selected object">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl font-bold text-ink-900">
          {selectedNote ? 'Edit note' : 'Edit sticker'}
        </p>
        <button
          type="button"
          onClick={onClearSelection}
          aria-label="Deselect"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-500 hover:bg-black/5"
        >
          <X size={18} />
        </button>
      </div>

      {selectedNote && (
        <>
          <textarea
            value={selectedNote.text}
            onChange={event => onUpdateOutsideNote(selectedNote.id, { text: event.target.value })}
            rows={3}
            className="w-full resize-none rounded-2xl border border-black/10 bg-paper-50 p-3 text-sm outline-none focus:border-brand"
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
        </>
      )}

      {selectedReaction && (
        <>
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
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDuplicateSelected}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  )
}
