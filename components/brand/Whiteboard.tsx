// Whiteboard — the most-repeated brand surface after the avatar.
// Doc 18 § 7. Inline SVG frame + surface, HTML marker text positioned over the
// surface so dynamic content (countdowns, names) reflows naturally.

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type WhiteboardVariant = 'a-frame' | 'wall-mounted' | 'small'
export type WhiteboardMarkerColor = 'blue' | 'black' | 'red' | 'green'
export type WhiteboardRotation = 'left' | 'right' | 'none'

interface WhiteboardProps {
  variant: WhiteboardVariant
  title: string
  subtitle?: string
  markerColor?: WhiteboardMarkerColor
  rotation?: WhiteboardRotation
  className?: string
  /** Replaces the surface text with a hand-designed SVG (frame is preserved). */
  customSvg?: ReactNode
}

// Default marker colour per variant — see doc 18 § 7.
// Dashboard (wall-mounted): blue. Explore (wall-mounted): black.
// Login (a-frame): black. Onboarding (a-frame): blue. Small: blue.
// `wall-mounted` defaults to blue because dashboard is the most common usage;
// explore overrides to black at the call site.
const DEFAULT_MARKER_COLOR: Record<WhiteboardVariant, WhiteboardMarkerColor> = {
  'a-frame':      'black',
  'wall-mounted': 'blue',
  'small':        'blue',
}

const MARKER_CLASS: Record<WhiteboardMarkerColor, string> = {
  blue:  'marker-blue',
  black: 'marker-black',
  red:   'marker-red',
  green: 'marker-green',
}

const MARKER_HEX: Record<WhiteboardMarkerColor, string> = {
  blue:  '#2563EB',
  black: '#1A1208',
  red:   '#D83F6B',
  green: '#5F8B48',
}

const ROTATION_STYLE: Record<WhiteboardRotation, string | undefined> = {
  left:  'rotate(-2deg)',
  right: 'rotate(2deg)',
  none:  undefined,
}

interface VariantSpec {
  aspect: string
  surfacePadding: string
  titleSize: string
  subtitleSize: string
  titleLeading: string
  subtitleLeading: string
  shadow: string
  underlineWidth: number
  underlineStrokeWidth: number
  cornerScrewRadius: number
  frameInsetPct: number
  basePct: number
}

const VARIANT_SPECS: Record<WhiteboardVariant, VariantSpec> = {
  'a-frame': {
    aspect: 'aspect-[2/3]',
    surfacePadding: 'px-6 py-8',
    titleSize: 'text-[24px] sm:text-[28px]',
    subtitleSize: 'text-[16px] sm:text-[18px]',
    titleLeading: 'leading-[1.05]',
    subtitleLeading: 'leading-[1.25]',
    shadow: 'drop-shadow-[0_12px_18px_rgba(80,90,105,0.20)]',
    underlineWidth: 110,
    underlineStrokeWidth: 3,
    cornerScrewRadius: 2.5,
    frameInsetPct: 4,
    basePct: 22,
  },
  'wall-mounted': {
    aspect: 'aspect-[3/2]',
    surfacePadding: 'px-6 py-5',
    titleSize: 'text-[20px] sm:text-[22px]',
    subtitleSize: 'text-[14px] sm:text-[16px]',
    titleLeading: 'leading-[1.1]',
    subtitleLeading: 'leading-[1.3]',
    shadow: 'drop-shadow-[0_6px_10px_rgba(80,90,105,0.16)]',
    underlineWidth: 90,
    underlineStrokeWidth: 2.6,
    cornerScrewRadius: 2.5,
    frameInsetPct: 5,
    basePct: 0,
  },
  'small': {
    aspect: 'aspect-[4/3]',
    surfacePadding: 'px-3 py-2.5',
    titleSize: 'text-[15px] sm:text-[16px]',
    subtitleSize: 'text-[13px] sm:text-[14px]',
    titleLeading: 'leading-[1.1]',
    subtitleLeading: 'leading-[1.3]',
    shadow: '',
    underlineWidth: 60,
    underlineStrokeWidth: 2,
    cornerScrewRadius: 1.5,
    frameInsetPct: 6,
    basePct: 0,
  },
}

