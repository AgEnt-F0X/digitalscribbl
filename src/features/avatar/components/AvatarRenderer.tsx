'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils/cn'
import { getShirtTemplate } from '@/lib/utils/shirtTemplate'
import { SHIRT_H, SHIRT_W } from '@/lib/constants'
import { getAvatarPreset } from '../data/avatarPresets'
import { getSkinTone } from '../data/skinTones'
import type { AvatarPresetId, AvatarSide, Transform2D } from '../types'

interface AvatarRendererProps {
  presetId: AvatarPresetId
  side: AvatarSide
  skinToneId: string
  frontFaceImageUrl?: string | null
  backHairImageUrl?: string | null
  frontFaceTransform: Transform2D
  backHairTransform: Transform2D
  scribbles?: {
    id: string
    x: number
    y: number
    w: number
    h: number
    canvas_svg?: string | null
  }[]
  className?: string
}

const FACE_SIZE = 132
const BACK_HAIR_SIZE = 166

function imageTransform(transform: Transform2D, size: number) {
  return [
    `translate(${transform.x} ${transform.y})`,
    `rotate(${transform.rotation})`,
    `scale(${transform.scale})`,
    `translate(${-size / 2} ${-size / 2})`,
  ].join(' ')
}

export default function AvatarRenderer({
  presetId,
  side,
  skinToneId,
  frontFaceImageUrl,
  backHairImageUrl,
  frontFaceTransform,
  backHairTransform,
  scribbles = [],
  className,
}: AvatarRendererProps) {
  const preset = getAvatarPreset(presetId)
  const skinTone = getSkinTone(skinToneId)
  const isBack = side === 'back'
  const shirtTemplate = getShirtTemplate(side === 'back' ? 'back' : 'front')

  return (
    <div
      className={cn('relative aspect-[2/3] w-full max-w-[420px]', className)}
      style={{ '--skin-tone': skinTone.hex } as CSSProperties}
      aria-label={`${preset.name} avatar ${side} view`}
    >
      <svg
        className="h-full w-full overflow-visible drop-shadow-[0_20px_35px_rgba(45,35,22,0.12)]"
        viewBox={preset.viewBox.join(' ')}
        role="img"
      >
        <defs>
          <clipPath id={`avatar-shirt-clip-${preset.id}-${side}`}>
            <path d={shirtTemplate.drawablePath} />
          </clipPath>
          <pattern id={`avatar-thread-${preset.id}-${side}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 0H10M0 0V10" stroke="rgba(45,41,35,0.045)" strokeWidth="0.8" />
          </pattern>
        </defs>

        <g id="skin-fill" className="skin-fill" fill="var(--skin-tone)">
          {isBack ? (
            <path d="M170 132 C185 150 215 150 230 132 L230 190 L170 190 Z" />
          ) : (
            <path d="M174 142 C184 158 216 158 226 142 L226 190 L174 190 Z" />
          )}
          <path d={preset.category === 'feminine'
            ? 'M82 224 C62 282 62 388 88 456 L116 448 C96 372 100 286 124 230 Z'
            : 'M72 222 C48 284 50 396 82 464 L112 454 C92 374 98 286 128 228 Z'} />
          <path d={preset.category === 'feminine'
            ? 'M318 224 C338 282 338 388 312 456 L284 448 C304 372 300 286 276 230 Z'
            : 'M328 222 C352 284 350 396 318 464 L288 454 C308 374 302 286 272 228 Z'} />
        </g>

        {isBack && backHairImageUrl && (
          <image
            href={backHairImageUrl}
            width={BACK_HAIR_SIZE}
            height={BACK_HAIR_SIZE}
            preserveAspectRatio="xMidYMid meet"
            transform={imageTransform(backHairTransform, BACK_HAIR_SIZE)}
          />
        )}

        {isBack && !backHairImageUrl && (
          <path
            d="M148 98 C154 44 246 44 252 98 C256 144 230 168 200 168 C170 168 144 144 148 98 Z"
            fill="#2d241d"
            opacity="0.28"
          />
        )}

        <g id="shirt-base" fill="#fffdf7" stroke="#2d2923" strokeOpacity="0.18" strokeWidth="2">
          <path d="M74 188 L132 134 L166 174 C184 188 216 188 234 174 L268 134 L326 188 L352 574 C288 592 112 592 48 574 Z" />
          <path d="M74 188 L24 278 L70 316 L116 218 Z" />
          <path d="M326 188 L376 278 L330 316 L284 218 Z" />
        </g>
        <path
          id="shirt-drawable"
          d={shirtTemplate.drawablePath}
          fill={`url(#avatar-thread-${preset.id}-${side})`}
          clipPath={`url(#avatar-shirt-clip-${preset.id}-${side})`}
        />

        {scribbles.length > 0 && (
          <foreignObject x="0" y="0" width={SHIRT_W} height={SHIRT_H} clipPath={`url(#avatar-shirt-clip-${preset.id}-${side})`}>
            <div className="relative h-full w-full">
              {scribbles.map(scribble => (
                scribble.canvas_svg ? (
                  <span
                    key={scribble.id}
                    aria-hidden
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
            </div>
          </foreignObject>
        )}

        <g id="shirt-overlay" fill="none" stroke="#2d2923" strokeOpacity="0.34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M132 134 L166 174 L148 210" />
          <path d="M268 134 L234 174 L252 210" />
          <path d="M200 202 L200 566" />
          <path d="M162 148 C178 168 222 168 238 148" />
          <path d="M244 274 L304 282 L300 348 L240 342 Z" opacity="0.55" />
          <circle cx="200" cy="250" r="5" />
          <circle cx="200" cy="320" r="5" />
          <circle cx="200" cy="390" r="5" />
          <circle cx="200" cy="460" r="5" />
        </g>

        {!isBack && frontFaceImageUrl && (
          <image
            href={frontFaceImageUrl}
            width={FACE_SIZE}
            height={FACE_SIZE}
            preserveAspectRatio="xMidYMid slice"
            transform={imageTransform(frontFaceTransform, FACE_SIZE)}
            clipPath="circle(50%)"
          />
        )}

        {!isBack && !frontFaceImageUrl && (
          <g transform="translate(134 26)">
            <circle cx="66" cy="66" r="58" fill="#e8e5de" stroke="white" strokeWidth="6" />
            <circle cx="66" cy="56" r="24" fill="#cfd5df" />
            <path d="M26 120 C36 86 96 86 106 120" fill="#cfd5df" />
          </g>
        )}
      </svg>
    </div>
  )
}
