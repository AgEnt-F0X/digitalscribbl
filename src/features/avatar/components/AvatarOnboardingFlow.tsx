'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  DEFAULT_SKIN_DEPTH,
  DEFAULT_SKIN_UNDERTONE,
} from '@/lib/utils/skinTone'
import {
  getAvatarPreset,
  getAvatarPresetsByCategory,
  normalizeAvatarConfig,
} from '../data/avatarPresets'
import { type SkinToneId } from '../data/skinTones'
import type { AvatarCategory, AvatarPresetId, AvatarSide, Transform2D, UserAvatarConfig } from '../types'
import AvatarPresetGrid from './AvatarPresetGrid'
import AvatarReviewStep from './AvatarReviewStep'
import AvatarStyleStep from './AvatarStyleStep'
import FacePlacementEditor from './FacePlacementEditor'
import SkinToneSliders from './SkinToneSliders'

/**
 * Bridge depth → closest legacy `skinToneId` so the curated slider keeps
 * working with the `/api/avatar/config` contract (which still validates
 * against the 5 legacy ids) and with the SVG `AvatarRenderer` that pulls
 * its skin hex through `getSkinTone(id)`. Anchors are mirrored from
 * `lib/utils/skinTone.ts → LEGACY_SWATCH_TO_DEPTH`.
 *
 * Slider undertone is preserved in component state for UI fidelity, but
 * is intentionally NOT serialised here — the legacy schema cannot carry
 * it. A follow-up migration is tracked in `docs/06-revisit-later.md`.
 */
const DEPTH_TO_LEGACY_ID: { id: SkinToneId; depth: number }[] = [
  { id: 'skin_01_light_warm',   depth: 0  },
  { id: 'skin_02_wheat',        depth: 20 },
  { id: 'skin_05_cool_tan',     depth: 40 },
  { id: 'skin_03_medium_brown', depth: 55 },
  { id: 'skin_04_deep_brown',   depth: 78 },
]

function depthToLegacyId(depth: number): SkinToneId {
  let best = DEPTH_TO_LEGACY_ID[0]
  for (const anchor of DEPTH_TO_LEGACY_ID) {
    if (Math.abs(anchor.depth - depth) < Math.abs(best.depth - depth)) {
      best = anchor
    }
  }
  return best.id
}

function legacyIdToDepth(id: string | null | undefined): number {
  const hit = DEPTH_TO_LEGACY_ID.find(anchor => anchor.id === id)
  return hit ? hit.depth : DEFAULT_SKIN_DEPTH
}

type Step = 'style' | 'front-face' | 'review'

interface AvatarOnboardingFlowProps {
  initialConfig?: unknown
  initialFrontFaceUrl?: string | null
  initialBackHairUrl?: string | null
}

const STEPS: Step[] = ['style', 'front-face', 'review']
const STORAGE_KEY = 'scribbl:user-avatar-config'

