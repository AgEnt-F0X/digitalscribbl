'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface ZoomViewportProps {
  /** Current zoom level as a percentage (100 = 1:1). */
  zoom: number
  /** Called when the user pinches (touch) or Ctrl/Cmd-wheels (desktop). */
  onZoom: (zoom: number) => void
  /** Min/max zoom percent for clamping pinch and wheel zoom. */
  minZoom?: number
  maxZoom?: number
  /** Fired when a pan/pinch gesture takes over from drawing (two fingers
   *  down, Space-drag, middle-drag). Use it to cancel an in-progress stroke. */
  onGestureStart?: () => void
  /** Fired when the pan/pinch gesture ends and drawing may resume. */
  onGestureEnd?: () => void
  className?: string
  children: React.ReactNode
}

/**
 * Scales its children with `transform: scale()` and layers pan/zoom gestures
 * on top WITHOUT changing the underlying Fabric coordinate space — drawing
 * always happens in the canonical 400×600 shirt space and works at any zoom
 * (Fabric maps pointers through the element's bounding rect, so the CSS
 * transform is invisible to it).
 *
 * Gesture model (Procreate-style):
 *   • one finger / pen / mouse → draws, at any zoom level
 *   • two fingers              → pan + pinch-zoom (anchored at the midpoint);
 *                                the interrupted stroke is cancelled via
 *                                `onGestureStart`
 *   • Ctrl/Cmd + wheel         → zoom toward the cursor (trackpad pinch too)
 *   • Space-drag / middle-drag → pan on desktop
 *
 * The pan offset is clamped so the scaled stage never reveals "void" outside
 * the original viewport bounds, keeping the shirt fully reachable.
 */
