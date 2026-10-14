'use client'

import {
  useEffect, useRef, useCallback, forwardRef, useImperativeHandle,
} from 'react'
import {
  TOOL_PEN, TOOL_PENCIL, TOOL_MARKER, TOOL_HIGHLIGHTER, TOOL_BRUSH,
  TOOL_TEXT, TOOL_LINE, TOOL_CIRCLE, TOOL_RECT, TOOL_ARROW,
  TOOL_ERASER, TOOL_SELECT, MAX_UNDO_STEPS,
} from '@/lib/constants'
import { hasDrawableFabricJson } from '@/lib/utils/scribbleContract'
import { pointInPolygon, type ShirtTemplate } from '@/lib/utils/shirtTemplate'
import type { StrokeEvent } from '@/lib/hooks/useShirtChannel'
import type { ScribbleBox } from '@/lib/utils/scribbleContract'

export type DrawingTool =
  | typeof TOOL_PEN | typeof TOOL_PENCIL | typeof TOOL_MARKER
  | typeof TOOL_HIGHLIGHTER | typeof TOOL_BRUSH | typeof TOOL_TEXT
  | typeof TOOL_LINE | typeof TOOL_CIRCLE | typeof TOOL_RECT
  | typeof TOOL_ARROW | typeof TOOL_ERASER | typeof TOOL_SELECT

const FREEHAND_BRUSHES = new Set<DrawingTool>([
  TOOL_PEN, TOOL_PENCIL, TOOL_MARKER, TOOL_HIGHLIGHTER, TOOL_BRUSH,
])

export interface DrawingCanvasRef {
  exportSvg(): string
  exportPng(): Promise<string>
  exportJson(): object
  exportLayer(options?: { fullCanvas?: boolean }): Promise<{ box: ScribbleBox; canvasJson: object; canvasSvg: string } | null>
  addEmoji(emoji: string): void
  addText(text: string, options?: { color?: string; fontSize?: number; fontFamily?: string; fontWeight?: number; backgroundColor?: string }): void
  loadJson(fabricJson: object): void
  isEmpty(): boolean
  undo(): void
  redo(): void
  clear(): void
  /**
   * Abort the stroke/shape currently being drawn (e.g. when a second finger
   * lands and the gesture becomes pan/pinch). Freehand drawing stays
   * suspended until `resumeDrawing()` is called after the gesture ends.
   */
  cancelActiveStroke(): void
  resumeDrawing(): void
  /**
   * Re-style every text-like object on the canvas with the supplied props.
   * Used by Signature mode so the user can flip font / colour / size in the
   * side panel and see the canvas update live without re-typing.
   */
  restyleAllText(options: {
    fill?: string
    fontFamily?: string
    fontWeight?: number
    fontSize?: number
    backgroundColor?: string
  }): void
}

interface DrawingCanvasProps {
  w: number
  h: number
  tool: DrawingTool
  color: string
  brushSize: number
  opacity: number
  fillShapes: boolean
  fontSize: 'sm' | 'md' | 'lg'
  fontStyle: 'normal' | 'bold' | 'italic'
  onStroke: (fabricJson: object) => void
  initialJson?: object | null
  onRemoteStroke?: (handler: (event: StrokeEvent) => void) => void
  clipPath?: string
  /**
   * Optional polygon (in canvas coordinates) used to snap-clamp text/sticker
   * spawn points to the drawable region. When provided alongside `clipPath`
   * it guarantees the visible clipping AND the spawn coordinates agree.
   */
  drawablePolygon?: ShirtTemplate['drawablePolygon']
}

type FabricModule = typeof import('fabric')
type FabricCanvas = import('fabric').Canvas
type FabricObject = import('fabric').Object
type FabricEvent = { e: Event; target?: FabricObject | null; scenePoint?: Point }
type Point = { x: number; y: number }
type LiveShapeKind = typeof TOOL_LINE | typeof TOOL_RECT | typeof TOOL_CIRCLE | typeof TOOL_ARROW
type FabricRect = { left: number; top: number; width: number; height: number }

const FONT_SIZE_MAP = { sm: 14, md: 20, lg: 28 }
const MIN_SHAPE_DRAG = 3
const LAYER_PADDING = 10

