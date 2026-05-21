'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/avatar/Avatar'
import HeadCropUpload from '@/components/avatar/HeadCropUpload'
import Whiteboard from '@/components/brand/Whiteboard'
import InkUnderline from '@/components/forms/InkUnderline'
import { cn } from '@/lib/utils/cn'
import { HERO_PRESETS } from '@/lib/utils/avatarResolve'
import type { AvatarPresetId } from '@/src/features/avatar/types'
import {
  DEFAULT_SKIN_DEPTH,
  DEFAULT_SKIN_UNDERTONE,
  SKIN_TONE_ANCHORS,
  skinToneFrom,
} from '@/lib/utils/skinTone'

// Onboarding (doc 08 §10 + doc 16 synthesis + Round 3 PM cleanup +
// Route 1 avatar lock-in):
//   Step 1 — Basics (name + enrollment + batch grid). Sunlit Lawn round 6
//            opens with an a-frame Whiteboard greeting (doc 18 § 3).
//   Step 2 — Face (AI prompt + upload OR skip — no placeholder bank;
//            customised faces are core to the product identity)
//   Step 3 — Body pose (HERO_PRESETS grid) + skin (depth + undertone).
//            Shirt colour is gone — Route 1 ships one canonical white
//            shirt as the scribbling surface.
//   Step 4 — Review (with Edit jumps + confetti once, at the end)
//
// Inputs across every step use the doc 18 § 14 InkUnderline wave; CTAs
// use the pencil-button family so the school-physics hover applies.

type Step = 1 | 2 | 3 | 4
type FieldKey = 'displayName' | 'enrollmentNumber'

interface FormState {
  displayName:      string
  enrollmentNumber: string
  batchId:          string         // resolved from grid click
  batchNumber:      number | null  // 1..52
  presetId:         AvatarPresetId // Route 1 canonical avatar identity
  bodyStyle:        string         // legacy back-compat; derived from presetId
  skinDepth:        number         // 0..100  (lightness)
  skinUndertone:    number         // -50..50 (cool ↔ warm)
  headFrontUrl:     string | null
  headBackUrl:      string | null
  headSource:       'upload' | 'skipped'
}

interface BatchOption {
  id:    string
  label: string
  batchNumber: number
}