export default function ZoomViewport({
  zoom,
  onZoom,
  minZoom = 50,
  maxZoom = 200,
  onGestureStart,
  onGestureEnd,
  className,
  children,
}: ZoomViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)

  const pinchState = useRef<{ distance: number; mid: { x: number; y: number } } | null>(null)
  const panStart = useRef<{ pointerX: number; pointerY: number; panX: number; panY: number } | null>(null)
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const viewportSizeRef = useRef(viewportSize)
  const onZoomRef = useRef(onZoom)
  const onGestureStartRef = useRef(onGestureStart)
  const onGestureEndRef = useRef(onGestureEnd)
  // Mirror "actively interacting" into state so render can flip the transition
  // off mid-gesture (the refs themselves aren't safe to read during render).
  const [isPanning, setIsPanning] = useState(false)
  const [isPinching, setIsPinching] = useState(false)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { viewportSizeRef.current = viewportSize }, [viewportSize])
  useEffect(() => { onZoomRef.current = onZoom }, [onZoom])
  useEffect(() => { onGestureStartRef.current = onGestureStart }, [onGestureStart])
  useEffect(() => { onGestureEndRef.current = onGestureEnd }, [onGestureEnd])

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

  // Re-centre when the user zooms back to ≤100% so they never get "stuck"
  // looking at an off-canvas corner.
  useEffect(() => {
    if (!isZoomed) setPan({ x: 0, y: 0 })
  }, [isZoomed])

  function clampPanFor(next: { x: number; y: number }, forScale: number) {
    const size = viewportSizeRef.current
    const overflowX = Math.max(0, (size.w * (forScale - 1)) / 2)
    const overflowY = Math.max(0, (size.h * (forScale - 1)) / 2)
    return {
      x: Math.max(-overflowX, Math.min(overflowX, next.x)),
      y: Math.max(-overflowY, Math.min(overflowY, next.y)),
    }
  }

  /**
   * Zoom to `nextZoom` keeping the content under `focal` (viewport-relative
   * px) visually fixed. With transform-origin center:
   *   screen = center + pan + s · (p − center)
   * solving for the new pan that keeps p under the focal point.
   */
  function zoomAtPoint(nextZoomRaw: number, focal: { x: number; y: number }) {
    const nextZoom = Math.max(minZoom, Math.min(maxZoom, Math.round(nextZoomRaw)))
    const currentScale = zoomRef.current / 100
    const nextScale = nextZoom / 100
    const size = viewportSizeRef.current
    const cx = size.w / 2
    const cy = size.h / 2
    const ratio = nextScale / currentScale
    const currentPan = panRef.current
    const nextPan = clampPanFor({
      x: focal.x - cx - ratio * (focal.x - cx - currentPan.x),
      y: focal.y - cy - ratio * (focal.y - cy - currentPan.y),
    }, nextScale)
    setPan(nextPan)
    onZoomRef.current(nextZoom)
  }

  // Touch: two fingers pan + pinch. One-finger touches are never intercepted
  // — they belong to drawing. Raw listeners (passive: false) so we can
  // preventDefault before the browser starts a native scroll/zoom.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    function distance(a: Touch, b: Touch) {
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }

    function midpoint(a: Touch, b: Touch) {
      const rect = el!.getBoundingClientRect()
      return {
        x: (a.clientX + b.clientX) / 2 - rect.left,
        y: (a.clientY + b.clientY) / 2 - rect.top,
      }
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length === 2) {
        event.preventDefault()
        pinchState.current = {
          distance: distance(event.touches[0], event.touches[1]),
          mid: midpoint(event.touches[0], event.touches[1]),
        }
        setIsPinching(true)
        // The first finger may have already started a stroke — cancel it.
        onGestureStartRef.current?.()
      }
    }

    function onTouchMove(event: TouchEvent) {
      const state = pinchState.current
      if (!state || event.touches.length < 2) return
      event.preventDefault()

      const nextDistance = distance(event.touches[0], event.touches[1])
      const nextMid = midpoint(event.touches[0], event.touches[1])
      const currentScale = zoomRef.current / 100
      const nextZoom = Math.max(minZoom, Math.min(maxZoom,
        Math.round(zoomRef.current * (nextDistance / state.distance))))
      const nextScale = nextZoom / 100

      // Anchor the zoom at the previous midpoint, then follow the midpoint's
      // translation — this gives combined pan + pinch in one gesture.
      const size = viewportSizeRef.current
      const cx = size.w / 2
      const cy = size.h / 2
      const ratio = nextScale / currentScale
      const currentPan = panRef.current
      setPan(clampPanFor({
        x: nextMid.x - cx - ratio * (state.mid.x - cx - currentPan.x),
        y: nextMid.y - cy - ratio * (state.mid.y - cy - currentPan.y),
      }, nextScale))
      onZoomRef.current(nextZoom)

      pinchState.current = { distance: nextDistance, mid: nextMid }
    }

    function onTouchEnd(event: TouchEvent) {
      if (pinchState.current && event.touches.length < 2) {
        pinchState.current = null
        setIsPinching(false)
        onGestureEndRef.current?.()
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
    // Latest zoom/pan/sizes are read via refs inside the listeners.
  }, [minZoom, maxZoom])

  // Desktop: Ctrl/Cmd + wheel (incl. trackpad pinch) zooms toward the cursor.
  // Raw listener because React's onWheel is passive and can't preventDefault.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const rect = el!.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * 0.0015)
      zoomAtPoint(zoomRef.current * factor, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // zoomAtPoint reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minZoom, maxZoom])

  // Space toggles pan mode on desktop (ignored while typing).
  useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const element = target as HTMLElement | null
      return Boolean(element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable))
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat || isTyping(event.target)) return
      event.preventDefault()
      setSpaceHeld(true)
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== 'Space') return
      setSpaceHeld(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Desktop pan: capture-phase pointer handlers so Space-drag / middle-drag
  // take the gesture before the drawing canvas sees it. Regular drags pass
  // straight through to Fabric.
  function onPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
    const wantsPan = spaceHeld || event.button === 1
    if (!wantsPan) return
    event.preventDefault()
    event.stopPropagation()
    panStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    setIsPanning(true)
    onGestureStartRef.current?.()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function onPointerMoveCapture(event: React.PointerEvent<HTMLDivElement>) {
    if (!panStart.current) return
    event.preventDefault()
    event.stopPropagation()
    const dx = event.clientX - panStart.current.pointerX
    const dy = event.clientY - panStart.current.pointerY
    setPan(clampPanFor({ x: panStart.current.panX + dx, y: panStart.current.panY + dy }, scale))
  }

  function onPointerUpCapture(event: React.PointerEvent<HTMLDivElement>) {
    if (!panStart.current) return
    event.stopPropagation()
    panStart.current = null
    setIsPanning(false)
    onGestureEndRef.current?.()
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
      onPointerDownCapture={onPointerDownCapture}
      onPointerMoveCapture={onPointerMoveCapture}
      onPointerUpCapture={onPointerUpCapture}
      onPointerCancelCapture={onPointerUpCapture}
      style={{
        position: 'relative',
        overflow: 'hidden',
        // The viewport owns multi-touch; single-finger input flows through
        // to the drawing canvas (which sets its own touch-action: none).
        touchAction: 'none',
        cursor: isPanning ? 'grabbing' : spaceHeld ? 'grab' : undefined,
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
    </div>
  )
}