// Small hand-drawn eraser glyph used as the eraser-tool cursor. The previous
// `not-allowed` cursor read as "this action is disabled".
const ERASER_CURSOR = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'
  + '<g transform="rotate(-30 12 12)">'
  + '<rect x="4" y="8" width="16" height="9" rx="2.5" fill="white" stroke="black" stroke-width="1.6"/>'
  + '<rect x="4" y="8" width="7" height="9" rx="2.5" fill="black" opacity="0.85"/>'
  + '</g></svg>',
)}") 12 12, cell`

function applyClipPath(canvas: FabricCanvas, mod: FabricModule, clipPath?: string) {
  const clippedCanvas = canvas as FabricCanvas & { clipPath?: FabricObject }
  if (!clipPath) {
    clippedCanvas.clipPath = undefined
    canvas.requestRenderAll()
    return
  }

  const path = new mod.Path(clipPath, {
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
    absolutePositioned: true,
  } as ConstructorParameters<typeof mod.Path>[1]) as FabricObject
  clippedCanvas.clipPath = path
  canvas.requestRenderAll()
}

function getCanvasPoint(canvas: FabricCanvas, event: FabricEvent): Point {
  const pointer = event.scenePoint ?? (canvas as unknown as {
    getScenePoint: (e: Event) => Point
  }).getScenePoint(event.e)
  return { x: pointer.x, y: pointer.y }
}

function setObjectInteractivity(canvas: FabricCanvas, selectable: boolean, evented = selectable) {
  canvas.forEachObject(object => object.set({ selectable, evented }))
}

function clampRect(rect: FabricRect, canvasW: number, canvasH: number): ScribbleBox {
  const rawLeft = Math.max(0, Math.floor(rect.left - LAYER_PADDING))
  const rawTop = Math.max(0, Math.floor(rect.top - LAYER_PADDING))
  const right = Math.min(canvasW, Math.ceil(rect.left + rect.width + LAYER_PADDING))
  const bottom = Math.min(canvasH, Math.ceil(rect.top + rect.height + LAYER_PADDING))
  const w = Math.min(canvasW, Math.max(40, right - rawLeft))
  const h = Math.min(canvasH, Math.max(40, bottom - rawTop))
  return {
    x: Math.max(0, Math.min(canvasW - w, rawLeft)),
    y: Math.max(0, Math.min(canvasH - h, rawTop)),
    w,
    h,
  }
}

function getObjectsBounds(objects: FabricObject[], canvasW: number, canvasH: number): ScribbleBox | null {
  if (objects.length === 0) return null

  let left = Number.POSITIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY

  for (const object of objects) {
    const rect = object.getBoundingRect()
    left = Math.min(left, rect.left)
    top = Math.min(top, rect.top)
    right = Math.max(right, rect.left + rect.width)
    bottom = Math.max(bottom, rect.top + rect.height)
  }

  if (![left, top, right, bottom].every(Number.isFinite)) return null
  return clampRect({ left, top, width: right - left, height: bottom - top }, canvasW, canvasH)
}

/**
 * Find the closest point inside the drawable polygon. We use this to gently
 * snap text/sticker spawn coordinates back inside the shirt when the user
 * taps just outside the clipped region. Iterating polygon edges is cheap for
 * the ~10-vertex shirt polygon and avoids pulling in a heavier geometry lib.
 */
