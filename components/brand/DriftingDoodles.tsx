// DriftingDoodles — page-level marginalia using the existing sticker SVGs.
// Doc 18 § 8 (round-5 primitive). Hand-placed coordinates per density tier
// because random placement reads as chaos; intentional placement reads as energy.

import { cn } from '@/lib/utils/cn'

export type DoodleDensity = 'low' | 'medium' | 'high'

export type DoodleName =
  | 'arrow'
  | 'bear-doodle'
  | 'crown'
  | 'fire'
  | 'flower'
  | 'heart'
  | 'lightning'
  | 'paper-plane'
  | 'smile'
  | 'sparkle'
  | 'speech-bubble'
  | 'star'

interface DriftingDoodlesProps {
  density?: DoodleDensity
  /** Restrict to a subset; otherwise a hand-mixed default palette is used. */
  palette?: readonly DoodleName[]
  className?: string
}

interface DoodleSlot {
  name: DoodleName
  /** Position as inset percentages — top/left or bottom/right. */
  top?:    string
  left?:   string
  right?:  string
  bottom?: string
  size: number
  rotate: number
  opacity: number
}

// Mixed default palette favouring the energy doodles called out in doc 18 § 8.
const DEFAULT_PALETTE: readonly DoodleName[] = [
  'paper-plane',
  'heart',
  'lightning',
  'sparkle',
  'star',
  'smile',
  'flower',
  'crown',
  'arrow',
  'bear-doodle',
]

// Layouts per density. Coordinates are picked to:
//  - hug corners + sides (never directly behind the avatar centre)
//  - mix size tiers (24 / 30 / 40)
//  - pair clockwise with counter-clockwise rotations nearby
// See doc 18 § 8 "placement rules".
const LAYOUTS: Record<DoodleDensity, ReadonlyArray<Omit<DoodleSlot, 'name'>>> = {
  low: [
    { top: '6%',    left: '8%',  size: 32, rotate: -8, opacity: 0.72 },
    { bottom: '10%', right: '10%', size: 28, rotate: 6,  opacity: 0.68 },
    { top: '54%',  right: '4%',  size: 24, rotate: -4, opacity: 0.62 },
  ],
  medium: [
    { top: '4%',    left: '6%',   size: 34, rotate: -10, opacity: 0.74 },
    { top: '14%',   right: '8%',  size: 26, rotate: 8,   opacity: 0.66 },
    { bottom: '12%', left: '10%', size: 30, rotate: 6,   opacity: 0.70 },
    { bottom: '6%',  right: '14%', size: 24, rotate: -6, opacity: 0.64 },
  ],
  high: [
    { top: '4%',    left: '5%',   size: 38, rotate: -12, opacity: 0.78 },
    { top: '10%',   right: '6%',  size: 28, rotate: 8,   opacity: 0.68 },
    { top: '38%',   left: '2%',   size: 24, rotate: -5, opacity: 0.62 },
    { top: '46%',   right: '3%',  size: 26, rotate: 6,   opacity: 0.66 },
    { bottom: '14%', left: '12%',  size: 32, rotate: 10,  opacity: 0.72 },
    { bottom: '4%',  right: '10%', size: 40, rotate: -7, opacity: 0.76 },
  ],
}

function pickName(palette: readonly DoodleName[], index: number): DoodleName {
  return palette[index % palette.length] as DoodleName
}

export function DriftingDoodles({
  density = 'medium',
  palette,
  className,
}: DriftingDoodlesProps) {
  const activePalette = palette && palette.length > 0 ? palette : DEFAULT_PALETTE
  const layout = LAYOUTS[density]

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {layout.map((slot, index) => {
        const name = pickName(activePalette, index)
        return (
          <span
            key={`${name}-${index}`}
            className="absolute select-none"
            style={{
              top:       slot.top,
              left:      slot.left,
              right:     slot.right,
              bottom:    slot.bottom,
              width:     `${slot.size}px`,
              height:    `${slot.size}px`,
              opacity:   slot.opacity,
              transform: `rotate(${slot.rotate}deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/scribbl/stickers/${name}.svg`}
              alt=""
              draggable={false}
              width={slot.size}
              height={slot.size}
              className="w-full h-full"
            />
          </span>
        )
      })}
    </div>
  )
}

export default DriftingDoodles
