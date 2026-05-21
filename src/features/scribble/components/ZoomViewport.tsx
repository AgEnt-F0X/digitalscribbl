'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface ZoomViewportProps {
  /** Current zoom level as a percentage (100 = 1:1). */
  zoom: number
  /** Called when the user pinches on touch devices to live-adjust zoom. */
  onZoom: (zoom: number) => void
  /** Min/max zoom percent for clamping pinch and Fit logic. */
  minZoom?: number
  maxZoom?: number
  className?: string
  children: React.ReactNode
}

/**
 * Renders a viewport that scales its children with `transform: scale()` and
 * provides pan + pinch interactions that DO NOT change the underlying Fabric
 * canvas coordinate space. Drawing always happens in the canonical 400×600
 * shirt space; zoom is a pure presentation-layer transform.
 *
 * Pan rules
 *   • zoom == 100% → drawing works normally; gestures are not intercepted.
 *   • zoom  > 100% → one-finger drag pans, two-finger pinch zooms,
 *                    cursor/mouse drag pans on desktop. Drawing is paused
 *                    while the user is actively zoomed in (we surface a hint
 *                    so the user can Fit before scribbling).
 *
 * The pan offset is clamped so the scaled stage never reveals "void" outside
 * the original viewport bounds, keeping the shirt fully reachable.
 */
export default function ZoomViewport({
  zoom,
  onZoom,
  minZoom = 50,
  maxZoom = 200,
  className,
  children,
}: ZoomViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })

  const panStart = useRef<{ pointerX: number; pointerY: number; panX: number; panY: number } | null>(null)
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  // Mirror "actively interacting" into state so render can flip the transition
  // off mid-gesture (the refs themselves aren't safe to read during render).
  const [isPanning, setIsPanning] = useState(false)
  const [isPinching, setIsPinching] = useState(false)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])

  const scale = zoom / 100
  const isZoomed = zoom > 100

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => setViewportSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update)
      observer.observe(el)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Re-centre when the user zooms back to 100% so they never get "stuck"
  // looking at an off-canvas corner.
  useEffect(() => {
    if (!isZoomed) setPan({ x: 0, y: 0 })
  }, [isZoomed])

  function clampPan(next: { x: number; y: number }) {
    const overflowX = Math.max(0, (viewportSize.w * (scale - 1)) / 2)
    const overflowY = Math.max(0, (viewportSize.h * (scale - 1)) / 2)
    return {
      x: Math.max(-overflowX, Math.min(overflowX, next.x)),
      y: Math.max(-overflowY, Math.min(overflowY, next.y)),
    }
  }

  // Pinch + drag via raw touch listeners so we can preventDefault BEFORE
  // Fabric.js sees the gesture. Without this, two-finger gestures would draw
  // two phantom strokes on the shirt while the user is trying to zoom.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    function distance(a: Touch, b: Touch) {
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length === 2) {
        event.preventDefault()
        pinchStart.current = {
          distance: distance(event.touches[0], event.touches[1]),
          zoom: zoomRef.current,
        }
        panStart.current = null
        setIsPinching(true)
        setIsPanning(false)
        return
      }
      if (event.touches.length === 1 && zoomRef.current > 100) {
        event.preventDefault()
        panStart.current = {
          pointerX: event.touches[0].clientX,
          pointerY: event.touches[0].clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        }
        setIsPanning(true)
      }
    }

    function onTouchMove(event: TouchEvent) {
      if (pinchStart.current && event.touches.length >= 2) {
        event.preventDefault()
        const current = distance(event.touches[0], event.touches[1])
        const ratio = current / pinchStart.current.distance
        const nextZoom = Math.round(pinchStart.current.zoom * ratio)
        onZoom(Math.max(minZoom, Math.min(maxZoom, nextZoom)))
        return
      }
      if (panStart.current && event.touches.length === 1) {
        event.preventDefault()
        const dx = event.touches[0].clientX - panStart.current.pointerX
        const dy = event.touches[0].clientY - panStart.current.pointerY
        setPan(clampPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy }))
      }
    }

    function onTouchEnd(event: TouchEvent) {
      if (event.touches.length < 2) {
        pinchStart.current = null
        setIsPinching(false)
      }
      if (event.touches.length === 0) {
        panStart.current = null
        setIsPanning(false)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
    // We re-read latest zoom/pan via refs inside the listeners — listener
    // identity does not depend on those values, so this effect mounts once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onZoom, minZoom, maxZoom, viewportSize.w, viewportSize.h, scale])

  // Desktop mouse pan: hold pointer on the pan overlay and drag.
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!isZoomed) return
    event.preventDefault()
    panStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    setIsPanning(true)
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isZoomed || !panStart.current) return
    event.preventDefault()
    const dx = event.clientX - panStart.current.pointerX
    const dy = event.clientY - panStart.current.pointerY
    setPan(clampPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy }))
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!panStart.current) return
    panStart.current = null
    setIsPanning(false)
    try {
      ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    } catch {
      // Pointer might already be released; ignore.
    }
  }

  return (
    <div
      ref={viewportRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: isZoomed ? 'none' : 'pinch-zoom',
      }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isPanning || isPinching ? 'none' : 'transform 120ms ease',
          willChange: 'transform',
        }}
      >
        {children}
      </div>

      {isZoomed && (
        <div
          aria-hidden
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // Transparent capture layer that sits over the Fabric canvas while
          // zoomed in. We surrender pointer interactions back to drawing as
          // soon as the user returns to 100% (the overlay unmounts).
          style={{
            position: 'absolute',
            inset: 0,
            cursor: isPanning ? 'grabbing' : 'grab',
            background: 'transparent',
          }}
        />
      )}

      {isZoomed && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-ink-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white shadow"
        >
          Drag to pan · pinch to zoom · drawing paused
        </div>
      )}
    </div>
  )
}
