'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CANVAS_COLORS,
  SHIRT_H,
  SHIRT_W,
  TOOL_ARROW,
  TOOL_BRUSH,
  TOOL_CIRCLE,
  TOOL_ERASER,
  TOOL_HIGHLIGHTER,
  TOOL_LINE,
  TOOL_MARKER,
  TOOL_PEN,
  TOOL_PENCIL,
  TOOL_RECT,
  TOOL_SELECT,
  TOOL_TEXT,
} from '@/lib/constants'
import type { DrawingCanvasRef, DrawingTool } from '@/components/scribble/DrawingCanvas'
import { hasDrawableFabricJson } from '@/lib/utils/scribbleContract'
import { SHIRT_COORDINATE_SPACE, SHIRT_TEMPLATE_ID } from '@/lib/utils/shirtTemplate'
import type { Panel, ScribbleRow } from '@/lib/supabase/types'
import type { UserAvatarConfig } from '@/src/features/avatar/types'
import {
  SIGNATURE_HANDWRITING_STYLE_ID,
  getHandwritingStyle,
} from '../data/handwritingStyles'
import { getSticker } from '../data/stickers'
import type {
  CanvasMode,
  OutsideNote,
  OutsideStickerReaction,
  ScribbleDraft,
  ScribbleTool,
  ShirtSide,
} from '../types'
import ScribbleBottomBar from './ScribbleBottomBar'
import ScribbleInspectorPanel from './ScribbleInspectorPanel'
import ScribbleMobileSheet, { type MobileSheetTab } from './ScribbleMobileSheet'
import ScribbleToolbar from './ScribbleToolbar'
import ScribbleTopBar from './ScribbleTopBar'
import ScribbleWorkspace from './ScribbleWorkspace'
import SignaturePanel from './SignaturePanel'

interface ScribbleStudioProps {
  shirtId: string
  shirtNumber: number
  ownerId: string
  ownerName: string
  currentUserId: string
  currentUserName: string
  permissionState: 'can' | 'request' | 'locked' | 'own'
  ownerAvatarConfig: UserAvatarConfig
  existingScribbles: Pick<ScribbleRow, 'id' | 'x' | 'y' | 'w' | 'h' | 'canvas_svg' | 'panel'>[]
}

type SelectedOutsideObject =
  | { type: 'outside-note'; id: string }
  | { type: 'outside-reaction'; id: string }
  | null

const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 25
const MAX_RECENT_COLORS = 6

