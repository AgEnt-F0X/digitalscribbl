'use client'

import { forwardRef } from 'react'
import DrawingCanvas, { type DrawingCanvasRef, type DrawingTool } from '@/components/scribble/DrawingCanvas'
import { CANVAS_COLORS, SHIRT_H, SHIRT_W } from '@/lib/constants'
import { getShirtTemplate } from '@/lib/utils/shirtTemplate'
import type { ShirtSide } from '../types'

interface FlatShirtCanvasProps {
  side: ShirtSide
  tool: DrawingTool
  color: string
  brushSize: number
  opacity: number
  fillShapes: boolean
  fontSize: 'sm' | 'md' | 'lg'
  fontStyle: 'normal' | 'bold' | 'italic'
  initialJson?: object | null
  onStroke: (json: object) => void
  existingScribbles?: {
    id: string
    x: number
    y: number
    w: number
    h: number
    canvas_svg: string | null
  }[]
}

const FlatShirtCanvas = forwardRef<DrawingCanvasRef, FlatShirtCanvasProps>(function FlatShirtCanvas({
  side,
  tool,
  color,
  brushSize,
  opacity,
  fillShapes,
  fontSize,
  fontStyle,
  initialJson,
  onStroke,
  existingScribbles = [],
}, ref) {
  const template = getShirtTemplate(side)
  const clipId = `flat-shirt-${side}-clip`
  const threadId = `flat-shirt-${side}-thread`

  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-[620px] rounded-[30px] border border-black/10 bg-paper-300 p-4 shadow-paper-deep">
      <svg className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]" viewBox="0 0 400 600" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={template.drawablePath} />
          </clipPath>
          <pattern id={threadId} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 0H10M0 0V10" stroke="rgba(45,41,35,0.045)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <g id="shirt-base" fill="#fffdf7" stroke="#2d2923" strokeOpacity="0.2" strokeWidth="2">
          <path d={template.visiblePath} />
        </g>
        <path id="shirt-drawable" d={template.drawablePath} fill={`url(#${threadId})`} clipPath={`url(#${clipId})`} />
      </svg>

      <div className="absolute inset-4">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 600" aria-hidden>
          <foreignObject x="0" y="0" width="400" height="600" clipPath={`url(#${clipId})`}>
            <div className="relative h-full w-full">
              {existingScribbles.map(scribble => (
                scribble.canvas_svg ? (
                  <span
                    key={scribble.id}
                    className="absolute bg-contain bg-center bg-no-repeat"
                    style={{
                      left: `${(scribble.x / SHIRT_W) * 100}%`,
                      top: `${(scribble.y / SHIRT_H) * 100}%`,
                      width: `${(scribble.w / SHIRT_W) * 100}%`,
                      height: `${(scribble.h / SHIRT_H) * 100}%`,
                      backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(scribble.canvas_svg)}")`,
                    }}
                  />
                ) : null
              ))}
              <DrawingCanvas
                ref={ref}
                w={SHIRT_W}
                h={SHIRT_H}
                tool={tool}
                color={color || CANVAS_COLORS[0]}
                brushSize={brushSize}
                opacity={opacity}
                fillShapes={fillShapes}
                fontSize={fontSize}
                fontStyle={fontStyle}
                initialJson={initialJson}
                onStroke={onStroke}
                clipPath={template.drawablePath}
                drawablePolygon={template.drawablePolygon}
              />
            </div>
          </foreignObject>
        </svg>
      </div>

      <svg className="pointer-events-none absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]" viewBox="0 0 400 600" aria-hidden>
        <g id="shirt-overlay" fill="none" stroke="#2d2923" strokeOpacity="0.34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={side === 'back' ? 'M148 54 C172 75 228 75 252 54' : 'M155 10 L170 66 C184 80 216 80 230 66 L245 10'} />
          <path d="M200 104 L200 570" />
          <path d="M244 214 L304 224 L300 304 L240 296 Z" opacity="0.55" />
          <circle cx="200" cy="162" r="5" />
          <circle cx="200" cy="234" r="5" />
          <circle cx="200" cy="306" r="5" />
          <circle cx="200" cy="378" r="5" />
          <circle cx="200" cy="450" r="5" />
        </g>
      </svg>
    </div>
  )
})

export default FlatShirtCanvas
