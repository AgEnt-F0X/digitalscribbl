'use client'

// Visual QA harness for every Sunlit Lawn primitive (doc 18 § 7-14).
// Sections mirror the order in the Phase 1B brief — every new component is
// rendered side-by-side at least once so visual regressions surface fast.

import { useState } from 'react'
import PlaceBackground from '@/components/place/PlaceBackground'
import Whiteboard from '@/components/brand/Whiteboard'
import AvatarHalo from '@/components/brand/AvatarHalo'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import HandDrawnArrow from '@/components/marginalia/HandDrawnArrow'
import InkUnderline from '@/components/forms/InkUnderline'
import InkCheckbox from '@/components/forms/InkCheckbox'
import StampSuccess from '@/components/feedback/StampSuccess'
import PencilLoader from '@/components/feedback/PencilLoader'

interface SectionProps {
  number: number
  title: string
  blurb?: string
  children: React.ReactNode
}

function Section({ number, title, blurb, children }: SectionProps) {
  return (
    <section className="py-10 border-b border-[color:var(--line-soft)]">
      <div className="mb-6">
        <p className="text-eyebrow-uppercase text-ink-500">Section {number}</p>
        <h2 className="text-eyebrow-display mt-1">{title}</h2>
        {blurb ? (
          <p className="text-sm text-ink-500 mt-1 max-w-xl">{blurb}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export default function SunlitLawnDemo() {
  const [inputValue, setInputValue] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [stampShown, setStampShown] = useState(false)
  const [stampKey, setStampKey] = useState(0)
  const [checkA, setCheckA] = useState(true)
  const [checkB, setCheckB] = useState(false)

  const underlineActive = inputFocused || inputValue.length > 0

  const fireStamp = () => {
    setStampShown(false)
    setStampKey(k => k + 1)
    window.setTimeout(() => setStampShown(true), 30)
  }

  return (
    <main className="scribbl-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-6">
          <p className="text-eyebrow-uppercase text-ink-500">/dev/sunlit-lawn</p>
          <h1 className="text-hero-display mt-2">Sunlit Lawn — Design System Demo</h1>
          <p className="text-sm text-ink-500 mt-2 max-w-xl">
            Visual QA harness for every primitive shipped in Phase 1B. Doc 18 is the canonical spec.
          </p>
        </header>

        {/* ── 1 · Whiteboard variants ────────────────────────── */}
        <Section
          number={1}
          title="Whiteboard variants"
          blurb="A-frame (login/onboarding), wall-mounted (dashboard/explore), small (group cards/empty states). Each tile shows the variant in every marker colour."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <p className="text-meta text-ink-500 mb-3">A-frame · 2:3 portrait</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="max-w-[180px]">
                  <Whiteboard variant="a-frame" title="Scribbl." subtitle="class of 2026" markerColor="black" />
                </div>
                <div className="max-w-[180px]">
                  <Whiteboard variant="a-frame" title="welcome, Mei!" subtitle="set up your shirt" markerColor="blue" rotation="left" />
                </div>
                <div className="max-w-[180px]">
                  <Whiteboard variant="a-frame" title="oh no!" subtitle="something tore the paper" markerColor="red" />
                </div>
                <div className="max-w-[180px]">
                  <Whiteboard variant="a-frame" title="all done" subtitle="thanks for scribbling" markerColor="green" rotation="right" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-meta text-ink-500 mb-3">Wall-mounted · 3:2 landscape</p>
              <div className="space-y-4">
                <Whiteboard variant="wall-mounted" title="23 days left" subtitle="to scribble" markerColor="blue" />
                <Whiteboard variant="wall-mounted" title="class of 2026" subtitle="1,247 classmates" markerColor="black" />
                <Whiteboard variant="wall-mounted" title="phase ended" subtitle="head to yearbook" markerColor="red" />
                <Whiteboard variant="wall-mounted" title="hostel-c wing" subtitle="32 members" markerColor="green" />
              </div>
            </div>

            <div>
              <p className="text-meta text-ink-500 mb-3">Small · 4:3 mini</p>
              <div className="grid grid-cols-2 gap-3">
                <Whiteboard variant="small" title="no scribbles yet" subtitle="share your link" markerColor="blue" />
                <Whiteboard variant="small" title="scribbled by 7 friends" markerColor="black" />
                <Whiteboard variant="small" title="oops" subtitle="we couldn't load it" markerColor="red" />
                <Whiteboard variant="small" title="approved" subtitle="locked in" markerColor="green" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── 2 · AvatarHalo ─────────────────────────────────── */}
        <Section
          number={2}
          title="AvatarHalo"
          blurb="Soft brand-soft radial behind the user's head. No card chrome. Round-5 primitive, confirmed by the avatar-view concept image."
        >
          <div className="flex flex-wrap gap-12 items-end">
            <div className="relative h-56 w-56">
              <AvatarHalo width="80%" height="55%" top="20%" />
              <div className="relative z-10 h-40 w-40 mx-auto rounded-full bg-paper-200 grid place-items-center text-3xl font-display text-ink-700 mt-2 border" style={{ borderColor: 'var(--line-soft)' }}>
                Mei
              </div>
              <p className="text-meta text-ink-500 mt-3 text-center">default (70% × 40%)</p>
            </div>
            <div className="relative h-56 w-56">
              <AvatarHalo width="120%" height="80%" top="10%" left="-10%" />
              <div className="relative z-10 h-40 w-40 mx-auto rounded-full bg-paper-200 grid place-items-center text-3xl font-display text-ink-700 mt-2 border" style={{ borderColor: 'var(--line-soft)' }}>
                A
              </div>
              <p className="text-meta text-ink-500 mt-3 text-center">wider, top-shifted</p>
            </div>
          </div>
        </Section>

        {/* ── 3 · DriftingDoodles ────────────────────────────── */}
        <Section
          number={3}
          title="DriftingDoodles"
          blurb="Page-level marginalia using existing sticker SVGs. Three density tiers: low (mobile, 3), medium (tablet, 4), high (desktop, 6)."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['low', 'medium', 'high'] as const).map(density => (
              <div key={density} className="relative h-60 rounded-lg border" style={{ borderColor: 'var(--line-soft)', background: 'var(--paper-50)' }}>
                <DriftingDoodles density={density} />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-eyebrow-display text-ink-700">{density}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 4 · Marginalia ─────────────────────────────────── */}
        <Section
          number={4}
          title="Asterisk divider & hand-drawn arrows"
          blurb="Asterisk between sections. Arrow rotates per direction prop; attention variant wiggles three times before settling."
        >
          <div className="space-y-6">
            <AsteriskDivider />
            <div className="flex flex-wrap gap-8 items-center">
              <div className="flex flex-col items-center gap-2">
                <HandDrawnArrow direction="right" />
                <span className="text-meta text-ink-500">right (default)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <HandDrawnArrow direction="down" />
                <span className="text-meta text-ink-500">down</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <HandDrawnArrow direction="left" />
                <span className="text-meta text-ink-500">left</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <HandDrawnArrow direction="up" />
                <span className="text-meta text-ink-500">up</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <HandDrawnArrow attention length={100} />
                <span className="text-meta text-ink-500">attention (wiggles)</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 5 · Pencil buttons ─────────────────────────────── */}
        <Section
          number={5}
          title="Buttons — pencil-shade hover"
          blurb="Hover to see the cross-hatched graphite shade ramp from 4% → 18% → 28% opacity. School-physics replacement for the SaaS translate."
        >
          <div className="flex flex-wrap gap-3">
            <button type="button" className="pencil-button">scribble back</button>
            <button type="button" className="pencil-button-primary">
              share your link
              <span className="opacity-80">→</span>
            </button>
            <button type="button" className="pencil-button" disabled>
              disabled
            </button>
            <button type="button" className="pencil-button">
              <PencilLoader />
              submitting
            </button>
          </div>
        </Section>

        {/* ── 6 · Sticker note ───────────────────────────────── */}
        <Section
          number={6}
          title="Sticker note · text-handwritten-note"
          blurb="Sticker surfaces auto-apply the handwritten ink-on-paper text treatment. Tilt utility composes with the sticker chrome."
        >
          <div className="relative h-40">
            <div className="sticker-note tilt-left" style={{ top: 0, left: 20, width: 240 }}>
              Keep shining! 🌞<br />— Priya
            </div>
            <div className="sticker-note tilt-right" style={{ top: 24, left: 320, width: 220 }}>
              You&apos;re a legend.<br />Sign mine next?
            </div>
          </div>
        </Section>

        {/* ── 7 · Ink underline + checkbox ───────────────────── */}
        <Section
          number={7}
          title="Ink underline & ink checkbox"
          blurb="Focus the input or clear it to watch the underline draw / erase. Toggle the checkboxes to watch the ink stroke draw in."
        >
          <div className="flex flex-col md:flex-row gap-8 max-w-3xl">
            <label className="relative flex-1 flex flex-col gap-2">
              <span className="text-eyebrow-uppercase text-ink-500">Your name</span>
              <div className="relative">
                <input
                  type="text"
                  className="input"
                  placeholder="Type something…"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
                <InkUnderline active={underlineActive} />
              </div>
            </label>
            <div className="flex flex-col gap-3 min-w-[240px]">
              <InkCheckbox checked={checkA} onChange={setCheckA} label="Show me to my batchmates" />
              <InkCheckbox checked={checkB} onChange={setCheckB} label="Email me when someone scribbles" />
              <InkCheckbox checked={false} onChange={() => {}} label="Disabled (read-only)" disabled />
            </div>
          </div>
        </Section>

        {/* ── 8 · Stamp success ──────────────────────────────── */}
        <Section
          number={8}
          title="StampSuccess"
          blurb="Teacher's-approval stamp. Used on onboarding complete, scribble published, avatar locked."
        >
          <div className="flex items-center gap-6">
            <button type="button" onClick={fireStamp} className="pencil-button-primary">
              fire it
            </button>
            <div className="h-32 w-32 grid place-items-center">
              <StampSuccess key={stampKey} show={stampShown} onComplete={() => undefined} />
            </div>
          </div>
        </Section>

        {/* ── 9 · Pencil loader ──────────────────────────────── */}
        <Section
          number={9}
          title="PencilLoader"
          blurb="Replaces Lucide spinners in submitting states. The pencil draws a wavy line in a loop."
        >
          <div className="flex items-center gap-8">
            <PencilLoader />
            <span className="inline-flex items-center gap-2 text-ink-500">
              <PencilLoader />
              writing your message…
            </span>
          </div>
        </Section>

        {/* ── 10 · PlaceBackground ───────────────────────────── */}
        <Section
          number={10}
          title="PlaceBackground"
          blurb="Two stacked surfaces showing the vivid (login-style) and ambient (profile-style) phases of the place layer."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative h-80 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line-soft)' }}>
              <PlaceBackground surface="login" illustration="lawn-golden-hour" alwaysVivid />
              <div className="relative z-10 h-full grid place-items-center">
                <p className="text-eyebrow-display bg-paper-50/70 backdrop-blur-sm px-3 py-1 rounded">vivid · login</p>
              </div>
            </div>
            <div className="relative h-80 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line-soft)' }}>
              <PlaceBackground surface="profile" illustration="classroom-hall" alwaysAmbient />
              <div className="relative z-10 h-full grid place-items-center">
                <p className="text-eyebrow-display bg-paper-50/70 backdrop-blur-sm px-3 py-1 rounded">ambient · profile</p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}
