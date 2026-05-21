'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AvatarPresetId, AvatarSide, Transform2D } from '../types'
import AvatarRenderer from './AvatarRenderer'

interface FacePlacementEditorProps {
  presetId: AvatarPresetId
  side: AvatarSide
  skinToneId: string
  frontFaceImageUrl?: string | null
  backHairImageUrl?: string | null
  frontFaceTransform: Transform2D
  backHairTransform: Transform2D
  defaultTransform: Transform2D
  onFrontFaceTransform: (transform: Transform2D) => void
  onBackHairTransform: (transform: Transform2D) => void
  className?: string
}

export default function FacePlacementEditor({
  presetId,
  side,
  skinToneId,
  frontFaceImageUrl,
  backHairImageUrl,
  frontFaceTransform,
  backHairTransform,
  defaultTransform,
  onFrontFaceTransform,
  onBackHairTransform,
  className,
}: FacePlacementEditorProps) {
  const activeTransform = side === 'front' ? frontFaceTransform : backHairTransform
  const setActiveTransform = side === 'front' ? onFrontFaceTransform : onBackHairTransform
  const [dragStart, setDragStart] = useState<{ x: number; y: number; tx: number; ty: number } | null>(null)

  function patch(update: Partial<Transform2D>) {
    setActiveTransform({ ...activeTransform, ...update })
  }

  return (
    <div className={cn('grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]', className)}>
      <div
        className="relative rounded-[30px] border border-black/10 bg-[#f7efe2] p-4 shadow-inner"
        style={{ touchAction: 'none' }}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragStart({ x: event.clientX, y: event.clientY, tx: activeTransform.x, ty: activeTransform.y })
        }}
        onPointerMove={event => {
          if (!dragStart) return
          patch({
            x: dragStart.tx + (event.clientX - dragStart.x) * 0.9,
            y: dragStart.ty + (event.clientY - dragStart.y) * 0.9,
          })
        }}
        onPointerUp={() => setDragStart(null)}
        onPointerCancel={() => setDragStart(null)}
      >
        <AvatarRenderer
          presetId={presetId}
          side={side}
          skinToneId={skinToneId}
          frontFaceImageUrl={frontFaceImageUrl}
          backHairImageUrl={backHairImageUrl}
          frontFaceTransform={frontFaceTransform}
          backHairTransform={backHairTransform}
          className="mx-auto"
        />
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs text-gray-500 shadow-sm">
          Drag on the preview to move the {side === 'front' ? 'face' : 'back hair'}.
        </p>
      </div>

      <div className="space-y-4 rounded-[24px] border border-black/10 bg-white/75 p-4 shadow-sm">
        <Control label="Scale" value={activeTransform.scale} min={0.45} max={2.2} step={0.02} onChange={value => patch({ scale: value })} />
        <Control label="Rotate" value={activeTransform.rotation} min={-12} max={12} step={0.5} onChange={value => patch({ rotation: value })} />
        <Control label="Horizontal" value={activeTransform.x} min={80} max={320} step={1} onChange={value => patch({ x: value })} />
        <Control label="Vertical" value={activeTransform.y} min={20} max={210} step={1} onChange={value => patch({ y: value })} />
        <button
          type="button"
          onClick={() => setActiveTransform({ ...defaultTransform })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-black/5"
        >
          <RotateCcw size={16} />
          Reset placement
        </button>
      </div>
    </div>
  )
}

function Control({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
        <span className="font-mono text-[11px] normal-case tracking-normal text-gray-400">{Number(value).toFixed(step < 1 ? 1 : 0)}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => onChange(Number(event.target.value))}
        className="w-full accent-ink-900"
      />
    </label>
  )
}