const AI_PROMPT = `A simple cartoon-style head-and-shoulders portrait of me, front view, looking at the camera, plain background, transparent PNG, no shirt, no shoulders below the collarbone, soft outlines, friendly expression — designed to be cropped into a yearbook avatar.`

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep]   = useState<Step>(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm]   = useState<FormState>({
    displayName:      '',
    enrollmentNumber: '',
    batchId:          '',
    batchNumber:      null,
    presetId:         'm-classic-straight',
    bodyStyle:        'M2',
    skinDepth:        DEFAULT_SKIN_DEPTH,
    skinUndertone:    DEFAULT_SKIN_UNDERTONE,
    headFrontUrl:     null,
    headBackUrl:      null,
    headSource:       'skipped',
  })
  const [academicGroupId, setAcademicGroupId] = useState<string | null>(null)
  const [programId, setProgramId] = useState<string | null>(null)
  const [batches, setBatches]   = useState<BatchOption[]>([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [promptCopied, setPromptCopied] = useState(false)
  const [focused, setFocused] = useState<FieldKey | null>(null)

  // ── Load user + B.Tech CS batches ─────────────────────────
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const sync = await fetch('/api/auth/sync-user', { method: 'POST' })
        .then(res => res.json())
        .catch(() => null)
      if (sync?.account_kind === 'external') {
        router.push('/onboarding/guest')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('is_university_verified')
        .eq('id', user.id)
        .single()
      if (profile && !profile.is_university_verified) {
        router.push('/onboarding/guest')
        return
      }

      if (cancelled) return
      setUserId(user.id)
      setForm(f => ({
        ...f,
        displayName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
      }))
    }

    async function loadBatches() {
      const { data: group } = await supabase
        .from('academic_groups')
        .select('id')
        .eq('name', 'University')
        .maybeSingle()
      if (!group) return

      const { data: program } = await supabase
        .from('programs')
        .select('id')
        .eq('academic_group_id', group.id)
        .eq('name', 'B.Tech Computer Science')
        .maybeSingle()
      if (!program) return

      const { data: batchRows } = await supabase
        .from('batches')
        .select('id, label')
        .eq('program_id', program.id)
        .order('label')

      if (cancelled) return
      setAcademicGroupId(group.id)
      setProgramId(program.id)
      setBatches(
        (batchRows ?? [])
          .map(b => ({
            id: b.id,
            label: b.label ?? '',
            batchNumber: parseInt((b.label ?? '').replace(/\D/g, ''), 10) || 0,
          }))
          .filter(b => b.batchNumber > 0)
          .sort((a, b) => a.batchNumber - b.batchNumber),
      )
    }

    bootstrap()
    loadBatches()

    return () => { cancelled = true }
  }, [router, supabase])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  // ── Step gating ───────────────────────────────────────────
  const canProceed1 =
    form.displayName.trim().length > 0 &&
    form.enrollmentNumber.trim().length > 0 &&
    !!form.batchId
  const canProceed2 = true
  const canProceed3 = !!form.presetId

  const next = () => setStep(s => (Math.min(4, s + 1)) as Step)
  const back = () => setStep(s => (Math.max(1, s - 1)) as Step)
  const goTo = (s: Step) => setStep(s)

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2500)
    } catch {
      /* clipboard refused — surface nothing, the user can select+copy by hand */
    }
  }

  function clearFace() {
    set('headFrontUrl', null)
    set('headBackUrl', null)
    set('headSource', 'skipped')
  }

  // ── Save ──────────────────────────────────────────────────
  const complete = async () => {
    if (!userId || !academicGroupId || !programId) return
    setSaving(true)
    setError(null)

    const resolvedSkin = skinToneFrom(form.skinDepth, form.skinUndertone)
    const legacyBodyStyle = form.presetId.startsWith('m-') ? 'M2' : 'F1'

    const { error: err } = await supabase.from('users').update({
      display_name:      form.displayName.trim(),
      enrollment_number: form.enrollmentNumber.trim(),
      academic_group_id: academicGroupId,
      program_id:        programId,
      batch_id:          form.batchId,
      body_style:        legacyBodyStyle,
      head_front_url:    form.headFrontUrl,
      head_back_url:     form.headBackUrl,
      avatar_config:     {
        presetId: form.presetId,
        skinTone: {
          mode:      'slider-v2',
          depth:     resolvedSkin.depth,
          undertone: resolvedSkin.undertone,
          hex:       resolvedSkin.hex,
        },
        headSource: form.headSource,
      },
      onboarding_completed: true,
    }).eq('id', userId)

    if (err) {
      setError('Could not save your profile — please try again.')
      setSaving(false)
      return
    }

    try {
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#1C1C1C', '#F8F8F8', '#6B8E6B', '#1E3A5F', '#F5F0E0'],
      })
    } catch { /* non-critical */ }

    router.push('/dashboard?onboarded=1')
  }

  const skin = skinToneFrom(form.skinDepth, form.skinUndertone)
  const depthTrack = `linear-gradient(to right, ${SKIN_TONE_ANCHORS.map(a => a.hex).join(', ')})`
  const undertoneSamples = [-50, -25, 0, 25, 50].map(u => skinToneFrom(form.skinDepth, u).hex)
  const undertoneTrack = `linear-gradient(to right, ${undertoneSamples.join(', ')})`

  // First-name fallback for the welcome whiteboard. Empty value uses
  // "friend" so the greeting reads naturally before the field is filled.
  const firstName = (form.displayName.trim().split(/\s+/)[0] ?? '').trim() || 'friend'

  const displayNameActive    = focused === 'displayName'    || form.displayName.length > 0
  const enrollmentActive     = focused === 'enrollmentNumber' || form.enrollmentNumber.length > 0

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="scribbl-page min-h-screen py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-hero-display">scribbl</h1>
          <p className="text-nostalgia mt-1">Set up your scribble shirt</p>
        </div>

        <div className="flex gap-2 mb-8" aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={cn(
              'flex-1 h-1.5 rounded-full transition-all duration-500',
              s <= step ? 'bg-ink-900' : 'bg-paper-300',
            )} />
          ))}
        </div>

        {/* ── Step 1 — Basics ── */}
        {step === 1 && (
          <div className="card p-6 space-y-5">
            {/* Welcome whiteboard — Sunlit Lawn warm greeting beat. */}
            <div className="flex justify-center -mt-2">
              <div className="w-44 sm:w-48">
                <Whiteboard
                  variant="a-frame"
                  title={`welcome, ${firstName}!`}
                  subtitle="let's set up your shirt"
                  markerColor="blue"
                  rotation="left"
                />
              </div>
            </div>

            <h2 className="text-eyebrow-display">The basics</h2>

            <div>
              <label className="label" htmlFor="onboarding-display-name">Display name</label>
              <div className="relative">
                <input
                  id="onboarding-display-name"
                  className="input"
                  value={form.displayName}
                  onChange={e => set('displayName', e.target.value)}
                  onFocus={() => setFocused('displayName')}
                  onBlur={() => setFocused(null)}
                  placeholder="Your name"
                />
                <InkUnderline active={displayNameActive} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="onboarding-enrollment">Enrollment number</label>
              <div className="relative">
                <input
                  id="onboarding-enrollment"
                  className="input"
                  value={form.enrollmentNumber}
                  onChange={e => set('enrollmentNumber', e.target.value)}
                  onFocus={() => setFocused('enrollmentNumber')}
                  onBlur={() => setFocused(null)}
                  placeholder="e.g. 22CS001"
                />
                <InkUnderline active={enrollmentActive} />
              </div>
            </div>

            <div>
              <span className="label">Program</span>
              <div className="input flex items-center justify-between bg-paper-50 text-ink-500">
                <span>B.Tech Computer Science</span>
                <span className="text-xs text-ink-500">v1 cohort</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Other courses will be added when classmates request access.
              </p>
            </div>

            <div>
              <span className="label">Your batch (01 – 52)</span>
              {batches.length === 0 ? (
                <p className="rounded-xl border border-dashed border-black/15 bg-white/50 p-3 text-xs text-ink-500">
                  Loading batches…
                </p>
              ) : (
                <div className="grid grid-cols-6 gap-1.5">
                  {batches.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        set('batchId', b.id)
                        set('batchNumber', b.batchNumber)
                      }}
                      aria-pressed={form.batchId === b.id}
                      className={cn(
                        'rounded-lg border px-1.5 py-2 text-xs font-semibold transition',
                        form.batchId === b.id
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-paper-300 bg-white text-ink-900 hover:border-ink-500',
                      )}
                    >
                      {String(b.batchNumber).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              )}
              {form.batchNumber !== null && (
                <p className="mt-1 text-xs text-ink-500">
                  Selected: Batch {String(form.batchNumber).padStart(2, '0')}
                </p>
              )}
            </div>

            <button
              className="pencil-button-primary w-full mt-2"
              disabled={!canProceed1}
              onClick={next}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── Step 2 — Face ── */}
        {step === 2 && (
          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-eyebrow-display">Your face</h2>
              <p className="text-sm text-ink-500 mt-1">
                A customised face is the whole point of your shirt — your friends should
                recognise you. Generate one with the prompt below, upload it, or skip and
                add it later from Settings.
              </p>
            </div>

            <div className="flex justify-center">
              <Avatar
                presetId={form.presetId}
                headFrontUrl={form.headFrontUrl}
                displayName={form.displayName}
                size="lg"
              />
            </div>

            <details open className="rounded-xl border border-dashed border-black/15 bg-white/60 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink-900">
                1 · Generate your portrait
              </summary>
              <div className="mt-3 space-y-2">
                <textarea
                  readOnly
                  value={AI_PROMPT}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-black/10 bg-white p-2 text-xs leading-relaxed text-ink-700"
                  aria-label="AI portrait prompt"
                />
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>Paste into ChatGPT or Ideogram, then come back and upload it.</span>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="font-semibold text-ink-900 underline-offset-2 hover:underline"
                  >
                    {promptCopied ? 'Copied' : 'Copy prompt'}
                  </button>
                </div>
              </div>
            </details>

            <div>
              <span className="label">2 · Upload your portrait</span>
              <HeadCropUpload
                side="front"
                currentUrl={form.headSource === 'upload' ? form.headFrontUrl : null}
                onUploaded={url => {
                  set('headFrontUrl', url)
                  set('headSource', 'upload')
                }}
              />
              {form.headSource === 'upload' && form.headFrontUrl && (
                <button
                  type="button"
                  onClick={clearFace}
                  className="mt-2 text-xs font-medium text-ink-500 underline hover:text-ink-700"
                >
                  Clear and skip for now
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button className="pencil-button flex-1" onClick={back}>← Back</button>
              <button className="pencil-button-primary flex-1" disabled={!canProceed2} onClick={next}>
                {form.headSource === 'upload' ? 'Next →' : 'Skip for now →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 — Body pose + skin tone ── */}
        {step === 3 && (
          <div className="card p-6 space-y-6">
            <h2 className="text-eyebrow-display">Your body</h2>

            <div className="flex justify-center">
              <Avatar
                presetId={form.presetId}
                headFrontUrl={form.headFrontUrl}
                displayName={form.displayName}
                size="lg"
              />
            </div>

            <div>
              <span className="label">Body pose</span>
              <div className="grid grid-cols-3 gap-3">
                {HERO_PRESETS.map(preset => {
                  const isSelected = form.presetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => set('presetId', preset.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs text-center transition',
                        isSelected
                          ? 'border-ink-900 bg-ink-900/5'
                          : 'border-paper-300 hover:border-ink-500',
                      )}
                    >
                      <Avatar presetId={preset.id} size="sm" />
                      <span className="font-medium text-ink-900">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="label mb-0">Skin tone</span>
                <span
                  className="inline-flex h-7 w-7 rounded-full border border-black/15 shadow-inner"
                  style={{ backgroundColor: skin.hex }}
                  aria-label={`Current skin preview, hex ${skin.hex}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>Light</span>
                  <span className="font-medium text-ink-900">Depth</span>
                  <span>Deep</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.skinDepth}
                  onChange={e => set('skinDepth', Number(e.target.value))}
                  aria-label={`Skin depth (${form.skinDepth} of 100)`}
                  className="mt-1 h-3 w-full cursor-pointer appearance-none rounded-full"
                  style={{ background: depthTrack }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>Cool</span>
                  <span className="font-medium text-ink-900">Undertone</span>
                  <span>Warm</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={form.skinUndertone}
                  onChange={e => set('skinUndertone', Number(e.target.value))}
                  aria-label={`Skin undertone (${form.skinUndertone}, range -50 cool to 50 warm)`}
                  className="mt-1 h-3 w-full cursor-pointer appearance-none rounded-full"
                  style={{ background: undertoneTrack }}
                />
              </div>

              <p className="text-xs text-ink-500">
                Two sliders — lightness and warmth. Curated range only; no raw colour picker.
              </p>
            </div>

            <div className="flex gap-2">
              <button className="pencil-button flex-1" onClick={back}>← Back</button>
              <button className="pencil-button-primary flex-1" disabled={!canProceed3} onClick={next}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4 — Review ── */}
        {step === 4 && (
          <div className="card p-8 space-y-6">
            <div className="flex justify-center">
              <Avatar
                presetId={form.presetId}
                headFrontUrl={form.headFrontUrl}
                displayName={form.displayName}
                size="xl"
              />
            </div>

            <div className="text-center">
              <h2 className="text-hero-display">Looks like you?</h2>
              <p className="text-nostalgia mt-1">
                Tap any section to tweak. Everything is editable from Settings later too.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button className="pencil-button text-xs py-2" onClick={() => goTo(1)}>Edit basics</button>
              <button className="pencil-button text-xs py-2" onClick={() => goTo(2)}>Edit face</button>
              <button className="pencil-button text-xs py-2" onClick={() => goTo(3)}>Edit body</button>
            </div>

            {form.headSource === 'skipped' && (
              <p className="rounded-xl border border-dashed border-black/15 bg-white/60 p-3 text-center text-xs text-ink-500">
                No face yet — you&apos;ll see a friendly placeholder until you add one in Settings.
              </p>
            )}

            {error && <p className="text-sm text-red-500 text-center" role="alert">{error}</p>}

            <button
              className="pencil-button-primary w-full text-base py-3"
              onClick={complete}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Looks good — open my dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
