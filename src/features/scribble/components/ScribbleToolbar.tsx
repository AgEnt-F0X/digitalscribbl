'use client'

import {
  ArrowUpRight,
  Brush,
  Circle as CircleIcon,
  Eraser,
  Highlighter,
  Minus,
  PaintBucket,
  PenLine,
  Pencil,
  Redo2,
  Smile,
  Square,
  StickyNote,
  Type,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CANVAS_COLORS } from '@/lib/constants'
import type { CanvasMode, ScribbleTool } from '../types'
import HandwritingStylePicker from './HandwritingStylePicker'

interface ScribbleToolbarProps {
  activeMode: CanvasMode
  tool: ScribbleTool
  color: string
  brushSize: number
  fontStyleId: string
  highlightEnabled: boolean
  fillShapes: boolean
  recentColors: string[]
  onTool: (tool: ScribbleTool) => void
  onColor: (color: string) => void
  onBrushSize: (size: number) => void
  onFontStyle: (styleId: string) => void
  onHighlight: (enabled: boolean) => void
  onFillShapes: (enabled: boolean) => void
  onUndo: () => void
  onRedo: () => void
  /**
   * `desktop` keeps the classic vertical aside chrome.
   * `mobile` strips the aside chrome so the toolbar fits inside the bottom sheet
   * and lays the tool buttons out in a more thumb-friendly grid.
   */
  variant?: 'desktop' | 'mobile'
}

interface ToolDescriptor {
  id: ScribbleTool
  label: string
  icon: typeof PenLine
  description: string
  shirt: boolean
  outside: boolean
  /**
   * Optional preview painter — drawn into the small swatch on each tool
   * button so the user can see the brush's character at a glance.
   * The viewBox is 56×16 (square button has more room than rectangular).
   */
  preview?: (color: string) => React.ReactNode
}

function previewLine(color: string, opacity: number, strokeWidth: number, cap: 'round' | 'butt' = 'round') {
  return (
    <svg viewBox="0 0 56 14" width="56" height="14" aria-hidden>
      <path
        d="M2 9 C 10 4, 20 12, 28 7 S 46 5, 54 9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap={cap}
        strokeLinejoin="round"
        fill="none"
        opacity={opacity}
      />
    </svg>
  )
}

const BRUSH_TOOLS: ToolDescriptor[] = [
  {
    id: 'pen',
    label: 'Pen',
    icon: PenLine,
    description: 'Pen — clean, opaque stroke. Great for outlines and tight handwriting.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 1, 2.5),
  },
  {
    id: 'pencil',
    label: 'Pencil',
    icon: Pencil,
    description: 'Pencil — slightly grainy, softer feel for sketchy strokes.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 0.85, 2),
  },
  {
    id: 'marker',
    label: 'Marker',
    icon: PenLine,
    description: 'Marker — bold, opaque, rounded ends. Pops on the shirt.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 1, 6.5),
  },
  {
    id: 'highlighter',
    label: 'Highlighter',
    icon: Highlighter,
    description: 'Highlighter — wide semi-transparent stroke that paints over other ink.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 0.32, 10, 'butt'),
  },
  {
    id: 'brush',
    label: 'Brush',
    icon: Brush,
    description: 'Brush — textured mid-opacity stroke for painterly signatures.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 0.92, 5),
  },
]

const ERASER_AND_TEXT: ToolDescriptor[] = [
  {
    id: 'eraser',
    label: 'Eraser',
    icon: Eraser,
    description: 'Eraser — tap a stroke or object to remove it.',
    shirt: true,
    outside: false,
  },
  {
    id: 'text',
    label: 'Text',
    icon: Type,
    description: 'Text — tap on the canvas to add editable handwritten text.',
    shirt: true,
    outside: true,
  },
  {
    id: 'sticky-note',
    label: 'Sticky note',
    icon: StickyNote,
    description: 'Sticky note — yellow paper note pinned outside the shirt.',
    shirt: false,
    outside: true,
  },
  {
    id: 'sticker',
    label: 'Sticker',
    icon: Smile,
    description: 'Sticker — pick a fun icon and drop it on the canvas.',
    shirt: true,
    outside: true,
  },
]

