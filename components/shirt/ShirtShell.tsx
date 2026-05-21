'use client'

import Image from 'next/image'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'
import { getShirtTemplate } from '@/lib/utils/shirtTemplate'
import type { Panel } from '@/lib/supabase/types'

interface ShirtShellProps {
  shirtColor: string
  headUrl?: string | null
  panel: Panel
  className?: string
  children?: React.ReactNode
  showHead?: boolean
  surfaceClassName?: string
}

const HEAD_PLACEHOLDER =
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#e8e5de"/><circle cx="40" cy="33" r="15" fill="#cfd5df"/><path d="M16 74c5-20 43-20 48 0" fill="#cfd5df"/></svg>')}`

function isDark(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return false
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 120
}

export default function ShirtShell({
  shirtColor,
  headUrl,
  panel,
  className,
  children,
  showHead = true,
  surfaceClassName,
}: ShirtShellProps) {
  const rawId = useId()
  const clipId = `shirt-clip-${rawId.replace(/:/g, '')}`
  const template = getShirtTemplate(panel)
  const dark = isDark(shirtColor)
  const isBack = panel === 'back'
  const isSleeves = panel === 'sleeves'
  const shoulderTop = showHead ? '20%' : '5%'
  const sleeveTop = showHead ? '26%' : '12%'
  const torsoTop = showHead ? '25%' : '8%'
  const torsoHeight = showHead ? '70%' : '88%'

  return (
    <div className={cn('relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-black/10 bg-[#ebe4d8]', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.82),rgba(255,255,255,0)_34%),linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0))]" />

      {showHead && (
        <div className="absolute left-1/2 top-[2.5%] z-30 w-[25%] -translate-x-1/2 overflow-hidden rounded-full border-[5px] border-[#f8f5ee] bg-[#e3e5eb] shadow-sm">
          <div className="relative aspect-square w-full">
            <Image
              src={headUrl ?? HEAD_PLACEHOLDER}
              alt="Avatar head"
              fill
              sizes="180px"
              className={cn('object-cover', isBack && 'opacity-70 blur-[0.4px]')}
            />
          </div>
        </div>
      )}

      <div
        className="absolute left-1/2 z-10 h-[18%] w-[86%] -translate-x-1/2 rounded-[999px] border border-black/5"
        style={{
          top: shoulderTop,
          background: shirtColor,
          boxShadow: 'inset 0 -18px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      />
      <div
        className={cn('absolute left-[4%] z-10 h-[17%] w-[30%] rounded-[999px] border border-black/5', isSleeves && 'ring-2 ring-ink-900/15')}
        style={{
          top: sleeveTop,
          background: shirtColor,
          transform: 'rotate(-9deg)',
          boxShadow: 'inset 0 -18px 32px rgba(0,0,0,0.05)',
        }}
      />
      <div
        className={cn('absolute right-[4%] z-10 h-[17%] w-[30%] rounded-[999px] border border-black/5', isSleeves && 'ring-2 ring-ink-900/15')}
        style={{
          top: sleeveTop,
          background: shirtColor,
          transform: 'rotate(9deg)',
          boxShadow: 'inset 0 -18px 32px rgba(0,0,0,0.05)',
        }}
      />

      <div
        className={cn(
          'absolute left-[18%] z-20 w-[64%] overflow-hidden',
          isSleeves && 'opacity-70',
          surfaceClassName,
        )}
        style={{
          top: torsoTop,
          height: torsoHeight,
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full drop-shadow-sm"
          viewBox={template.viewBox.join(' ')}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path d={template.drawablePath} />
            </clipPath>
            <radialGradient id={`${clipId}-shine`} cx="50%" cy="4%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="42%" stopColor="white" stopOpacity="0.12" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <pattern id={`${clipId}-thread`} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M0 0H10M0 0V10" stroke={dark ? 'rgba(255,255,255,0.07)' : 'rgba(45,41,35,0.045)'} strokeWidth="0.8" />
            </pattern>
          </defs>

          <path
            d={template.visiblePath}
            fill={shirtColor}
            stroke={dark ? 'rgba(255,255,255,0.28)' : 'rgba(45,41,35,0.18)'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path d={template.visiblePath} fill={`url(#${clipId}-shine)`} />
          <path d={template.visiblePath} fill={`url(#${clipId}-thread)`} />
          <path
            d={template.drawablePath}
            fill="none"
            stroke={dark ? 'rgba(255,255,255,0.18)' : 'rgba(45,41,35,0.12)'}
            strokeDasharray="5 7"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />

          <foreignObject
            x="0"
            y="0"
            width={template.viewBox[2]}
            height={template.viewBox[3]}
            clipPath={`url(#${clipId})`}
          >
            <div className="relative h-full w-full">
              {children}
            </div>
          </foreignObject>

          <path
            d={panel === 'back' ? 'M148 54 C172 75 228 75 252 54' : 'M155 10 L170 66 C184 80 216 80 230 66 L245 10'}
            fill={dark ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.52)'}
            stroke={dark ? 'rgba(255,255,255,0.22)' : 'rgba(45,41,35,0.12)'}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M200 104 L200 570"
            stroke={dark ? 'rgba(255,255,255,0.22)' : 'rgba(45,41,35,0.12)'}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
          {[0, 1, 2, 3, 4].map(index => (
            <circle
              key={index}
              cx="200"
              cy={162 + index * 72}
              r="5"
              fill={dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)'}
              stroke={dark ? 'rgba(255,255,255,0.34)' : 'rgba(45,41,35,0.22)'}
              strokeWidth="1.4"
            />
          ))}
        </svg>
      </div>

      {isSleeves && (
        <div className="absolute inset-x-6 bottom-4 z-30 rounded-full border border-black/10 bg-white/72 px-3 py-2 text-center text-xs font-medium text-gray-600 shadow-sm backdrop-blur">
          Sleeve mode highlights the side areas, but saves on the same lightweight canvas.
        </div>
      )}
    </div>
  )
}
