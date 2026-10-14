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

export function normalizeScribblePoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  }
}
