'use client'

import type { AvatarPresetId, AvatarSide, Transform2D } from '../types'
import AvatarRenderer from './AvatarRenderer'
import AvatarSideToggle from './AvatarSideToggle'

interface AvatarReviewStepProps {
  side: AvatarSide
  onSide: (side: AvatarSide) => void
  presetId: AvatarPresetId
  skinToneId: string
  frontFaceImageUrl?: string | null
  backHairImageUrl?: string | null
  frontFaceTransform: Transform2D
  backHairTransform: Transform2D
}

export default function AvatarReviewStep({
  side,
  onSide,
  presetId,
  skinToneId,
  frontFaceImageUrl,
  backHairImageUrl,
  frontFaceTransform,
  backHairTransform,
}: AvatarReviewStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <AvatarSideToggle side={side} onSide={onSide} />
      </div>
      <div className="mx-auto max-w-xl rounded-[34px] border border-black/10 bg-[#f7efe2] p-5 shadow-inner">
        <AvatarRenderer
          presetId={presetId}
          side={side}
          skinToneId={skinToneId}
          frontFaceImageUrl={frontFaceImageUrl}
          backHairImageUrl={backHairImageUrl}
          frontFaceTransform={frontFaceTransform}
          backHairTransform={backHairTransform}
          className="mx-auto max-w-[360px]"
        />
      </div>
    </div>
  )
}
