import { SHIRT_H, SHIRT_W } from '../constants.ts'
import type { Panel } from '../supabase/types.ts'
import type { ScribbleBox } from './scribbleContract.ts'

export const SHIRT_TEMPLATE_ID = 'farewell-half-sleeve-v1'
export const SHIRT_COORDINATE_SPACE = 'shirt-v1-400x600'

type Point = { x: number; y: number }

export interface ShirtTemplate {
  id: typeof SHIRT_TEMPLATE_ID
  coordinateSpace: typeof SHIRT_COORDINATE_SPACE
  viewBox: [number, number, number, number]
  visiblePath: string
  drawablePath: string
  drawablePolygon: Point[]
  drawableBounds: ScribbleBox
  neckAnchor: Point
  panel: Panel
}

const VIEW_BOX: [number, number, number, number] = [0, 0, SHIRT_W, SHIRT_H]
const NECK_ANCHOR = { x: 200, y: 72 }

const VISIBLE_FRONT_PATH = [
  'M72 32',
  'C92 12 129 2 154 2',
  'L169 58',
  'C181 73 219 73 231 58',
  'L246 2',
  'C271 2 308 12 328 32',
  'L392 126',
  'L356 168',
  'L327 126',
  'L378 586',
  'C312 598 88 598 22 586',
  'L73 126',
  'L44 168',
  'L8 126',
  'Z',
].join(' ')

const VISIBLE_BACK_PATH = [
  'M72 30',
  'C95 12 130 2 154 2',
  'L167 43',
  'C185 58 215 58 233 43',
  'L246 2',
  'C270 2 305 12 328 30',
  'L392 126',
  'L356 168',
  'L327 126',
  'L378 586',
  'C312 598 88 598 22 586',
  'L73 126',
  'L44 168',
  'L8 126',
  'Z',
].join(' ')

const DRAWABLE_POLYGON: Point[] = [
  { x: 82,  y: 206 },
  { x: 136, y: 154 },
  { x: 168, y: 190 },
  { x: 200, y: 200 },
  { x: 232, y: 190 },
  { x: 264, y: 154 },
  { x: 318, y: 206 },
  { x: 340, y: 558 },
  { x: 200, y: 568 },
  { x: 60,  y: 558 },
]

const DRAWABLE_PATH = [
  'M82 206',
  'L136 154',
  'L168 190',
  'C188 204 212 204 232 190',
  'L264 154',
  'L318 206',
  'L340 558',
  'C284 570 116 570 60 558',
  'Z',
].join(' ')

/**
 * Ray-casting "is this point inside the polygon" test. Exported so other
 * surfaces (e.g. the Fabric studio canvas) can snap-clamp spawn coordinates
 * for text/stickers without duplicating the polygon math.
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]
    const pj = polygon[j]
    const intersects = (
      (pi.y > point.y) !== (pj.y > point.y) &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
    )
    if (intersects) inside = !inside
  }
  return inside
}

export function getShirtTemplate(panel: Panel): ShirtTemplate {
  return {
    id: SHIRT_TEMPLATE_ID,
    coordinateSpace: SHIRT_COORDINATE_SPACE,
    viewBox: VIEW_BOX,
    visiblePath: panel === 'back' ? VISIBLE_BACK_PATH : VISIBLE_FRONT_PATH,
    drawablePath: DRAWABLE_PATH,
    drawablePolygon: DRAWABLE_POLYGON,
    drawableBounds: { x: 60, y: 154, w: 280, h: 416 },
    neckAnchor: NECK_ANCHOR,
    panel,
  }
}

export function isFullShirtCanvasBox(box: ScribbleBox): boolean {
  return (
    Math.round(box.x) === 0 &&
    Math.round(box.y) === 0 &&
    Math.round(box.w) === SHIRT_W &&
    Math.round(box.h) === SHIRT_H
  )
}

export function isBoxInsideDrawableRegion(box: ScribbleBox, panel: Panel): boolean {
  const template = getShirtTemplate(panel)
  const x1 = box.x
  const y1 = box.y
  const x2 = box.x + box.w
  const y2 = box.y + box.h
  const points = [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
    { x: box.x + box.w / 2, y: box.y + box.h / 2 },
  ]

  return points.every(point => pointInPolygon(point, template.drawablePolygon))
}

export function fullShirtCanvasBox(): ScribbleBox {
  return { x: 0, y: 0, w: SHIRT_W, h: SHIRT_H }
}