export default function AvatarOnboardingFlow({
  initialConfig,
  initialFrontFaceUrl,
  initialBackHairUrl,
}: AvatarOnboardingFlowProps) {
  const router = useRouter()
  const normalizedInitial = useMemo(() => normalizeAvatarConfig(initialConfig), [initialConfig])
  const initialPreset = getAvatarPreset(normalizedInitial.presetId)
  const [step, setStep] = useState<Step>('style')
  const [category, setCategory] = useState<AvatarCategory>(initialPreset.category)
  const [presetId, setPresetId] = useState<AvatarPresetId>(normalizedInitial.presetId)
  const [skinDepth, setSkinDepth] = useState<number>(legacyIdToDepth(normalizedInitial.skinToneId))
  const [skinUndertone, setSkinUndertone] = useState<number>(DEFAULT_SKIN_UNDERTONE)
  const [frontFaceImageUrl, setFrontFaceImageUrl] = useState<string | null>(initialFrontFaceUrl ?? normalizedInitial.frontFaceImageUrl ?? null)
  const [backHairImageUrl, setBackHairImageUrl] = useState<string | null>(initialBackHairUrl ?? normalizedInitial.backHairImageUrl ?? null)
  const [frontFaceTransform, setFrontFaceTransform] = useState<Transform2D>(normalizedInitial.frontFaceTransform)
  const [backHairTransform, setBackHairTransform] = useState<Transform2D>(normalizedInitial.backHairTransform)
  const [reviewSide, setReviewSide] = useState<AvatarSide>('front')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const preset = getAvatarPreset(presetId)
  const currentIndex = STEPS.indexOf(step)
  // The API + AvatarRenderer still key off the 5 legacy ids; we always
  // resolve sliders → nearest id at the render edge.
  const skinToneId: SkinToneId = useMemo(() => depthToLegacyId(skinDepth), [skinDepth])

  useEffect(() => {
    const config = currentConfig()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId, skinToneId, frontFaceImageUrl, backHairImageUrl, frontFaceTransform, backHairTransform])

  function currentConfig(): UserAvatarConfig {
    return {
      presetId,
      skinToneId,
      frontFaceImageUrl: frontFaceImageUrl ?? undefined,
      backHairImageUrl: backHairImageUrl ?? undefined,
      frontFaceTransform,
      backHairTransform,
    }
  }

  function chooseCategory(nextCategory: AvatarCategory) {
    setCategory(nextCategory)
    const firstPreset = getAvatarPresetsByCategory(nextCategory)[0]
    setPresetId(firstPreset.id)
    setFrontFaceTransform({ ...firstPreset.faceDefault })
    setBackHairTransform({ ...firstPreset.backHairDefault })
  }

  function choosePreset(nextPresetId: AvatarPresetId) {
    const nextPreset = getAvatarPreset(nextPresetId)
    setPresetId(nextPreset.id)
    setFrontFaceTransform({ ...nextPreset.faceDefault })
    setBackHairTransform({ ...nextPreset.backHairDefault })
  }

  function next() {
    setStep(STEPS[Math.min(STEPS.length - 1, currentIndex + 1)])
  }

  function back() {
    setStep(STEPS[Math.max(0, currentIndex - 1)])
  }

  function lockAvatar() {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/avatar/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentConfig(),
          lockedAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save avatar.')
        return
      }

      window.localStorage.removeItem(STORAGE_KEY)
      router.push('/dashboard?avatar=locked')
    })
  }

  return (
    <div className="min-h-screen bg-paper-100 px-4 py-8 text-ink-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-4xl font-bold">Scribbl</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Create your farewell avatar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Pick a finished shirt-body preset, add your face, and lock the identity your friends will sign.
            </p>
          </div>
          <div className="flex gap-2">
            {STEPS.map((item, index) => (
              <span
                key={item}
                className={cn('h-2 w-10 rounded-full transition', index <= currentIndex ? 'bg-ink-900' : 'bg-black/10')}
              />
            ))}
          </div>
        </header>

        <main className="rounded-[34px] border border-black/10 bg-paper-50/85 p-5 shadow-[0_22px_70px_rgba(45,35,22,0.10)] md:p-7">
          {step === 'style' && (
            <Section title="Choose your shirt identity" eyebrow="Step 1">
              <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-7">
                  <AvatarStyleStep value={category} onChange={chooseCategory} />
                  <div>
                    <h3 className="font-display text-2xl font-bold text-ink-900">Pick a pose</h3>
                    <p className="mt-1 text-sm text-ink-500">
                      Presets keep the shirt mask and face anchor stable for every screen.
                    </p>
                    <div className="mt-4">
                      <AvatarPresetGrid category={category} selectedPresetId={presetId} onSelect={choosePreset} />
                    </div>
                  </div>
                  <SkinToneSliders
                    depth={skinDepth}
                    undertone={skinUndertone}
                    onChange={next => {
                      setSkinDepth(next.depth)
                      setSkinUndertone(next.undertone)
                    }}
                  />
                </div>
                <AvatarReviewStep
                  side="front"
                  onSide={() => undefined}
                  presetId={presetId}
                  skinToneId={skinToneId}
                  frontFaceImageUrl={frontFaceImageUrl}
                  backHairImageUrl={backHairImageUrl}
                  frontFaceTransform={frontFaceTransform}
                  backHairTransform={backHairTransform}
                />
              </div>
            </Section>
          )}

          {step === 'front-face' && (
            <Section title="Upload and place your face" eyebrow="Step 2">
              <ImageUpload
                side="front"
                title="Upload a clear cutout face with no background."
                currentUrl={frontFaceImageUrl}
                onUploaded={setFrontFaceImageUrl}
              />
              <div className="mt-5">
                <FacePlacementEditor
                  presetId={presetId}
                  side="front"
                  skinToneId={skinToneId}
                  frontFaceImageUrl={frontFaceImageUrl}
                  backHairImageUrl={backHairImageUrl}
                  frontFaceTransform={frontFaceTransform}
                  backHairTransform={backHairTransform}
                  defaultTransform={preset.faceDefault}
                  onFrontFaceTransform={setFrontFaceTransform}
                  onBackHairTransform={setBackHairTransform}
                />
              </div>
            </Section>
          )}

          {step === 'review' && (
            <Section title="Review and lock" eyebrow="Step 3">
              <AvatarReviewStep
                side={reviewSide}
                onSide={setReviewSide}
                presetId={presetId}
                skinToneId={skinToneId}
                frontFaceImageUrl={frontFaceImageUrl}
                backHairImageUrl={backHairImageUrl}
                frontFaceTransform={frontFaceTransform}
                backHairTransform={backHairTransform}
              />
              {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
            </Section>
          )}

          <footer className="mt-7 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={back}
              disabled={currentIndex === 0 || isPending}
              className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-black/5 disabled:opacity-40"
            >
              Back
            </button>
            {step === 'review' ? (
              <button
                type="button"
                onClick={lockAvatar}
                disabled={isPending}
                className="rounded-2xl bg-ink-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ink-700 disabled:opacity-50"
              >
                {isPending ? 'Locking...' : 'Lock my avatar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                disabled={isPending}
                className="rounded-2xl bg-ink-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ink-700 disabled:opacity-50"
              >
                Continue
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl font-bold text-ink-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ImageUpload({
  side,
  title,
  currentUrl,
  onUploaded,
}: {
  side: 'front' | 'back'
  title: string
  currentUrl?: string | null
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('side', side)
    const res = await fetch('/api/avatar/upload-head', { method: 'POST', body: form })
    const body = await res.json().catch(() => ({}))
    setUploading(false)
    if (!res.ok) {
      setError(body.error ?? 'Upload failed')
      return
    }
    onUploaded(body.url)
  }

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-black/10 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-xs text-gray-500">PNG or WebP works best. The final asset stays separate from the shirt.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-ink-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-ink-700">
        <Upload size={16} />
        {uploading ? 'Uploading...' : currentUrl ? 'Replace image' : 'Upload image'}
        <input
          type="file"
          accept="image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={event => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.currentTarget.value = ''
          }}
        />
      </label>
    </div>
  )
}
