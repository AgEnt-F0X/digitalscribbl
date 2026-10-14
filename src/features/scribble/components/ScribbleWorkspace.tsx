'use client'

import type { RefObject } from 'react'
import type { DrawingCanvasRef, DrawingTool } from '@/components/scribble/DrawingCanvas'
import type { UserAvatarConfig } from '@/src/features/avatar/types'
import type { CanvasMode, OutsideNote, OutsideStickerReaction, ShirtSide } from '../types'
import CanvasModeToggle from './CanvasModeToggle'
import FlatShirtCanvas from './FlatShirtCanvas'
import OutsideNotesCanvas from './OutsideNotesCanvas'
import ScribbleSideToggle from './ScribbleSideToggle'
import ZoomViewport from './ZoomViewport'

type SelectedOutsideObject =
  | { type: 'outside-note'; id: string }
  | { type: 'outside-reaction'; id: string }
  | null

interface ScribbleWorkspaceProps {
  shirtId: string
  ownerName: string
  activeMode: CanvasMode
  onMode: (mode: CanvasMode) => void
  side: ShirtSide
  onSide: (side: ShirtSide) => void
  drawingRef: RefObject<DrawingCanvasRef>
  drawingTool: DrawingTool
  color: string
  brushSize: number
  opacity: number
  fillShapes: boolean
  fontSize: 'sm' | 'md' | 'lg'
  fontStyle: 'normal' | 'bold' | 'italic'
  draftJson?: object | null
  onStroke: (json: object) => void
  existingScribbles: {
    id: string
    panel: string
    x: number
    y: number
    w: number
    h: number
    canvas_svg: string | null
  }[]
  avatarConfig: UserAvatarConfig
  outsideNotes: OutsideNote[]
  outsideReactions: OutsideStickerReaction[]
  selectedObject: SelectedOutsideObject
  onSelectObject: (object: SelectedOutsideObject) => void
  onUpdateOutsideNote?: (id: string, patch: Partial<OutsideNote>) => void
  onUpdateOutsideReaction?: (id: string, patch: Partial<OutsideStickerReaction>) => void
  zoom: number
  onZoom: (zoom: number) => void
  /**
   * `desktop` shows the full bordered panel with the page heading.
   * `mobile` strips the panel chrome so the canvas can claim the viewport
   * directly and the parent (ScribbleStudio) controls the surrounding chrome.
   */
  variant?: 'desktop' | 'mobile'
}

export default function ScribbleWorkspace({
  shirtId,
  ownerName,
  activeMode,
  onMode,
  side,
  onSide,
  drawingRef,
  drawingTool,
  color,
  brushSize,
  opacity,
  fillShapes,
  fontSize,
  fontStyle,
  draftJson,
  onStroke,
  existingScribbles,
  avatarConfig,
  outsideNotes,
  outsideReactions,
  selectedObject,
  onSelectObject,
  onUpdateOutsideNote,
  onUpdateOutsideReaction,
  zoom,
  onZoom,
  variant = 'desktop',
}: ScribbleWorkspaceProps) {
  const sideScribbles = existingScribbles.filter(scribble => scribble.panel === side)
  const isMobile = variant === 'mobile'

  // Pan/pinch interrupts an in-progress stroke; drawing resumes when the
  // gesture ends. Keeps one-finger-draws / two-fingers-pan honest.
  const handleGestureStart = () => drawingRef.current?.cancelActiveStroke()
  const handleGestureEnd = () => drawingRef.current?.resumeDrawing()

  const canvas = activeMode === 'shirt' ? (
    <FlatShirtCanvas
      key={`${shirtId}-${side}`}
      ref={drawingRef}
      side={side}
      tool={drawingTool}
      color={color}
      brushSize={brushSize}
      opacity={opacity}
      fillShapes={fillShapes}
      fontSize={fontSize}
      fontStyle={fontStyle}
      initialJson={draftJson}
      onStroke={onStroke}
      existingScribbles={sideScribbles}
    />
  ) : (
    <OutsideNotesCanvas
      ownerName={ownerName}
      side={side}
      avatarConfig={avatarConfig}
      scribbles={sideScribbles}
      notes={outsideNotes}
      reactions={outsideReactions}
      selectedObject={selectedObject}
      onSelect={onSelectObject}
      onUpdateNote={onUpdateOutsideNote}
      onUpdateReaction={onUpdateOutsideReaction}
    />
  )

  if (isMobile) {
    return (
      <section className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <CanvasModeToggle mode={activeMode} onMode={onMode} size="sm" />
          <ScribbleSideToggle side={side} onSide={onSide} size="sm" />
        </div>
        {/*
          Canvas is aspect-[2/3]; capping width at 40vh keeps the rendered
          height ≤ 60vh on portrait phones so the bottom sheet always has room
          to peek without overlapping the shirt.
          The ZoomViewport adds pinch + drag interactions on top of the canvas
          without ever touching the Fabric coordinate space underneath.
        */}
        <ZoomViewport
          zoom={zoom}
          onZoom={onZoom}
          onGestureStart={handleGestureStart}
          onGestureEnd={handleGestureEnd}
          className="mx-auto w-full max-w-[40vh]"
        >
          {canvas}
        </ZoomViewport>
      </section>
    )
  }

  return (
    <section className="min-w-0 rounded-[30px] border border-black/10 bg-paper-100/85 p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink-900">{ownerName}&apos;s Scribble Studio</h1>
          <p className="mt-1 text-sm text-ink-500">
            {activeMode === 'shirt'
              ? 'Sign directly on the flat shirt surface.'
              : 'Leave notes and stickers around the profile without touching the shirt.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CanvasModeToggle mode={activeMode} onMode={onMode} />
          <ScribbleSideToggle side={side} onSide={onSide} />
        </div>
      </div>

      <ZoomViewport
        zoom={zoom}
        onZoom={onZoom}
        onGestureStart={handleGestureStart}
        onGestureEnd={handleGestureEnd}
      >
        {canvas}
      </ZoomViewport>
    </section>
  )
}
