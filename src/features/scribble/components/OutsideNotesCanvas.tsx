'use client'

import { cn } from '@/lib/utils/cn'
import AvatarRenderer from '@/src/features/avatar/components/AvatarRenderer'
import type { UserAvatarConfig } from '@/src/features/avatar/types'
import type { OutsideNote, OutsideStickerReaction, ShirtSide } from '../types'
import { getHandwritingStyle } from '../data/handwritingStyles'
import { getSticker } from '../data/stickers'

type SelectedOutsideObject =
  | { type: 'outside-note'; id: string }
  | { type: 'outside-reaction'; id: string }
  | null

interface OutsideNotesCanvasProps {
  ownerName: string
  side: ShirtSide
  avatarConfig: UserAvatarConfig
  scribbles: {
    id: string
    x: number
    y: number
    w: number
    h: number
    canvas_svg: string | null
  }[]
  notes: OutsideNote[]
  reactions: OutsideStickerReaction[]
  selectedObject: SelectedOutsideObject
  onSelect: (object: SelectedOutsideObject) => void
}

function positionStyle(transform: OutsideNote['transform']) {
  return {
    left: `${transform.x * 100}%`,
    top: `${transform.y * 100}%`,
    transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scale})`,
  }
}

export default function OutsideNotesCanvas({
  ownerName,
  side,
  avatarConfig,
  scribbles,
  notes,
  reactions,
  selectedObject,
  onSelect,
}: OutsideNotesCanvasProps) {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-[760px] overflow-hidden rounded-[34px] border border-black/10 bg-paper-100 shadow-paper md:aspect-auto md:min-h-[660px]"
      onClick={() => onSelect(null)}
    >
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(45,41,35,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(45,41,35,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute left-4 top-4 rounded-2xl border border-black/10 bg-white/85 px-3 py-2 shadow-sm md:left-8 md:top-8 md:rounded-3xl md:px-4 md:py-3">
        <p className="font-display text-lg font-bold text-ink-900 md:text-2xl">{ownerName}&apos;s memory space</p>
        <p className="hidden text-xs font-semibold text-ink-500 md:block">Notes here stay outside the shirt.</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 top-16 flex items-end justify-center md:top-20">
        <AvatarRenderer
          presetId={avatarConfig.presetId}
          side={side}
          skinToneId={avatarConfig.skinToneId}
          frontFaceImageUrl={avatarConfig.frontFaceImageUrl}
          backHairImageUrl={avatarConfig.backHairImageUrl}
          frontFaceTransform={avatarConfig.frontFaceTransform}
          backHairTransform={avatarConfig.backHairTransform}
          scribbles={scribbles}
          className="max-w-[300px] md:max-w-[430px]"
        />
      </div>

      {notes.map(note => {
        const style = getHandwritingStyle(note.fontStyleId)
        const selected = selectedObject?.type === 'outside-note' && selectedObject.id === note.id
        return (
          <button
            key={note.id}
            type="button"
            onClick={event => {
              event.stopPropagation()
              onSelect({ type: 'outside-note', id: note.id })
            }}
            className={cn(
              'absolute max-w-[150px] rounded-[22px] border p-2.5 text-left shadow-[0_10px_24px_rgba(45,35,22,0.12)] transition md:max-w-[190px] md:p-3',
              note.noteStyle === 'sticky'
                ? 'border-[#e9d37d] bg-[#fff2a8]'
                : note.noteStyle === 'speech-bubble'
                  ? 'border-brand/30 bg-white'
                  : 'border-black/10 bg-paper-50',
              selected && 'ring-4 ring-brand/25',
            )}
            style={positionStyle(note.transform)}
          >
            <span
              className="block leading-snug"
              style={{
                color: note.color,
                fontFamily: style.fontFamily,
                fontSize: style.defaultSize,
                fontWeight: style.defaultWeight,
                backgroundColor: note.highlight?.enabled ? note.highlight.color : undefined,
              }}
            >
              {note.text}
            </span>
          </button>
        )
      })}

      {reactions.map(reaction => {
        const sticker = getSticker(reaction.stickerId)
        const selected = selectedObject?.type === 'outside-reaction' && selectedObject.id === reaction.id
        return (
          <button
            key={reaction.id}
            type="button"
            onClick={event => {
              event.stopPropagation()
              onSelect({ type: 'outside-reaction', id: reaction.id })
            }}
            title={sticker.label}
            aria-label={sticker.label}
            className={cn(
              'absolute flex h-14 w-14 items-center justify-center rounded-3xl border border-black/10 bg-white text-2xl shadow-[0_10px_24px_rgba(45,35,22,0.14)] transition hover:-translate-y-1 md:h-16 md:w-16 md:text-3xl',
              selected && 'ring-4 ring-brand/25',
            )}
            style={positionStyle(reaction.transform)}
          >
            {sticker.symbol}
          </button>
        )
      })}
    </div>
  )
}
