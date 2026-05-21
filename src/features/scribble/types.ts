export type CanvasMode = 'shirt' | 'outside-notes'
export type ShirtSide = 'front' | 'back'

export type ScribbleTool =
  | 'pen'
  | 'pencil'
  | 'marker'
  | 'highlighter'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'sticky-note'
  | 'sticker'
  | 'line'
  | 'circle'
  | 'rect'
  | 'arrow'
  | 'select'

/**
 * The five freehand brushes. Kept as a tuple so the toolbar and the
 * studio's tool→Fabric mapping can share the same source of truth.
 */
export const FREEHAND_BRUSH_TOOLS = ['pen', 'pencil', 'marker', 'highlighter', 'brush'] as const
export const SHAPE_TOOLS = ['line', 'circle', 'rect', 'arrow'] as const
export type FreehandBrushTool = (typeof FREEHAND_BRUSH_TOOLS)[number]
export type ShapeTool = (typeof SHAPE_TOOLS)[number]

export interface NormalizedPoint {
  x: number
  y: number
}

export interface Transform2D {
  x: number
  y: number
  scale: number
  rotation: number
}

export interface ShirtStroke {
  id: string
  side: ShirtSide
  tool: 'pen' | 'pencil' | 'marker' | 'highlighter' | 'eraser'
  color: string
  strokeWidth: number
  points: NormalizedPoint[]
  createdAt: string
  createdByUserId?: string
}

export interface ShirtTextScribble {
  id: string
  side: ShirtSide
  text: string
  fontStyleId: string
  color: string
  fontSize: number
  highlight?: {
    enabled: boolean
    color: string
  }
  transform: Transform2D
  createdAt: string
  createdByUserId?: string
}

export interface ShirtStickerScribble {
  id: string
  side: ShirtSide
  stickerId: string
  transform: Transform2D
  createdAt: string
  createdByUserId?: string
}

export interface OutsideNote {
  id: string
  text: string
  noteStyle: 'plain' | 'sticky' | 'speech-bubble'
  fontStyleId: string
  color: string
  backgroundColor?: string
  highlight?: {
    enabled: boolean
    color: string
  }
  transform: Transform2D
  createdAt: string
  createdByUserId?: string
}

export interface OutsideStickerReaction {
  id: string
  stickerId: string
  transform: Transform2D
  createdAt: string
  createdByUserId?: string
}

export interface ScribbleDraft {
  shirtId: string
  activeSide: ShirtSide
  activeMode: CanvasMode
  shirtStrokes: ShirtStroke[]
  shirtTexts: ShirtTextScribble[]
  shirtStickers: ShirtStickerScribble[]
  outsideNotes: OutsideNote[]
  outsideReactions: OutsideStickerReaction[]
}

export function normalizeScribblePoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  }
}

export function normalizeTransform(transform: Transform2D): Transform2D {
  return {
    x: Math.max(0, Math.min(1, transform.x)),
    y: Math.max(0, Math.min(1, transform.y)),
    scale: Math.max(0.2, Math.min(3, transform.scale)),
    rotation: Math.max(-180, Math.min(180, transform.rotation)),
  }
}