function snapPointInsidePolygon(point: Point, polygon: ShirtTemplate['drawablePolygon']): Point {
  if (pointInPolygon(point, polygon)) return point

  let bestX = point.x
  let bestY = point.y
  let bestDist = Number.POSITIVE_INFINITY

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq))
    const projX = a.x + t * dx
    const projY = a.y + t * dy
    const distSq = (projX - point.x) ** 2 + (projY - point.y) ** 2
    if (distSq < bestDist) {
      bestDist = distSq
      bestX = projX
      bestY = projY
    }
  }

  // Pull the snap point a few px deeper toward the polygon centroid so the
  // spawned object isn't *on* the edge (where Fabric handles would clip).
  let cx = 0
  let cy = 0
  for (const vertex of polygon) {
    cx += vertex.x
    cy += vertex.y
  }
  cx /= polygon.length
  cy /= polygon.length
  const towardCenterX = cx - bestX
  const towardCenterY = cy - bestY
  const towardLen = Math.hypot(towardCenterX, towardCenterY) || 1
  const inset = Math.min(12, towardLen)
  return {
    x: bestX + (towardCenterX / towardLen) * inset,
    y: bestY + (towardCenterY / towardLen) * inset,
  }
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(function DrawingCanvas(
  { w, h, tool, color, brushSize, opacity, fillShapes, fontSize, fontStyle, onStroke, initialJson, onRemoteStroke, clipPath, drawablePolygon },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const fabricMod = useRef<FabricModule | null>(null)
  // `initialJson` is mount-time-only: consumers remount via `key` when they
  // want a fresh load. Reading it through a ref keeps the (frequently
  // re-created) draft object out of the init effect's dependencies, so a
  // stroke commit no longer disposes and rebuilds the whole Fabric canvas.
  const initialJsonRef = useRef(initialJson)
  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])
  const isPointerDown = useRef(false)
  const liveShape = useRef<{ kind: LiveShapeKind; object: FabricObject; start: Point } | null>(null)
  // Set while a pan/pinch gesture has interrupted a freehand stroke: the
  // next `path:created` (if Fabric still emits one) is discarded.
  const suppressNextPath = useRef(false)
  const originalStrokePropsRef = useRef<Map<any, { stroke: any; strokeWidth: any }>>(new Map())

  const colorRef = useRef(color)
  const opacityRef = useRef(opacity)
  const fillRef = useRef(fillShapes)
  const brushSzRef = useRef(brushSize)
  const toolRef = useRef(tool)
  const onStrokeRef = useRef(onStroke)
  const fontSzRef = useRef(fontSize)
  const fontStRef = useRef(fontStyle)
  const polygonRef = useRef(drawablePolygon)

  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { opacityRef.current = opacity }, [opacity])
  useEffect(() => { fillRef.current = fillShapes }, [fillShapes])
  useEffect(() => { brushSzRef.current = brushSize }, [brushSize])
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { onStrokeRef.current = onStroke }, [onStroke])
  useEffect(() => { fontSzRef.current = fontSize }, [fontSize])
  useEffect(() => { fontStRef.current = fontStyle }, [fontStyle])
  useEffect(() => { polygonRef.current = drawablePolygon }, [drawablePolygon])

  const pushSnapshot = useCallback((canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON())
    const last = undoStack.current[undoStack.current.length - 1]
    if (json === last) return
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO_STEPS - 1)), json]
    redoStack.current = []
  }, [])

  const commitCanvas = useCallback((canvas: FabricCanvas) => {
    pushSnapshot(canvas)
    onStrokeRef.current(canvas.toJSON())
  }, [pushSnapshot])

  const cancelLiveShape = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || !liveShape.current) return
    canvas.remove(liveShape.current.object)
    liveShape.current = null
    isPointerDown.current = false
    canvas.requestRenderAll()
  }, [])

  const eraseTarget = useCallback((canvas: FabricCanvas, event: FabricEvent) => {
    const fallbackTarget = (canvas as unknown as {
      findTarget?: (e: Event, skipGroup?: boolean) => FabricObject | undefined
    }).findTarget?.(event.e, false)
    const target = event.target ?? fallbackTarget
    if (!target) return

    originalStrokePropsRef.current.delete(target)
    canvas.remove(target)
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    commitCanvas(canvas)
  }, [commitCanvas])

  useEffect(() => {
    let canvas: FabricCanvas | null = null
    let disposed = false
    const host = hostRef.current
    if (!host) return

    import('fabric').then(mod => {
      if (!hostRef.current || disposed) return

      // Touch-friendly selection chrome for text/sticker objects: bigger
      // corner hit areas (especially `touchCornerSize`) and visible corners.
      const objectDefaults = (mod as unknown as {
        FabricObject?: { ownDefaults?: Record<string, unknown> }
      }).FabricObject?.ownDefaults
      if (objectDefaults) {
        Object.assign(objectDefaults, {
          cornerSize: 11,
          touchCornerSize: 26,
          transparentCorners: false,
          cornerColor: '#ffffff',
          cornerStrokeColor: '#2d2923',
          borderColor: '#2d2923',
          padding: 4,
        })
      }

      const canvasEl = document.createElement('canvas')
      canvasEl.width = w
      canvasEl.height = h
      canvasEl.style.width = '100%'
      canvasEl.style.height = '100%'
      canvasEl.style.touchAction = 'none'
      hostRef.current.replaceChildren(canvasEl)

      const liveCanvas = new mod.Canvas(canvasEl, {
        width: w,
        height: h,
        backgroundColor: undefined,
        selection: false,
        isDrawingMode: false,
        // Multiply the backing store by devicePixelRatio so strokes stay
        // crisp on phones/retina displays. Coordinates and exports remain in
        // the canonical 400×600 space — only render density changes.
        enableRetinaScaling: true,
        // Let taps land on thin strokes when selecting/erasing.
        targetFindTolerance: 8,
      })

      canvas = liveCanvas
      fabricRef.current = liveCanvas
      fabricMod.current = mod
      liveCanvas.freeDrawingBrush = new mod.PencilBrush(liveCanvas)
      applyClipPath(liveCanvas, mod, clipPath)

      const canvasDom = liveCanvas as unknown as {
        wrapperEl?: HTMLElement
        upperCanvasEl?: HTMLCanvasElement
        lowerCanvasEl?: HTMLCanvasElement
      }
      for (const el of [canvasDom.wrapperEl, canvasDom.upperCanvasEl, canvasDom.lowerCanvasEl]) {
        if (!el) continue
        el.style.width = '100%'
        el.style.height = '100%'
        el.style.touchAction = 'none'
      }

      const handleMouseDown = (event: FabricEvent) => {
        const activeTool = toolRef.current

        if (activeTool === TOOL_ERASER) {
          isPointerDown.current = true
          eraseTarget(liveCanvas, event)
          return
        }

        if (
          FREEHAND_BRUSHES.has(activeTool) ||
          activeTool === TOOL_SELECT
        ) {
          return
        }

        const rawPoint = getCanvasPoint(liveCanvas, event)
        // Snap text/sticker spawn coordinates back inside the drawable polygon
        // so a tap on the shirt's chrome (collar, sleeves) still produces an
        // object that is visible inside the clipped area. Freehand strokes
        // are clipped at the Fabric level via `clipPath`, so this guard only
        // matters for spawn-based primitives.
        const polygon = polygonRef.current
        const point = polygon ? snapPointInsidePolygon(rawPoint, polygon) : rawPoint
        const col = colorRef.current
        const strokeWidth = brushSzRef.current
        const op = opacityRef.current
        const fill = fillRef.current

        if (activeTool === TOOL_TEXT) {
          const text = new mod.IText('Type here', {
            left: point.x,
            top: point.y,
            fontSize: FONT_SIZE_MAP[fontSzRef.current],
            fontWeight: fontStRef.current === 'bold' ? 'bold' : 'normal',
            fontStyle: fontStRef.current === 'italic' ? 'italic' : 'normal',
            fill: col,
            opacity: op,
            editable: true,
            selectable: true,
            evented: true,
          })
          liveCanvas.add(text)
          liveCanvas.setActiveObject(text)
          text.enterEditing()
          text.selectAll()
          commitCanvas(liveCanvas)
          return
        }

        isPointerDown.current = true

        if (activeTool === TOOL_RECT) {
          const shape = new mod.Rect({
            left: point.x,
            top: point.y,
            width: 1,
            height: 1,
            fill: fill ? col : 'transparent',
            stroke: col,
            strokeWidth,
            opacity: op,
            selectable: false,
            evented: false,
          })
          liveCanvas.add(shape)
          liveShape.current = { kind: TOOL_RECT, object: shape, start: point }
        }

        if (activeTool === TOOL_CIRCLE) {
          const shape = new mod.Circle({
            left: point.x,
            top: point.y,
            radius: 1,
            fill: fill ? col : 'transparent',
            stroke: col,
            strokeWidth,
            opacity: op,
            selectable: false,
            evented: false,
          })
          liveCanvas.add(shape)
          liveShape.current = { kind: TOOL_CIRCLE, object: shape, start: point }
        }

        if (activeTool === TOOL_LINE || activeTool === TOOL_ARROW) {
          const shape = new mod.Line([point.x, point.y, point.x, point.y], {
            stroke: col,
            strokeWidth,
            opacity: op,
            selectable: false,
            evented: false,
          })
          liveCanvas.add(shape)
          liveShape.current = { kind: activeTool, object: shape, start: point }
        }
      }

      const handleMouseMove = (event: FabricEvent) => {
        if (toolRef.current === TOOL_ERASER && isPointerDown.current) {
          eraseTarget(liveCanvas, event)
          return
        }

        const current = liveShape.current
        if (!isPointerDown.current || !current) return

        const point = getCanvasPoint(liveCanvas, event)
        const { start, object, kind } = current

        if (kind === TOOL_RECT) {
          object.set({
            width: Math.abs(point.x - start.x),
            height: Math.abs(point.y - start.y),
            left: Math.min(point.x, start.x),
            top: Math.min(point.y, start.y),
          })
        }

        if (kind === TOOL_CIRCLE) {
          const radius = Math.hypot(point.x - start.x, point.y - start.y) / 2
          object.set({
            radius,
            left: (start.x + point.x) / 2 - radius,
            top: (start.y + point.y) / 2 - radius,
          })
        }

        if (kind === TOOL_LINE || kind === TOOL_ARROW) {
          object.set({ x2: point.x, y2: point.y })
        }

        liveCanvas.requestRenderAll()
      }

      const handleMouseUp = (event: FabricEvent) => {
        if (toolRef.current === TOOL_ERASER) {
          isPointerDown.current = false
          return
        }

        const current = liveShape.current
        if (!isPointerDown.current || !current) return

        isPointerDown.current = false
        liveShape.current = null

        const end = getCanvasPoint(liveCanvas, event)
        const { start, object, kind } = current
        const distance = Math.hypot(end.x - start.x, end.y - start.y)

        if (distance < MIN_SHAPE_DRAG) {
          liveCanvas.remove(object)
          liveCanvas.requestRenderAll()
          return
        }

        if (kind === TOOL_ARROW) {
          liveCanvas.remove(object)

          const angle = Math.atan2(end.y - start.y, end.x - start.x)
          const angleDeg = angle * (180 / Math.PI)
          const strokeWidth = brushSzRef.current
          const headSize = Math.max(12, strokeWidth * 4)
          const col = colorRef.current
          const op = opacityRef.current
          const lineEndX = end.x - headSize * 0.7 * Math.cos(angle)
          const lineEndY = end.y - headSize * 0.7 * Math.sin(angle)

          const lineObj = new mod.Line([start.x, start.y, lineEndX, lineEndY], {
            stroke: col,
            strokeWidth,
            selectable: false,
            evented: false,
          })
          const head = new mod.Triangle({
            left: end.x,
            top: end.y,
            width: headSize,
            height: headSize * 1.3,
            fill: col,
            angle: angleDeg + 90,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          })
          const arrow = new mod.Group([lineObj, head], {
            opacity: op,
            selectable: false,
            evented: false,
          })
          liveCanvas.add(arrow)
        }

        liveCanvas.requestRenderAll()
        commitCanvas(liveCanvas)
      }

      const handleMouseOver = (event: FabricEvent) => {
        if (toolRef.current !== TOOL_ERASER) return
        const obj = event.target
        if (!obj) return
        if (!originalStrokePropsRef.current.has(obj)) {
          originalStrokePropsRef.current.set(obj, {
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
          })
          obj.set({
            stroke: '#ef4444',
            strokeWidth: Math.max(2, (obj.strokeWidth as number) || 0),
          })
          liveCanvas.requestRenderAll()
        }
      }

      const handleMouseOut = (event: FabricEvent) => {
        const obj = event.target
        if (!obj) return
        const orig = originalStrokePropsRef.current.get(obj)
        if (orig) {
          obj.set(orig)
          originalStrokePropsRef.current.delete(obj)
          liveCanvas.requestRenderAll()
        }
      }

      liveCanvas.on('mouse:down', handleMouseDown)
      liveCanvas.on('mouse:move', handleMouseMove)
      liveCanvas.on('mouse:up', handleMouseUp)
      liveCanvas.on('mouse:over', handleMouseOver)
      liveCanvas.on('mouse:out', handleMouseOut)

      liveCanvas.on('path:created', ({ path }) => {
        if (suppressNextPath.current) {
          suppressNextPath.current = false
          liveCanvas.remove(path)
          liveCanvas.requestRenderAll()
          return
        }
        const activeTool = toolRef.current
        // Mirror the brush's stroke styling onto the resulting Path so the
        // SVG export (which the rest of the app uses for compositing) shows
        // a marker/highlighter that matches what the user saw while drawing.
        const strokeLineCap: CanvasLineCap = activeTool === TOOL_HIGHLIGHTER ? 'butt' : 'round'
        const strokeLineJoin: CanvasLineJoin = activeTool === TOOL_HIGHLIGHTER ? 'miter' : 'round'
        path.set({
          opacity: opacityRef.current,
          selectable: false,
          evented: false,
          strokeLineCap,
          strokeLineJoin,
        })
        liveCanvas.requestRenderAll()
        commitCanvas(liveCanvas)
      })

      liveCanvas.on('text:editing:exited', () => {
        commitCanvas(liveCanvas)
      })

      liveCanvas.on('object:modified', () => {
        commitCanvas(liveCanvas)
      })

      const mountJson = initialJsonRef.current
      if (mountJson && hasDrawableFabricJson(mountJson)) {
        void liveCanvas.loadFromJSON(mountJson).then(() => {
          liveCanvas.renderAll()
          pushSnapshot(liveCanvas)
          onStrokeRef.current(liveCanvas.toJSON())
        })
      }

      if (onRemoteStroke) {
        onRemoteStroke(({ fabricJson }) => {
          if (disposed) return
          void liveCanvas.loadFromJSON(fabricJson).then(() => liveCanvas.renderAll())
        })
      }

      pushSnapshot(liveCanvas)
    })

    return () => {
      disposed = true
      try {
        canvas?.dispose()
      } catch {
        // Fabric cleanup should not block React unmount.
      }
      canvas = null
      fabricRef.current = null
      fabricMod.current = null
      liveShape.current = null
      isPointerDown.current = false
      host.replaceChildren()
    }
  }, [w, h, onRemoteStroke, commitCanvas, eraseTarget, pushSnapshot, clipPath])

  useEffect(() => {
    const canvas = fabricRef.current
    const mod = fabricMod.current
    if (!canvas || !mod) return

    if (tool !== TOOL_ERASER) {
      originalStrokePropsRef.current.forEach((orig, obj) => {
        try {
          obj.set(orig)
        } catch {}
      })
      originalStrokePropsRef.current.clear()
      canvas.requestRenderAll()
    }

    cancelLiveShape()

    canvas.isDrawingMode = false
    canvas.selection = false
    canvas.defaultCursor = 'crosshair'
    canvas.hoverCursor = 'crosshair'
    setObjectInteractivity(canvas, false)

    if (tool === TOOL_SELECT) {
      canvas.selection = true
      canvas.defaultCursor = 'default'
      canvas.hoverCursor = 'move'
      setObjectInteractivity(canvas, true)
      canvas.renderAll()
      return
    }

    if (tool === TOOL_ERASER) {
      canvas.defaultCursor = ERASER_CURSOR
      canvas.hoverCursor = ERASER_CURSOR
      setObjectInteractivity(canvas, false, true)
      canvas.renderAll()
      return
    }

    if (FREEHAND_BRUSHES.has(tool)) {
      // Each brush is a Fabric `PencilBrush` with a distinct stroke-param
      // profile. We deliberately do NOT swap to SprayBrush — keeping all
      // brushes in PencilBrush keeps `path:created` semantics identical for
      // undo/redo, layer export, and JSON round-tripping. Differences in
      // stroke feel are achieved via width clamps, opacity, decimation and
      // cap/join styles applied to the resulting path on `path:created`.
      const brush = new mod.PencilBrush(canvas)
      brush.color = color
      brush.width = brushSize

      const brushAny = brush as unknown as {
        decimate?: number
        strokeLineCap?: CanvasLineCap
        strokeLineJoin?: CanvasLineJoin
      }

      if (tool === TOOL_PENCIL) {
        brushAny.decimate = 10
        brushAny.strokeLineCap = 'round'
        brushAny.strokeLineJoin = 'round'
      } else if (tool === TOOL_MARKER) {
        brushAny.strokeLineCap = 'round'
        brushAny.strokeLineJoin = 'round'
        brushAny.decimate = 2
      } else if (tool === TOOL_HIGHLIGHTER) {
        brushAny.strokeLineCap = 'butt'
        brushAny.strokeLineJoin = 'miter'
        brushAny.decimate = 2
      } else if (tool === TOOL_BRUSH) {
        brushAny.strokeLineCap = 'round'
        brushAny.strokeLineJoin = 'round'
        brushAny.decimate = 4
      } else {
        // TOOL_PEN — clean default.
        brushAny.strokeLineCap = 'round'
        brushAny.strokeLineJoin = 'round'
      }

      canvas.freeDrawingBrush = brush
      canvas.isDrawingMode = true
      canvas.defaultCursor = 'crosshair'
      canvas.hoverCursor = 'crosshair'
      canvas.renderAll()
      return
    }

    canvas.renderAll()
  }, [tool, color, brushSize, cancelLiveShape])

  useImperativeHandle(ref, () => ({
    exportSvg: () => {
      const canvas = fabricRef.current
      if (!canvas) return ''
      return canvas.toSVG()
    },
    exportPng: async () => {
      const canvas = fabricRef.current
      if (!canvas) return ''
      return canvas.toDataURL({ format: 'png', multiplier: 1 }).split(',')[1]
    },
    exportJson: () => fabricRef.current?.toJSON() ?? {},
    exportLayer: async (options) => {
      const canvas = fabricRef.current
      const mod = fabricMod.current
      if (!canvas || !mod) return null

      if (options?.fullCanvas) {
        return {
          box: { x: 0, y: 0, w, h },
          canvasJson: canvas.toJSON(),
          canvasSvg: canvas.toSVG(),
        }
      }

      const objects = canvas.getObjects().filter(object => {
        const json = object.toObject() as Record<string, unknown>
        return json.visible !== false && json.opacity !== 0
      })
      const box = getObjectsBounds(objects, w, h)
      if (!box) return null

      const canvasEl = document.createElement('canvas')
      canvasEl.width = box.w
      canvasEl.height = box.h
      const layerCanvas = new mod.StaticCanvas(canvasEl, {
        width: box.w,
        height: box.h,
        backgroundColor: undefined,
        enableRetinaScaling: false,
      })

      // Carry the shirt clip into the cropped layer (shifted by the box
      // origin) so edge strokes can't bleed outside the shirt outline when
      // the saved SVG is re-rendered without a clipping container.
      if (clipPath) {
        const layerClip = new mod.Path(clipPath, {
          left: -box.x,
          top: -box.y,
          selectable: false,
          evented: false,
          absolutePositioned: true,
        } as ConstructorParameters<typeof mod.Path>[1]) as FabricObject
        ;(layerCanvas as unknown as { clipPath?: FabricObject }).clipPath = layerClip
      }

      for (const object of objects) {
        const cloned = await object.clone()
        cloned.set({
          left: Number(cloned.left ?? 0) - box.x,
          top: Number(cloned.top ?? 0) - box.y,
        })
        layerCanvas.add(cloned)
      }

      layerCanvas.renderAll()
      const canvasJson = layerCanvas.toJSON()
      const canvasSvg = layerCanvas.toSVG()
      layerCanvas.dispose()
      return { box, canvasJson, canvasSvg }
    },
    addEmoji: (emoji: string) => {
      const canvas = fabricRef.current
      const mod = fabricMod.current
      if (!canvas || !mod) return
      cancelLiveShape()
      const text = new mod.Text(emoji, {
        left: Math.max(18, Math.min(w - 58, w / 2 - 28)),
        top: Math.max(18, Math.min(h - 58, h / 2 - 28)),
        fontSize: 42,
        fill: colorRef.current,
        opacity: opacityRef.current,
        selectable: true,
        evented: true,
      })
      canvas.add(text)
      canvas.setActiveObject(text)
      canvas.requestRenderAll()
      commitCanvas(canvas)
    },
    addText: (text, options) => {
      const canvas = fabricRef.current
      const mod = fabricMod.current
      if (!canvas || !mod || !text.trim()) return
      cancelLiveShape()
      const label = new mod.IText(text.trim(), {
        left: Math.max(18, Math.min(w - 180, w / 2 - 90)),
        top: Math.max(18, Math.min(h - 80, h / 2 - 40)),
        fontFamily: options?.fontFamily,
        fontSize: options?.fontSize ?? FONT_SIZE_MAP[fontSzRef.current],
        fontWeight: options?.fontWeight ?? (fontStRef.current === 'bold' ? 'bold' : 'normal'),
        fontStyle: fontStRef.current === 'italic' ? 'italic' : 'normal',
        fill: options?.color ?? colorRef.current,
        backgroundColor: options?.backgroundColor,
        opacity: opacityRef.current,
        editable: true,
        selectable: true,
        evented: true,
      })
      canvas.add(label)
      canvas.setActiveObject(label)
      canvas.requestRenderAll()
      commitCanvas(canvas)
    },
    loadJson: (fabricJson: object) => {
      const canvas = fabricRef.current
      if (!canvas || !hasDrawableFabricJson(fabricJson)) return
      void canvas.loadFromJSON(fabricJson).then(() => {
        canvas.renderAll()
        pushSnapshot(canvas)
        onStrokeRef.current(canvas.toJSON())
      })
    },
    isEmpty: () => !hasDrawableFabricJson(fabricRef.current?.toJSON() ?? {}),
    undo: () => {
      const canvas = fabricRef.current
      if (!canvas || undoStack.current.length <= 1) return
      const current = undoStack.current.pop()
      if (current) redoStack.current.push(current)
      const previous = undoStack.current[undoStack.current.length - 1]
      void canvas.loadFromJSON(JSON.parse(previous)).then(() => {
        canvas.renderAll()
        onStrokeRef.current(canvas.toJSON())
      })
    },
    redo: () => {
      const canvas = fabricRef.current
      const next = redoStack.current.pop()
      if (!canvas || !next) return
      undoStack.current = [...undoStack.current.slice(-(MAX_UNDO_STEPS - 1)), next]
      void canvas.loadFromJSON(JSON.parse(next)).then(() => {
        canvas.renderAll()
        onStrokeRef.current(canvas.toJSON())
      })
    },
    clear: () => {
      const canvas = fabricRef.current
      if (!canvas) return
      cancelLiveShape()
      canvas.clear()
      canvas.discardActiveObject()
      canvas.renderAll()
      commitCanvas(canvas)
    },
    cancelActiveStroke: () => {
      const canvas = fabricRef.current
      if (!canvas) return
      cancelLiveShape()
      if (canvas.isDrawingMode) {
        // Suspend drawing so the gesture's remaining pointer events don't
        // extend the stroke, and discard whatever the brush has rendered to
        // the preview (top) context so far.
        suppressNextPath.current = true
        canvas.isDrawingMode = false
        const topContext = (canvas as unknown as { contextTop?: CanvasRenderingContext2D }).contextTop
        if (topContext) canvas.clearContext(topContext)
        canvas.requestRenderAll()
      }
    },
    resumeDrawing: () => {
      const canvas = fabricRef.current
      if (!canvas) return
      suppressNextPath.current = false
      if (FREEHAND_BRUSHES.has(toolRef.current)) {
        canvas.isDrawingMode = true
      }
    },
    restyleAllText: (options) => {
      const canvas = fabricRef.current
      if (!canvas) return
      let dirty = false
      for (const object of canvas.getObjects()) {
        const objAny = object as FabricObject & { type?: string }
        const type = String(objAny.type ?? '').toLowerCase()
        if (!type.includes('text')) continue
        const patch: Record<string, unknown> = {}
        if (options.fill !== undefined) patch.fill = options.fill
        if (options.fontFamily !== undefined) patch.fontFamily = options.fontFamily
        if (options.fontWeight !== undefined) patch.fontWeight = options.fontWeight
        if (options.fontSize !== undefined) patch.fontSize = options.fontSize
        if (options.backgroundColor !== undefined) patch.backgroundColor = options.backgroundColor
        object.set(patch)
        dirty = true
      }
      if (dirty) {
        canvas.requestRenderAll()
        commitCanvas(canvas)
      }
    },
  }))

  return (
    <div
      ref={hostRef}
      className="h-full w-full overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  )
})

export default DrawingCanvas
