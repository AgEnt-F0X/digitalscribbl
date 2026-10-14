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
  palette?: readonly DoodleName[]
  className?: string
}

interface DoodleSlot {
  name: DoodleName
  top?:    string
  left?:   string
  right?:  string
  bottom?: string
  size: number
  rotate: number
  opacity: number
}

const SVG_MAP: Record<DoodleName, string> = {
  arrow:         '<svg viewBox="0 0 120 120"><path d="M21 70c24-31 52-35 78-20" fill="none" stroke="#2d2923" stroke-width="7" stroke-linecap="round"/><path d="m82 34 20 19-26 9" fill="none" stroke="#2d2923" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'bear-doodle': '<svg viewBox="0 0 120 120"><circle cx="36" cy="35" r="15" fill="#fff7fb" stroke="#6f54df" stroke-width="5"/><circle cx="84" cy="35" r="15" fill="#fff7fb" stroke="#6f54df" stroke-width="5"/><circle cx="60" cy="62" r="39" fill="#fff7fb" stroke="#6f54df" stroke-width="5"/><circle cx="47" cy="57" r="4" fill="#6f54df"/><circle cx="73" cy="57" r="4" fill="#6f54df"/><path d="M53 72c5 6 10 6 15 0" fill="none" stroke="#6f54df" stroke-width="4" stroke-linecap="round"/></svg>',
  crown:         '<svg viewBox="0 0 120 120"><path d="M25 84 20 39l25 20 15-34 15 34 25-20-5 45Z" fill="#fff0a6" stroke="#f5a400" stroke-width="6" stroke-linejoin="round"/><path d="M32 91h56" stroke="#f5a400" stroke-width="6" stroke-linecap="round"/></svg>',
  fire:          '<svg viewBox="0 0 120 120"><path d="M64 105c24-8 36-26 29-48-4-13-14-20-22-31-2 17-10 25-20 34 3-17-3-27-13-38 0 29-22 39-16 62 5 18 22 27 42 21Z" fill="#fff1dd" stroke="#ef5f23" stroke-width="6" stroke-linejoin="round"/><path d="M59 91c10-4 16-13 12-24-5 8-11 12-19 18 2-7 0-13-5-18-2 15 1 24 12 24Z" fill="#ffbd42"/></svg>',
  flower:        '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="13" fill="#fff5a8" stroke="#2f7d48" stroke-width="4"/><g fill="#fce5f0" stroke="#2f7d48" stroke-width="4"><ellipse cx="60" cy="30" rx="13" ry="20"/><ellipse cx="60" cy="90" rx="13" ry="20"/><ellipse cx="30" cy="60" rx="20" ry="13"/><ellipse cx="90" cy="60" rx="20" ry="13"/></g></svg>',
  heart:         '<svg viewBox="0 0 120 120"><path d="M60 96C22 70 20 42 38 31c11-7 22-1 22 10 0-11 12-17 23-10 18 11 15 39-23 65Z" fill="#fff7fb" stroke="#ec4b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 74c8 7 16 12 22 16" fill="none" stroke="#ec4b82" stroke-width="3" stroke-linecap="round" opacity=".35"/></svg>',
  lightning:     '<svg viewBox="0 0 120 120"><path d="M68 12 28 65h28l-8 43 44-58H63Z" fill="#ffe66d" stroke="#f08a00" stroke-width="6" stroke-linejoin="round"/></svg>',
  'paper-plane': '<svg viewBox="0 0 120 120"><path d="M17 58 103 20 78 100 56 68Z" fill="#f8fbff" stroke="#2563eb" stroke-width="6" stroke-linejoin="round"/><path d="M56 68 103 20 42 78" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/></svg>',
  smile:         '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="42" fill="#fff2a8" stroke="#2d2923" stroke-width="5"/><circle cx="45" cy="51" r="5" fill="#2d2923"/><circle cx="75" cy="51" r="5" fill="#2d2923"/><path d="M40 69c11 14 30 14 40 0" fill="none" stroke="#2d2923" stroke-width="5" stroke-linecap="round"/></svg>',
  sparkle:       '<svg viewBox="0 0 120 120"><path d="M60 15c7 25 20 38 45 45-25 7-38 20-45 45-7-25-20-38-45-45 25-7 38-20 45-45Z" fill="#f8f1ff" stroke="#6f54df" stroke-width="6" stroke-linejoin="round"/><path d="M86 16c3 10 8 15 18 18-10 3-15 8-18 18-3-10-8-15-18-18 10-3 15-8 18-18Z" fill="#fff" stroke="#6f54df" stroke-width="3"/></svg>',
  'speech-bubble': '<svg viewBox="0 0 120 120"><path d="M23 27h74c10 0 16 7 16 17v28c0 10-6 17-16 17H61l-25 17 5-17H23c-10 0-16-7-16-17V44c0-10 6-17 16-17Z" fill="#fff" stroke="#6f54df" stroke-width="5" stroke-linejoin="round"/><path d="M32 54h50M32 70h35" stroke="#6f54df" stroke-width="4" stroke-linecap="round"/></svg>',
  star:          '<svg viewBox="0 0 120 120"><path d="m60 18 12 27 30 2-23 20 8 31-27-17-27 17 8-31-23-20 30-2Z" fill="#fff5c7" stroke="#f2a51a" stroke-width="6" stroke-linejoin="round"/><path d="M48 44 60 24l10 22" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/></svg>',
}

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
        const svgContent = SVG_MAP[name]
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
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )
      })}
    </div>
  )
}

export default DriftingDoodles
