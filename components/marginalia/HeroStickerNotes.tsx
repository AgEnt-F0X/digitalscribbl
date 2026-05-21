/**
 * HeroStickerNotes — shared hero composition primitive for signature pages
 * (Dashboard + Profile + any future surface that frames an avatar with
 * floating "messages from friends" sticker notes).
 *
 * Doc 18 § 8 — Marginalia primitives. The component owns the slot palette,
 * the per-slot positioning + rotation + tone, and the mobile collapse rule
 * (slots 3+ hidden on <md so the avatar doesn't crowd on phones).
 *
 * Reference image (doc 17 round 5): the avatar-view mockup with four
 * sticker notes drifting around the head. This component is what produces
 * those notes on the hero — call it inside a `relative` container that
 * also holds the avatar, then it positions itself absolutely around it.
 */
import type { CSSProperties, ReactNode } from 'react'

/**
 * Sticker palette — four warm-paper tones that read together as a family.
 * Each tone is a paired `bg-*` + `text-*` Tailwind utility string. Keep the
 * palette small so the hero never looks like a colour-wheel; bigger surfaces
 * (the inside-shirt scribble palette) can use the full scribble tones from
 * `lib/constants.ts`.
 */
export const STICKER_TONES = {
  yellow: 'bg-[#fff3bf] text-[#3c3326]',
  pink:   'bg-[#ffe6ef] text-[#b62056]',
  green:  'bg-[#e9f7df] text-[#315a2d]',
  blue:   'bg-[#edf4ff] text-[#17428a]',
} as const
export type StickerTone = keyof typeof STICKER_TONES

export interface HeroNoteSlot {
  top:      string
  left?:    string
  right?:   string
  rotation: number
  tone:     StickerTone
  /** When false, the slot collapses on <md (mobile composition rules). */
  mobile:   boolean
  width:    string
}

/**
 * Default four-slot composition that matches the reference image. Slots 1-2
 * sit near the top corners (visible on mobile); slots 3-4 anchor the lower
 * corners (md+ only) for the desktop "messages drifting all around" look.
 */
export const DEFAULT_HERO_NOTE_SLOTS: readonly HeroNoteSlot[] = [
  { top: '4%',  left:  '2%', rotation: -8,  tone: 'yellow', mobile: true,  width: '150px' },
  { top: '10%', right: '2%', rotation: 7,   tone: 'pink',   mobile: true,  width: '150px' },
  { top: '58%', left:  '0%', rotation: -10, tone: 'green',  mobile: false, width: '160px' },
  { top: '62%', right: '0%', rotation: 9,   tone: 'blue',   mobile: false, width: '160px' },
]

export interface HeroStickerNoteData {
  /** Stable React key — usually a row id from the data source. */
  id:      string
  /** The note text. Renders through the auto-applied .text-handwritten-note. */
  body:    string
  /** Optional decorative emoji prefix. Pass null to skip. */
  emoji?:  string | null
}

interface HeroStickerNoteProps {
  slot:     HeroNoteSlot
  children: ReactNode
}

/**
 * One sticker note, positioned by a slot descriptor. Exposed for hand-placed
 * compositions where the default slot palette doesn't match (e.g. a future
 * group-page hero with five notes in a different arrangement).
 */
export function HeroStickerNote({ slot, children }: HeroStickerNoteProps) {
  const style: CSSProperties = {
    top: slot.top,
    left: slot.left,
    right: slot.right,
    width: slot.width,
    transform: `rotate(${slot.rotation}deg)`,
  }
  return (
    <div
      className={`sticker-note ${STICKER_TONES[slot.tone]} ${slot.mobile ? '' : 'hidden md:block'}`}
      style={style}
    >
      {children}
    </div>
  )
}

interface HeroStickerNotesProps {
  /**
   * The notes to render. The component takes the first `slots.length` items
   * and drops the rest, so callers can pass an oversized array safely.
   */
  notes: readonly HeroStickerNoteData[]
  /**
   * Slot palette. Defaults to the four-slot composition from the reference
   * image; override for a different hero layout.
   */
  slots?: readonly HeroNoteSlot[]
}

/**
 * Renders the hero sticker notes as a positioned cluster. Drop this inside
 * the relatively-positioned avatar container alongside `<AvatarHalo>` and
 * the `<Avatar>` itself.
 */
export function HeroStickerNotes({ notes, slots = DEFAULT_HERO_NOTE_SLOTS }: HeroStickerNotesProps) {
  return (
    <>
      {notes.slice(0, slots.length).map((note, index) => {
        const slot = slots[index]
        if (!slot) return null
        return (
          <HeroStickerNote key={note.id} slot={slot}>
            {note.emoji ? `${note.emoji} ` : null}
            {note.body}
          </HeroStickerNote>
        )
      })}
    </>
  )
}