export function Whiteboard({
  variant,
  title,
  subtitle,
  markerColor,
  rotation = 'none',
  className,
  customSvg,
}: WhiteboardProps) {
  const spec = VARIANT_SPECS[variant]
  const colorKey = markerColor ?? DEFAULT_MARKER_COLOR[variant]
  const markerClass = MARKER_CLASS[colorKey]
  const markerHex = MARKER_HEX[colorKey]
  const rotateTransform = ROTATION_STYLE[rotation]

  const ariaLabel = subtitle ? `${title}. ${subtitle}` : title
  const showTripod = variant === 'a-frame'

  // Surface lives in the inset area; the frame draws as a layered ring.
  // Heights/widths use percentages so the SVG scales with the container.
  const inset = spec.frameInsetPct
  const surfaceBottom = showTripod ? spec.basePct : 0

  return (
    <figure
      role="img"
      aria-label={ariaLabel}
      className={cn('relative', spec.shadow, className)}
      style={rotateTransform ? { transform: rotateTransform } : undefined}
    >
      <div className={cn('relative w-full', spec.aspect)}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          {/* Outer aluminum frame */}
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height={(100 - surfaceBottom).toString()}
            rx="2"
            ry="2"
            fill="var(--whiteboard-frame)"
            stroke="var(--whiteboard-frame-edge)"
            strokeWidth="0.6"
          />
          {/* Inner shadow ring */}
          <rect
            x={(inset / 2).toString()}
            y={(inset / 2).toString()}
            width={(100 - inset).toString()}
            height={(100 - surfaceBottom - inset).toString()}
            rx="1.5"
            ry="1.5"
            fill="var(--whiteboard-frame-edge)"
            opacity="0.45"
          />
          {/* Off-white surface */}
          <rect
            x={inset.toString()}
            y={inset.toString()}
            width={(100 - inset * 2).toString()}
            height={(100 - surfaceBottom - inset * 2).toString()}
            rx="0.8"
            ry="0.8"
            fill="var(--whiteboard-surface)"
          />
          {/* Erased-content smudge in lower-right */}
          <defs>
            <radialGradient id={`erased-${variant}`} cx="0.72" cy="0.82" r="0.4">
              <stop offset="0%" stopColor="var(--whiteboard-frame-edge)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--whiteboard-frame-edge)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect
            x={inset.toString()}
            y={inset.toString()}
            width={(100 - inset * 2).toString()}
            height={(100 - surfaceBottom - inset * 2).toString()}
            fill={`url(#erased-${variant})`}
          />
          {/* Corner screw dots */}
          {[
            [inset + 1, inset + 1],
            [100 - inset - 1, inset + 1],
            [inset + 1, 100 - surfaceBottom - inset - 1],
            [100 - inset - 1, 100 - surfaceBottom - inset - 1],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx.toString()}
              cy={cy.toString()}
              r={spec.cornerScrewRadius.toString()}
              fill="var(--whiteboard-frame-edge)"
              opacity="0.75"
            />
          ))}
          {/* Highlight along top inner edge */}
          <line
            x1={inset.toString()}
            y1={(inset + 0.5).toString()}
            x2={(100 - inset).toString()}
            y2={(inset + 0.5).toString()}
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="0.4"
          />
          {/* Tripod base (a-frame only) */}
          {showTripod && (
            <g>
              <line
                x1="35"
                y1={(100 - surfaceBottom).toString()}
                x2="22"
                y2="100"
                stroke="var(--whiteboard-frame-edge)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="65"
                y1={(100 - surfaceBottom).toString()}
                x2="78"
                y2="100"
                stroke="var(--whiteboard-frame-edge)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="50"
                y1={(100 - surfaceBottom).toString()}
                x2="50"
                y2={(100 - surfaceBottom + 4).toString()}
                stroke="var(--whiteboard-frame-edge)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>

        {/* Content layer: HTML positioned over the surface area */}
        <div
          className={cn(
            'absolute flex flex-col items-center justify-center text-center',
            spec.surfacePadding,
          )}
          style={{
            top:    `${inset}%`,
            left:   `${inset}%`,
            right:  `${inset}%`,
            bottom: `${inset + surfaceBottom}%`,
          }}
        >
          {customSvg ? (
            <div className="w-full h-full grid place-items-center">{customSvg}</div>
          ) : (
            <>
              <span
                className={cn(
                  'font-marker',
                  markerClass,
                  spec.titleSize,
                  spec.titleLeading,
                )}
              >
                {title}
              </span>
              {subtitle ? (
                <span
                  className={cn(
                    'font-display mt-1.5 opacity-80',
                    markerClass,
                    spec.subtitleSize,
                    spec.subtitleLeading,
                  )}
                >
                  {subtitle}
                </span>
              ) : null}
              {/* Hand-drawn marker underline */}
              <svg
                viewBox={`0 0 ${spec.underlineWidth} 8`}
                width={spec.underlineWidth}
                height="8"
                className="mt-2 opacity-80"
                aria-hidden="true"
              >
                <path
                  d={`M2 5 Q ${spec.underlineWidth * 0.27} 1 ${spec.underlineWidth * 0.5} 4 T ${spec.underlineWidth - 2} 5`}
                  stroke={markerHex}
                  strokeWidth={spec.underlineStrokeWidth.toString()}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </>
          )}
        </div>
      </div>
    </figure>
  )
}

export default Whiteboard