function makeId(prefix: string) {
  return `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36)}`
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Resolve a studio-level ScribbleTool into the Fabric-aware DrawingTool plus
 * a brush profile (opacity + width). The five freehand brushes are mapped to
 * their own DrawingTool variants so DrawingCanvas can configure the live
 * PencilBrush parameters (cap, decimate, etc.). Shape tools are passed
 * through 1:1. The "sticker" / "sticky-note" tools intentionally map to
 * `select` because they don't draw — they open pickers in the inspector.
 */
function toolProfile(tool: ScribbleTool, baseBrushSize: number): {
  drawingTool: DrawingTool
  opacity: number
  brushSize: number
} {
  switch (tool) {
    case 'pen':
      return { drawingTool: TOOL_PEN, opacity: 1, brushSize: baseBrushSize }
    case 'pencil':
      return { drawingTool: TOOL_PENCIL, opacity: 0.85, brushSize: baseBrushSize }
    case 'marker':
      return { drawingTool: TOOL_MARKER, opacity: 1, brushSize: clamp(baseBrushSize * 2.2, 8, 28) }
    case 'highlighter':
      return { drawingTool: TOOL_HIGHLIGHTER, opacity: 0.32, brushSize: clamp(baseBrushSize * 2.6, 12, 32) }
    case 'brush':
      return { drawingTool: TOOL_BRUSH, opacity: 0.95, brushSize: clamp(baseBrushSize * 1.6, 4, 20) }
    case 'eraser':
      return { drawingTool: TOOL_ERASER, opacity: 1, brushSize: baseBrushSize }
    case 'text':
      return { drawingTool: TOOL_TEXT, opacity: 1, brushSize: baseBrushSize }
    case 'sticker':
    case 'sticky-note':
      return { drawingTool: TOOL_SELECT, opacity: 1, brushSize: baseBrushSize }
    case 'line':
      return { drawingTool: TOOL_LINE, opacity: 1, brushSize: baseBrushSize }
    case 'circle':
      return { drawingTool: TOOL_CIRCLE, opacity: 1, brushSize: baseBrushSize }
    case 'rect':
      return { drawingTool: TOOL_RECT, opacity: 1, brushSize: baseBrushSize }
    case 'arrow':
      return { drawingTool: TOOL_ARROW, opacity: 1, brushSize: baseBrushSize }
    case 'select':
      return { drawingTool: TOOL_SELECT, opacity: 1, brushSize: baseBrushSize }
  }
}

function fontSizeBucket(size: number): 'sm' | 'md' | 'lg' {
  if (size <= 20) return 'sm'
  if (size >= 30) return 'lg'
  return 'md'
}

/**
 * Map a tool selection to the sheet tab that is most relevant for it.
 * Helps the mobile sheet feel responsive when the user taps a tool button
 * from outside the sheet (e.g. from the desktop toolbar dimensions). The
 * mobile toolbar itself lives inside the Tools tab so this is a small
 * cross-cutting nicety, not a critical path.
 */
function tabForTool(tool: ScribbleTool): MobileSheetTab | null {
  if (tool === 'text' || tool === 'sticky-note') return 'text'
  if (tool === 'sticker') return 'stickers'
  return null
}

export default function ScribbleStudio({
  shirtId,
  shirtNumber,
  ownerId,
  ownerName,
  currentUserId,
  currentUserName,
  permissionState,
  ownerAvatarConfig,
  existingScribbles,
}: ScribbleStudioProps) {
  const router = useRouter()
  const drawingRef = useRef<DrawingCanvasRef>(null)
  const [activeMode, setActiveMode] = useState<CanvasMode>('shirt')
  const [side, setSide] = useState<ShirtSide>('front')
  const [tool, setTool] = useState<ScribbleTool>('pen')
  const [color, setColorState] = useState<string>(CANVAS_COLORS[0])
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [brushSize, setBrushSize] = useState(4)
  const [fontStyleId, setFontStyleId] = useState('casual')
  const [highlightEnabled, setHighlightEnabled] = useState(false)
  const [fillShapes, setFillShapes] = useState(false)
  const [draftJsonBySide, setDraftJsonBySide] = useState<Record<ShirtSide, object | null>>({ front: null, back: null })
  const [hasDrawingBySide, setHasDrawingBySide] = useState<Record<ShirtSide, boolean>>({ front: false, back: false })
  const [outsideNotes, setOutsideNotes] = useState<OutsideNote[]>([])
  const [outsideReactions, setOutsideReactions] = useState<OutsideStickerReaction[]>([])
  const [selectedObject, setSelectedObject] = useState<SelectedOutsideObject>(null)
  const [textDraft, setTextDraft] = useState('')
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null)
  const [voiceDurationMs, setVoiceDurationMs] = useState<number | null>(null)
  const [voiceUploading, setVoiceUploading] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Signature mode — when active the studio swaps the full toolbar for a
  // compact font/color/size inspector and pre-loads the canvas with a
  // single editable IText. The publish CTA label flips to "Sign" but the
  // underlying publish flow is unchanged (we still call /api/scribble/place
  // with the canvas JSON).
  const [signatureMode, setSignatureMode] = useState(false)
  const [signatureFontStyleId, setSignatureFontStyleId] = useState<string>(SIGNATURE_HANDWRITING_STYLE_ID)
  const [signatureFontSize, setSignatureFontSize] = useState(36)

  // Mobile-only sheet UI state.
  const [mobileTab, setMobileTab] = useState<MobileSheetTab>('tools')
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false)

  const canScribble = permissionState === 'can'
  const hasDrawing = hasDrawingBySide[side]
  const outsideDirty = outsideNotes.length > 0 || outsideReactions.length > 0
  const canPublish = canScribble && (activeMode === 'shirt' ? hasDrawing : outsideDirty)
  const handwriting = getHandwritingStyle(fontStyleId)
  const ownerFirstName = ownerName.split(' ')[0] || ownerName

  const profile = useMemo(() => toolProfile(tool, brushSize), [tool, brushSize])
  const drawingTool = profile.drawingTool
  const computedOpacity = profile.opacity
  const computedBrushSize = profile.brushSize

  const selectedNote = selectedObject?.type === 'outside-note'
    ? outsideNotes.find(note => note.id === selectedObject.id) ?? null
    : null
  const selectedReaction = selectedObject?.type === 'outside-reaction'
    ? outsideReactions.find(reaction => reaction.id === selectedObject.id) ?? null
    : null

  function handleColor(next: string) {
    setColorState(next)
    setRecentColors(current => {
      // Track every distinct colour the user picks so the "Recent" strip
      // can act as a quick recall surface — even when picks come from the
      // curated palette. We dedupe and keep the most recent first.
      const without = current.filter(item => item !== next)
      return [next, ...without].slice(0, MAX_RECENT_COLORS)
    })
  }

  function handleToolChange(next: ScribbleTool) {
    setTool(next)
    const targetTab = tabForTool(next)
    if (targetTab) setMobileTab(targetTab)
  }

  function handleZoom(next: number) {
    setZoom(clamp(Math.round(next), MIN_ZOOM, MAX_ZOOM))
  }

  function fitZoom() {
    setZoom(100)
  }

  function buildDraft(): ScribbleDraft {
    return {
      shirtId,
      activeSide: side,
      activeMode,
      shirtStrokes: [],
      shirtTexts: [],
      shirtStickers: [],
      outsideNotes,
      outsideReactions,
    }
  }

  function saveDraft(showMessage = true) {
    window.localStorage.setItem(`scribbl:studio:${shirtId}`, JSON.stringify(buildDraft()))
    if (showMessage) {
      setMessage(outsideDirty ? 'Draft saved. Outside notes are kept separate from shirt scribbles.' : 'Draft saved.')
      setError(null)
    }
  }

  async function getAudioDurationMs(file: File) {
    const url = URL.createObjectURL(file)
    try {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      const duration = await new Promise<number>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve(audio.duration)
        audio.onerror = () => reject(new Error('Could not read audio metadata'))
        audio.src = url
      })
      return Math.round(duration * 1000)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  async function uploadVoiceFile(file: File) {
    setVoiceUploading(true)
    setError(null)
    setMessage(null)
    try {
      const durationMs = await getAudioDurationMs(file)
      if (durationMs <= 0 || durationMs > 12_000) {
        setError('Voice note must be 12 seconds or less.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('duration_ms', String(durationMs))
      const res = await fetch('/api/scribble/voice', { method: 'POST', body: formData })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error ?? 'Could not upload voice note.')
        return
      }
      setVoiceUrl(body.url)
      setVoiceDurationMs(body.duration_ms)
      setMessage('Voice note attached.')
    } catch {
      setError('Could not read that audio file.')
    } finally {
      setVoiceUploading(false)
    }
  }

  function handleStroke(json: object) {
    const drawable = hasDrawableFabricJson(json)
    setHasDrawingBySide(current => ({ ...current, [side]: drawable }))
    setDraftJsonBySide(current => ({ ...current, [side]: drawable ? json : null }))
    window.localStorage.setItem(`scribbl:flat-editor:${shirtId}:${side}`, JSON.stringify(buildDraft()))
  }

  function insertText(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    if (activeMode === 'shirt') {
      setTool('text')
      drawingRef.current?.addText(trimmed, {
        color,
        fontFamily: handwriting.fontFamily,
        fontSize: handwriting.defaultSize,
        fontWeight: handwriting.defaultWeight,
        backgroundColor: highlightEnabled ? '#fff2a8' : undefined,
      })
      setMessage('Text added to the shirt canvas.')
    } else {
      const note: OutsideNote = {
        id: makeId('outside-note'),
        text: trimmed,
        noteStyle: tool === 'sticky-note' ? 'sticky' : 'speech-bubble',
        fontStyleId,
        color,
        backgroundColor: tool === 'sticky-note' ? '#fff2a8' : '#ffffff',
        highlight: { enabled: highlightEnabled, color: '#fff2a8' },
        transform: {
          x: Math.min(0.82, 0.24 + outsideNotes.length * 0.16),
          y: Math.min(0.82, 0.24 + outsideNotes.length * 0.12),
          scale: 1,
          rotation: outsideNotes.length % 2 === 0 ? -4 : 5,
        },
        createdAt: new Date().toISOString(),
        createdByUserId: currentUserId,
      }
      setOutsideNotes(current => [...current, note])
      setSelectedObject({ type: 'outside-note', id: note.id })
      setMessage('Outside note added around the profile.')
    }

    setTextDraft('')
    setError(null)
  }

  function insertSticker(stickerId: string) {
    const sticker = getSticker(stickerId)
    if (activeMode === 'shirt') {
      setTool('sticker')
      drawingRef.current?.addText(sticker.symbol, {
        color,
        fontFamily: '"Comic Sans MS", cursive',
        fontSize: sticker.id === 'bear-doodle' ? 28 : 44,
      })
      setMessage(`${sticker.label} added to the shirt canvas.`)
    } else {
      const reaction: OutsideStickerReaction = {
        id: makeId('outside-reaction'),
        stickerId,
        transform: {
          x: Math.min(0.86, 0.34 + outsideReactions.length * 0.14),
          y: Math.min(0.78, 0.34 + outsideReactions.length * 0.1),
          scale: 1,
          rotation: outsideReactions.length % 2 === 0 ? 8 : -8,
        },
        createdAt: new Date().toISOString(),
        createdByUserId: currentUserId,
      }
      setOutsideReactions(current => [...current, reaction])
      setSelectedObject({ type: 'outside-reaction', id: reaction.id })
      setMessage(`${sticker.label} added outside the shirt.`)
    }
    setError(null)
  }

  function enterSignatureMode() {
    setActiveMode('shirt')
    setSignatureMode(true)
    // Reset the canvas first so the signature is the only thing on it.
    drawingRef.current?.clear()
    setHasDrawingBySide(current => ({ ...current, [side]: false }))
    setDraftJsonBySide(current => ({ ...current, [side]: null }))

    // Pre-load the canvas with an editable signature using the canonical
    // Caveat handwriting style. Defer one tick so the canvas is fully reset
    // before we add the new object.
    const style = getHandwritingStyle(signatureFontStyleId)
    setTimeout(() => {
      drawingRef.current?.addText(currentUserName, {
        color,
        fontFamily: style.fontFamily,
        fontSize: signatureFontSize,
        fontWeight: style.defaultWeight,
      })
    }, 0)

    setTool('select')
  }

  function exitSignatureMode() {
    setSignatureMode(false)
    drawingRef.current?.clear()
    setHasDrawingBySide(current => ({ ...current, [side]: false }))
    setDraftJsonBySide(current => ({ ...current, [side]: null }))
    setTool('pen')
  }

  async function publishOutsideNotes() {
    if (!outsideDirty) return true

    const notes = [
      ...outsideNotes.map(note => ({
        note_type: note.noteStyle,
        body: note.text,
        emoji: null,
        x: note.transform.x,
        y: note.transform.y,
        rotation: note.transform.rotation,
      })),
      ...outsideReactions.map(reaction => ({
        note_type: 'sticker',
        body: null,
        emoji: reaction.stickerId,
        x: reaction.transform.x,
        y: reaction.transform.y,
        rotation: reaction.transform.rotation,
      })),
    ]

    const res = await fetch('/api/shirt/social-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shirt_id: shirtId, notes }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not save outside notes.')
      return false
    }
    setOutsideNotes([])
    setOutsideReactions([])
    setSelectedObject(null)
    return true
  }

  async function sendScribble() {
    if (activeMode === 'outside-notes') {
      if (!canScribble || !outsideDirty) return
      setIsSaving(true)
      setError(null)
      setMessage(null)
      const saved = await publishOutsideNotes()
      setIsSaving(false)
      if (saved) {
        setMessage(`Outside notes were added around ${ownerName}'s shirt.`)
        router.refresh()
      }
      return
    }

    if (!canScribble || !drawingRef.current || drawingRef.current.isEmpty()) return

    setIsSaving(true)
    setError(null)
    setMessage(null)

    const layer = await drawingRef.current.exportLayer({ fullCanvas: true })
    if (!layer) {
      setIsSaving(false)
      setError('Draw or place something on the shirt before sending.')
      return
    }

    const res = await fetch('/api/scribble/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placement_mode: 'direct',
        template_id: SHIRT_TEMPLATE_ID,
        coordinate_space: SHIRT_COORDINATE_SPACE,
        owner_id: ownerId,
        shirt_number: shirtNumber,
        panel: side as Panel,
        x: 0,
        y: 0,
        w: SHIRT_W,
        h: SHIRT_H,
        canvas_svg: layer.canvasSvg,
        canvas_json: layer.canvasJson,
        voice_url: voiceUrl,
        voice_duration_ms: voiceDurationMs,
      }),
    })

    setIsSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not save scribble.')
      return
    }

    window.localStorage.removeItem(`scribbl:flat-editor:${shirtId}:${side}`)
    setHasDrawingBySide(current => ({ ...current, [side]: false }))
    setDraftJsonBySide(current => ({ ...current, [side]: null }))
    if (outsideDirty) await publishOutsideNotes()
    setVoiceUrl(null)
    setVoiceDurationMs(null)
    setMessage(signatureMode
      ? `Your signature was added to ${ownerName}'s ${side} shirt.`
      : `Your scribble was added to ${ownerName}'s ${side} shirt.`)
    setSignatureMode(false)
    router.refresh()
  }

  function clearDraft() {
    if (activeMode === 'shirt') {
      drawingRef.current?.clear()
      setHasDrawingBySide(current => ({ ...current, [side]: false }))
      setDraftJsonBySide(current => ({ ...current, [side]: null }))
    } else {
      setOutsideNotes([])
      setOutsideReactions([])
      setSelectedObject(null)
    }
    setMessage(null)
    setError(null)
  }

  function updateOutsideNote(id: string, patch: Partial<OutsideNote>) {
    setOutsideNotes(current => current.map(note => note.id === id ? { ...note, ...patch } : note))
  }

  function updateOutsideReaction(id: string, patch: Partial<OutsideStickerReaction>) {
    setOutsideReactions(current => current.map(reaction => reaction.id === id ? { ...reaction, ...patch } : reaction))
  }

  function duplicateSelected() {
    if (selectedObject?.type === 'outside-note') {
      const note = outsideNotes.find(item => item.id === selectedObject.id)
      if (!note) return
      const duplicate = {
        ...note,
        id: makeId('outside-note'),
        transform: { ...note.transform, x: Math.min(0.9, note.transform.x + 0.06), y: Math.min(0.9, note.transform.y + 0.06) },
        createdAt: new Date().toISOString(),
      }
      setOutsideNotes(current => [...current, duplicate])
      setSelectedObject({ type: 'outside-note', id: duplicate.id })
    }
    if (selectedObject?.type === 'outside-reaction') {
      const reaction = outsideReactions.find(item => item.id === selectedObject.id)
      if (!reaction) return
      const duplicate = {
        ...reaction,
        id: makeId('outside-reaction'),
        transform: { ...reaction.transform, x: Math.min(0.9, reaction.transform.x + 0.06), y: Math.min(0.9, reaction.transform.y + 0.06) },
        createdAt: new Date().toISOString(),
      }
      setOutsideReactions(current => [...current, duplicate])
      setSelectedObject({ type: 'outside-reaction', id: duplicate.id })
    }
  }

  function deleteSelected() {
    if (selectedObject?.type === 'outside-note') {
      setOutsideNotes(current => current.filter(note => note.id !== selectedObject.id))
    }
    if (selectedObject?.type === 'outside-reaction') {
      setOutsideReactions(current => current.filter(reaction => reaction.id !== selectedObject.id))
    }
    setSelectedObject(null)
  }

  // Switching modes clears any selection so the sheet collapses cleanly on
  // mobile and the inspector falls back to its default state on desktop.
  useEffect(() => {
    setSelectedObject(null)
  }, [activeMode])

  // Leaving signature mode (or switching mode) snaps the tool back so the
  // user is never stuck in a select-only state.
  useEffect(() => {
    if (!signatureMode && tool === 'select') setTool('pen')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureMode])

  // Live-apply font/color/size changes from the Signature panel to the
  // existing IText on the canvas. We do not re-add the text — the user may
  // already be mid-edit and we want their edits preserved.
  useEffect(() => {
    if (!signatureMode) return
    const style = getHandwritingStyle(signatureFontStyleId)
    drawingRef.current?.restyleAllText({
      fill: color,
      fontFamily: style.fontFamily,
      fontWeight: style.defaultWeight,
      fontSize: signatureFontSize,
    })
  }, [signatureMode, signatureFontStyleId, color, signatureFontSize])

  const showJustSign = activeMode === 'shirt' && !hasDrawing && !signatureMode

  const statusMessage = (
    <div className="min-h-[26px] px-2 text-sm font-semibold">
      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-700">{message}</p>}
      {!error && !message && !canScribble && <p className="text-ink-500">You need permission before publishing a shirt scribble.</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900">
      <ScribbleTopBar
        currentUserName={currentUserName}
        canPublish={canPublish}
        isSaving={isSaving}
        onPreview={() => setMessage('Preview is already visible in the workspace.')}
        onSaveDraft={() => saveDraft()}
        onPublish={sendScribble}
        zoom={zoom}
        onZoom={handleZoom}
        onFitZoom={fitZoom}
        showJustSign={showJustSign}
        signatureModeActive={signatureMode}
        onEnterSignatureMode={enterSignatureMode}
      />

      {/* Mobile layout (<md): canvas pinned to top, bottom sheet over chrome */}
      <main
        className="mx-auto block max-w-[1500px] px-3 pt-3 md:hidden"
        style={{
          // Reserve enough room at the bottom for the collapsed sheet (~92px)
          // and the slim mobile BottomBar (~60px + safe-area) so the canvas
          // never disappears behind them.
          paddingBottom: 'calc(160px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <ScribbleWorkspace
          variant="mobile"
          shirtId={shirtId}
          ownerName={ownerName}
          activeMode={activeMode}
          onMode={setActiveMode}
          side={side}
          onSide={setSide}
          drawingRef={drawingRef}
          drawingTool={drawingTool}
          color={color}
          brushSize={computedBrushSize}
          opacity={computedOpacity}
          fillShapes={fillShapes}
          fontSize={fontSizeBucket(handwriting.defaultSize)}
          fontStyle={handwriting.defaultWeight ? 'bold' : 'normal'}
          draftJson={draftJsonBySide[side]}
          onStroke={handleStroke}
          existingScribbles={existingScribbles}
          avatarConfig={ownerAvatarConfig}
          outsideNotes={outsideNotes}
          outsideReactions={outsideReactions}
          selectedObject={selectedObject}
          onSelectObject={setSelectedObject}
          zoom={zoom}
          onZoom={handleZoom}
        />
        {statusMessage}
      </main>

      {/* Desktop layout (md+): three-column studio. In signature mode the
          left toolbar collapses to the SignaturePanel and the right inspector
          slot stays out of the way so the user can focus on the cursive. */}
      <main className="mx-auto hidden max-w-[1500px] gap-5 px-4 py-5 md:grid lg:grid-cols-[260px_minmax(0,1fr)_340px]">
        {signatureMode ? (
          <SignaturePanel
            fontStyleId={signatureFontStyleId}
            color={color}
            fontSize={signatureFontSize}
            onFontStyle={setSignatureFontStyleId}
            onColor={handleColor}
            onFontSize={setSignatureFontSize}
            onExit={exitSignatureMode}
            onPublish={sendScribble}
            canPublish={canPublish}
            isSaving={isSaving}
          />
        ) : (
          <ScribbleToolbar
            activeMode={activeMode}
            tool={tool}
            color={color}
            brushSize={brushSize}
            fontStyleId={fontStyleId}
            highlightEnabled={highlightEnabled}
            fillShapes={fillShapes}
            recentColors={recentColors}
            onTool={handleToolChange}
            onColor={handleColor}
            onBrushSize={setBrushSize}
            onFontStyle={setFontStyleId}
            onHighlight={setHighlightEnabled}
            onFillShapes={setFillShapes}
            onUndo={() => drawingRef.current?.undo()}
            onRedo={() => drawingRef.current?.redo()}
          />
        )}

        <div className="min-w-0 space-y-3">
          <ScribbleWorkspace
            shirtId={shirtId}
            ownerName={ownerName}
            activeMode={activeMode}
            onMode={setActiveMode}
            side={side}
            onSide={setSide}
            drawingRef={drawingRef}
            drawingTool={drawingTool}
            color={color}
            brushSize={computedBrushSize}
            opacity={computedOpacity}
            fillShapes={fillShapes}
            fontSize={fontSizeBucket(handwriting.defaultSize)}
            fontStyle={handwriting.defaultWeight ? 'bold' : 'normal'}
            draftJson={draftJsonBySide[side]}
            onStroke={handleStroke}
            existingScribbles={existingScribbles}
            avatarConfig={ownerAvatarConfig}
            outsideNotes={outsideNotes}
            outsideReactions={outsideReactions}
            selectedObject={selectedObject}
            onSelectObject={setSelectedObject}
            zoom={zoom}
            onZoom={handleZoom}
          />
          {statusMessage}
        </div>

        {signatureMode ? (
          <aside className="sketch-panel space-y-3 p-4">
            <p className="font-display text-2xl font-bold text-ink-900">Signing for</p>
            <p className="text-xl text-ink-900">{ownerName}</p>
            <p className="text-xs leading-5 text-ink-500">
              Tap the signature text on the shirt to edit it. When you&apos;re happy, hit Sign.
            </p>
            <button
              type="button"
              onClick={exitSignatureMode}
              className="block w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
            >
              Use full canvas instead
            </button>
          </aside>
        ) : (
          <ScribbleInspectorPanel
            ownerName={ownerName}
            activeMode={activeMode}
            permissionState={permissionState}
            signedCount={existingScribbles.length}
            textDraft={textDraft}
            onTextDraft={setTextDraft}
            onInsertText={insertText}
            onSelectSticker={insertSticker}
            voiceUrl={voiceUrl}
            voiceDurationMs={voiceDurationMs}
            voiceUploading={voiceUploading}
            onVoiceFile={uploadVoiceFile}
            onClearVoice={() => {
              setVoiceUrl(null)
              setVoiceDurationMs(null)
            }}
            selectedObject={selectedObject}
            outsideNotes={outsideNotes}
            outsideReactions={outsideReactions}
            onUpdateOutsideNote={updateOutsideNote}
            onUpdateOutsideReaction={updateOutsideReaction}
            onDuplicateSelected={duplicateSelected}
            onDeleteSelected={deleteSelected}
          />
        )}
      </main>

      <ScribbleBottomBar
        activeMode={activeMode}
        permissionState={permissionState}
        zoom={zoom}
        onZoom={handleZoom}
        onFitZoom={fitZoom}
        onClear={clearDraft}
        onPreview={() => setMessage('Preview is already visible in the workspace.')}
        onPublish={sendScribble}
        canPublish={canPublish}
        isSaving={isSaving}
        publishLabel={signatureMode ? 'Sign' : undefined}
      />

      {/* Mobile-only bottom sheet. In signature mode we render a compact
          SignaturePanel in place of the regular tools so the small screen
          doesn't get overwhelmed. */}
      {signatureMode ? (
        <MobileSignatureSheet
          ownerName={ownerName}
          fontStyleId={signatureFontStyleId}
          color={color}
          fontSize={signatureFontSize}
          onFontStyle={setSignatureFontStyleId}
          onColor={handleColor}
          onFontSize={setSignatureFontSize}
          onExit={exitSignatureMode}
          onPublish={sendScribble}
          canPublish={canPublish}
          isSaving={isSaving}
        />
      ) : (
        <ScribbleMobileSheet
          activeMode={activeMode}
          tab={mobileTab}
          onTab={setMobileTab}
          expanded={mobileSheetExpanded}
          onExpanded={setMobileSheetExpanded}
          tool={tool}
          color={color}
          brushSize={brushSize}
          fontStyleId={fontStyleId}
          highlightEnabled={highlightEnabled}
          fillShapes={fillShapes}
          recentColors={recentColors}
          onTool={handleToolChange}
          onColor={handleColor}
          onBrushSize={setBrushSize}
          onFontStyle={setFontStyleId}
          onHighlight={setHighlightEnabled}
          onFillShapes={setFillShapes}
          onUndo={() => drawingRef.current?.undo()}
          onRedo={() => drawingRef.current?.redo()}
          onClearDraft={clearDraft}
          textDraft={textDraft}
          onTextDraft={setTextDraft}
          onInsertText={insertText}
          onSelectSticker={insertSticker}
          voiceUrl={voiceUrl}
          voiceDurationMs={voiceDurationMs}
          voiceUploading={voiceUploading}
          onVoiceFile={uploadVoiceFile}
          onClearVoice={() => {
            setVoiceUrl(null)
            setVoiceDurationMs(null)
          }}
          ownerFirstName={ownerFirstName}
          selectedObject={selectedObject}
          selectedNote={selectedNote}
          selectedReaction={selectedReaction}
          onUpdateOutsideNote={updateOutsideNote}
          onUpdateOutsideReaction={updateOutsideReaction}
          onDuplicateSelected={duplicateSelected}
          onDeleteSelected={deleteSelected}
          onClearSelection={() => setSelectedObject(null)}
        />
      )}
    </div>
  )
}

/**
 * Minimal mobile sheet shown while in Signature mode. We don't share the
 * generic ScribbleMobileSheet here because its tab system is a heavier UX
 * than what signing needs — the user just wants font/color/size + Sign.
 */
function MobileSignatureSheet({
  ownerName,
  fontStyleId,
  color,
  fontSize,
  onFontStyle,
  onColor,
  onFontSize,
  onExit,
  onPublish,
  canPublish,
  isSaving,
}: {
  ownerName: string
  fontStyleId: string
  color: string
  fontSize: number
  onFontStyle: (id: string) => void
  onColor: (color: string) => void
  onFontSize: (size: number) => void
  onExit: () => void
  onPublish: () => void
  canPublish: boolean
  isSaving: boolean
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 md:hidden"
      style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
      aria-hidden={false}
    >
      <div className="pointer-events-auto mx-auto flex max-h-[60vh] w-full flex-col overflow-y-auto rounded-t-[28px] border-t border-x border-black/10 bg-paper-50/[0.98] p-4 shadow-[0_-18px_48px_rgba(45,35,22,0.10)] backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Signing for</p>
        <p className="font-display text-2xl font-bold text-ink-900">{ownerName}</p>
        <div className="mt-3">
          <SignaturePanel
            variant="mobile"
            fontStyleId={fontStyleId}
            color={color}
            fontSize={fontSize}
            onFontStyle={onFontStyle}
            onColor={onColor}
            onFontSize={onFontSize}
            onExit={onExit}
            onPublish={onPublish}
            canPublish={canPublish}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  )
}
