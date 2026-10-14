// ── Shirt Occupancy ─────────────────────────────────────────
// Scribbles deliberately overlap — v1 placement ran an AABB collision test,
// v2 dropped it ("Scribbles MAY overlap. No collision blocking is performed.",
// docs/03-product-flows.md) once the studio moved to free-form drawing. The
// hasCollision / getCollisions / clampToCanvas helpers that backed that gate
// are gone. `boxesOverlap` stays because tests/scribble-contract.test.ts uses it
// as the reference implementation proving normalizeScribbleBox's integer
// rounding preserves edge-touching semantics — it documents a contract, it does
// not gate a placement.

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

/** Returns true if two bounding boxes overlap (any edge touching is NOT a collision). */
export function boxesOverlap(a: BBox, b: BBox): boolean {
  return !(
    a.x + a.w <= b.x ||   // a is entirely left of b
    a.x       >= b.x + b.w ||  // a is entirely right of b
    a.y + a.h <= b.y ||   // a is entirely above b
    a.y       >= b.y + b.h    // a is entirely below b
  )
}

/**
 * Calculate how much of the canvas is occupied by bounding boxes.
 * Returns a percentage 0–100.
 */
export function calculateOccupancy(
  boxes: BBox[],
  canvasW: number,
  canvasH: number
): number {
  const totalBoxArea = boxes.reduce((sum, b) => sum + b.w * b.h, 0)
  return Math.min(100, (totalBoxArea / (canvasW * canvasH)) * 100)
}