const SHAPE_TOOLS: ToolDescriptor[] = [
  {
    id: 'line',
    label: 'Line',
    icon: Minus,
    description: 'Line — drag to draw a straight line in the current colour.',
    shirt: true,
    outside: false,
  },
  {
    id: 'rect',
    label: 'Rectangle',
    icon: Square,
    description: 'Rectangle — drag to draw a rectangle outline (or fill).',
    shirt: true,
    outside: false,
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: CircleIcon,
    description: 'Circle — drag to draw a circle outline (or fill).',
    shirt: true,
    outside: false,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: ArrowUpRight,
    description: 'Arrow — drag to draw an arrow pointing at the release point.',
    shirt: true,
    outside: false,
  },
]

export default function ScribbleToolbar({
  activeMode,
  tool,
  color,
  brushSize,
  fontStyleId,
  highlightEnabled,
  fillShapes,
  recentColors,
  onTool,
  onColor,
  onBrushSize,
  onFontStyle,
  onHighlight,
  onFillShapes,
  onUndo,
  onRedo,
  variant = 'desktop',
}: ScribbleToolbarProps) {
  const isTextLike = tool === 'text' || tool === 'sticky-note'
  const isShape = tool === 'line' || tool === 'rect' || tool === 'circle' || tool === 'arrow'
  const isMobile = variant === 'mobile'

  function renderToolButton(item: ToolDescriptor, opts: { withPreview?: boolean } = {}) {
    const Icon = item.icon
    const enabled = activeMode === 'shirt' ? item.shirt : item.outside
    const active = tool === item.id

    if (isMobile) {
      return (
        <button
          key={item.id}
          type="button"
          disabled={!enabled}
          onClick={() => onTool(item.id)}
          aria-pressed={active}
          aria-label={item.label}
          title={item.description}
          className={cn(
            'flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[11px] font-semibold transition',
            active
              ? 'border-brand bg-brand-soft text-brand'
              : 'border-black/10 bg-white text-ink-900 hover:bg-black/5',
            !enabled && 'cursor-not-allowed border-transparent bg-black/[0.03] opacity-40 hover:bg-black/[0.03]',
          )}
        >
          <Icon size={18} />
          <span className="leading-tight">{item.label}</span>
        </button>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        disabled={!enabled}
        onClick={() => onTool(item.id)}
        title={item.description}
        className={cn(
          'flex w-full min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition',
          active ? 'bg-brand-soft text-brand' : 'text-ink-900 hover:bg-black/5',
          !enabled && 'cursor-not-allowed opacity-35 hover:bg-transparent',
        )}
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        {opts.withPreview && item.preview && (
          <span className="opacity-90" aria-hidden>
            {item.preview(active ? color : '#2d2923')}
          </span>
        )}
        {active && !opts.withPreview && <span className="h-2 w-2 rounded-full bg-brand" />}
      </button>
    )
  }

  const previewDotPx = Math.min(28, Math.max(4, brushSize * 1.4))

  const body = (
    <>
      {!isMobile && (
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Brushes</p>
      )}
      <div className={isMobile ? 'grid grid-cols-5 gap-1.5' : 'space-y-1'}>
        {BRUSH_TOOLS.map(item => renderToolButton(item, { withPreview: !isMobile }))}
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-3')} />

      {!isMobile && (
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Shapes</p>
      )}
      <div className={isMobile ? 'grid grid-cols-5 gap-1.5' : 'space-y-1'}>
        {SHAPE_TOOLS.map(item => renderToolButton(item))}
        <button
          type="button"
          onClick={() => onFillShapes(!fillShapes)}
          aria-pressed={fillShapes}
          title="Fill shapes — when on, new shapes are filled with the current colour."
          className={cn(
            isMobile
              ? 'flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[11px] font-semibold transition'
              : 'flex w-full min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition',
            fillShapes
              ? 'border-brand bg-brand-soft text-brand'
              : isMobile
                ? 'border-black/10 bg-white text-ink-900 hover:bg-black/5'
                : 'text-ink-900 hover:bg-black/5',
          )}
        >
          <PaintBucket size={isMobile ? 18 : 16} />
          <span className={isMobile ? 'leading-tight' : 'flex-1 text-left'}>{fillShapes ? 'Fill: on' : 'Fill: off'}</span>
        </button>
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-3')} />

      {!isMobile && (
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">More</p>
      )}
      <div className={isMobile ? 'grid grid-cols-5 gap-1.5' : 'space-y-1'}>
        {ERASER_AND_TEXT.map(item => renderToolButton(item))}
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />

      {/* Recent + curated colour swatches. Recent shows the last 6 distinct
          colours the user has picked (state-only, no persistence). */}
      <div>
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Colours</p>
        </div>
        {recentColors.length > 0 && (
          <div className="mb-2 px-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Recent</p>
            <div className="flex flex-wrap gap-1">
              {recentColors.map(item => {
                const active = color === item
                return (
                  <button
                    key={`recent-${item}`}
                    type="button"
                    title={`Recent — ${item}`}
                    aria-label={`Use recent colour ${item}`}
                    aria-pressed={active}
                    onClick={() => onColor(item)}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full transition',
                      active ? 'bg-brand-soft' : 'hover:bg-black/5',
                    )}
                  >
                    <span
                      className={cn(
                        'block h-6 w-6 rounded-full border-2 shadow-sm',
                        active ? 'border-brand' : 'border-white',
                      )}
                      style={{ background: item }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className={isMobile ? 'grid grid-cols-8 gap-1 px-0' : 'grid grid-cols-4 gap-2 px-2'}>
          {CANVAS_COLORS.map(item => {
            const active = color === item
            return (
              <button
                key={item}
                type="button"
                title={`Use colour ${item}`}
                aria-label={`Use colour ${item}`}
                aria-pressed={active}
                onClick={() => onColor(item)}
                className={cn(
                  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition',
                  active ? 'bg-brand-soft' : 'hover:bg-black/5',
                )}
              >
                <span
                  className={cn(
                    'block h-8 w-8 rounded-full border-2 shadow-sm transition',
                    active ? 'scale-110 border-brand' : 'border-white',
                  )}
                  style={{ background: item }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />

      <div className="px-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Stroke</p>
          <span className="text-xs font-semibold text-ink-500">{brushSize}px</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={28}
            value={brushSize}
            onChange={event => onBrushSize(Number(event.target.value))}
            aria-label="Stroke width"
            title={`Stroke width: ${brushSize}px`}
            className="h-6 flex-1 accent-brand"
          />
          {/* Live preview circle whose size matches the current brush width
              (clamped to the inspector column to avoid eating layout). */}
          <span
            aria-hidden
            className="inline-block shrink-0 rounded-full border border-black/10 shadow-sm"
            style={{
              width: `${previewDotPx}px`,
              height: `${previewDotPx}px`,
              backgroundColor: color,
              opacity: tool === 'highlighter' ? 0.4 : tool === 'pencil' ? 0.85 : 1,
            }}
          />
        </div>
      </div>

      {(isTextLike || isShape) && (
        <>
          <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />
          {isTextLike && (
            <>
              <HandwritingStylePicker value={fontStyleId} onChange={onFontStyle} variant={isMobile ? 'grid' : 'stack'} />
              <button
                type="button"
                onClick={() => onHighlight(!highlightEnabled)}
                aria-pressed={highlightEnabled}
                title={highlightEnabled ? 'Disable text highlight' : 'Highlight new text in soft yellow'}
                className={cn(
                  'mt-3 flex w-full min-h-11 items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                  highlightEnabled ? 'border-[#f2c84b] bg-[#fff4b8]' : 'border-black/10 bg-white hover:bg-black/5',
                )}
              >
                Highlight note
                <span className="block h-4 w-8 rounded-full bg-white shadow-inner">
                  <span className={cn('block h-4 w-4 rounded-full bg-[#f2c84b] transition', highlightEnabled && 'translate-x-4')} />
                </span>
              </button>
            </>
          )}
          {isShape && (
            <p className="px-2 text-xs text-ink-500">
              Tap-and-drag on the shirt to draw {tool === 'arrow' ? 'an arrow' : `a ${tool}`}. Toggle Fill above to switch between outline and solid.
            </p>
          )}
        </>
      )}

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onUndo}
          aria-label="Undo"
          title="Undo last stroke"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          <Undo2 size={16} />
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          aria-label="Redo"
          title="Redo last undone stroke"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          <Redo2 size={16} />
          Redo
        </button>
      </div>
    </>
  )

  return isMobile
    ? <div className="space-y-3">{body}</div>
    : <aside className="sketch-panel p-3">{body}</aside>
}
