'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlaceBackground from '@/components/place/PlaceBackground'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import { Sparkles, Camera, ArrowRight, CheckCircle2 } from 'lucide-react'

interface LookupResult {
  found: boolean
  code?: string
  program?: {
    id: string
    key: string
    name: string
    batchesEnabled: boolean
    batchCount: number | null
  } | null
  graduationYear?: number | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState<string | null>(null)

  // Step 1: who you are.
  const [displayName, setDisplayName] = useState('')
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [pfpUrl, setPfpUrl] = useState<string | null>(null)
  const [isUploadingPfp, setIsUploadingPfp] = useState(false)

  // The roster says which program this number belongs to. No school dropdown,
  // no program dropdown: the student cannot pick a school, and the server
  // re-verifies the pairing at completion, so a tampered program id fails.
  const [lookingUp, setLookingUp] = useState(false)
  const [lookup, setLookup] = useState<LookupResult | null>(null)

  // Batch is an Explore filter, never a gate. Sending null is the normal path
  // for every course-wide program; an out-of-range CSE batch falls back to
  // course scope server-side instead of erroring.
  const [batch, setBatch] = useState<string>('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user & academic dropdown data
  useEffect(() => {
    async function bootstrap() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setDisplayName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '')

      // Check if user is guest or already completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed, is_guest, is_university_verified')
        .eq('id', user.id)
        .single()

      if (profile?.is_guest && !profile.is_university_verified) {
        router.push('/onboarding/guest')
        return
      }

      if (profile?.onboarding_completed) {
        router.push('/dashboard')
        return
      }

      // There is no academic dropdown to fill. The roster is the only source of
      // which program this student is in, and it is looked up server-side from
      // the enrollment number — never shipped to the browser in full.
    }

    bootstrap()
  }, [router, supabase])

  // Handle PFP Upload
  const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPfp(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('side', 'front')

      const res = await fetch('/api/avatar/upload-head', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        setPfpUrl(data.url)
      } else {
        setError(data.error ?? 'PFP Upload failed')
      }
    } catch {
      setError('Failed to upload image')
    } finally {
      setIsUploadingPfp(false)
    }
  }

  // Lookup the program for the typed number. Deliberately separate from the
  // completion call so the student SEES what the roster says before committing:
  // "we found you in B.Tech CSE — continue?" is trust; a silent bind is not.
  const handleLookup = async () => {
    const trimmed = enrollmentNumber.trim()
    if (!trimmed) {
      setError('Type your enrollment number first.')
      return
    }

    setLookingUp(true)
    setError(null)
    setLookup(null)

    try {
      const res = await fetch('/api/onboarding/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment: trimmed }),
      })

      if (!res.ok) {
        setError('Could not look that up. Try again in a moment.')
        return
      }

      const data = await res.json() as LookupResult
      setLookup(data)

      if (!data.found) {
        setError(
          data.code === 'invalid'
            ? 'That does not look like an enrollment number. Check it and try again.'
            : 'That number is not on the convocation list we have. Check it and try again, or ask an admin.',
        )
      } else if (data.program) {
        setBatch('')
      }
    } catch {
      setError('Could not look that up. Try again in a moment.')
    } finally {
      setLookingUp(false)
    }
  }

  // Complete Onboarding
  const handleComplete = async () => {
    if (!userId || !displayName.trim() || !lookup?.found || !lookup.program?.id) {
      setError('Look up your enrollment number first, then finish.')
      return
    }

    setSaving(true)
    setError(null)

    const batchNumber = batch.trim() === '' ? null : Number(batch)

    const payload = {
      displayName: displayName.trim(),
      enrollmentNumber: enrollmentNumber.trim(),
      programId: lookup.program.id,
      batch: batchNumber,
    }

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        // Clear local draft and go to dashboard!
        localStorage.removeItem('scribbl-onboarding-draft')
        router.push('/dashboard')
      } else {
        setError(data.error ? `Could not save: ${data.error}` : 'Could not complete setup. Please try again.')
        setSaving(false)
      }
    } catch {
      setError('Network error during setup. Please try again.')
      setSaving(false)
    }
  }

  const program = lookup?.found ? lookup.program : null

  return (
    <div className="relative min-h-screen bg-paper-100 text-ink-900 selection:bg-amber-200">
      <PlaceBackground surface="login" illustration="lawn-golden-hour" alwaysVivid className="opacity-40 pointer-events-none" />
      <DriftingDoodles density="medium" />

      {/* Header */}
      <header className="relative z-20 border-b border-paper-300 bg-paper-100/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-display text-2xl font-black text-ink-900 tracking-tight flex items-center gap-2">
            <span className="text-amber-600 text-3xl">✨</span> scribbl
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>One number · one minute</span>
          </div>
        </div>
      </header>

      {/* Studio Split-Screen Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Live Identity Preview Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full p-6 bg-white rounded-3xl border-2 border-paper-300 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-28 h-28 rounded-full bg-paper-200 border-2 border-paper-300 overflow-hidden relative mb-4 flex items-center justify-center shadow-inner">
                {pfpUrl ? (
                  <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🎓</span>
                )}
                {isUploadingPfp && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                    Uploading...
                  </div>
                )}
              </div>

              <h2 className="font-display font-black text-xl text-ink-900 truncate max-w-full">
                {displayName || 'Your name'}
              </h2>
              <p className="text-xs font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md mt-1 border border-amber-200">
                {enrollmentNumber.trim() || 'Enrollment number'}
              </p>

              <div className="mt-4 pt-4 border-t border-paper-200 w-full text-xs text-gray-600 flex flex-col gap-1">
                <p className="font-medium text-ink-800">{program?.name ?? 'Bennett University'}</p>
                <p className="text-gray-500">
                  {batch.trim() !== '' && program?.batchesEnabled ? `Batch ${batch.trim()}` : 'Class of 2026'}
                </p>
              </div>

              <div className="mt-4 px-3 py-1.5 rounded-full bg-paper-100 text-[11px] font-semibold text-gray-500 border border-paper-300">
                ✨ Virtual Shirt #1 Ready
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3 max-w-xs">
              Your shirt is created the moment you finish — open to signatures, no setup.
            </p>
          </div>

          {/* Right Column: The one screen */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-2 border-paper-300 shadow-xl">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-ink-900 mt-1">
                  What is your enrollment number?
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  That is the whole sign-up. The convocation list confirms your program — there is nothing to pick.
                </p>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  What should classmates call you? *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-paper-300 bg-paper-100/60 font-sans"
                />
              </div>

              {/* Enrollment Input + Lookup */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Enrollment number *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={enrollmentNumber}
                    onChange={(e) => {
                      setEnrollmentNumber(e.target.value)
                      setLookup(null)
                    }}
                    placeholder="As printed on your ID card"
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 px-4 py-3 rounded-xl border border-paper-300 bg-paper-100/60 font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={lookingUp || enrollmentNumber.trim().length === 0}
                    className="px-5 py-3 rounded-xl bg-ink-900 text-white text-sm font-bold hover:bg-ink-800 transition disabled:opacity-50 shrink-0"
                  >
                    {lookingUp ? 'Checking…' : 'Check'}
                  </button>
                </div>

                {lookup?.found && lookup.program && (
                  <div className="mt-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                    <span>
                      Found you in <strong>{lookup.program.name}</strong>
                      {lookup.graduationYear ? ` · Class of ${lookup.graduationYear}` : ''}.
                      Is that right?
                    </span>
                  </div>
                )}

                {lookup?.found && !lookup.program && (
                  <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    That number is on the list, but its program is not open yet. Talk to an admin and we will add it.
                  </div>
                )}
              </div>

              {/* Optional batch — only when the program actually has sections */}
              {lookup?.found && program?.batchesEnabled && (program.batchCount ?? 0) > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Section <span className="text-gray-400 font-normal">(optional — just helps friends find you)</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={program.batchCount ?? 52}
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="Leave blank if unsure"
                    className="w-full px-4 py-3 rounded-xl border border-paper-300 bg-paper-100/60 font-sans"
                  />
                </div>
              )}

              {/* PFP Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Photo <span className="text-gray-400 font-normal">(optional for now)</span>
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-paper-300 bg-paper-100/40 cursor-pointer hover:border-amber-400 transition">
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-600 font-sans">
                    {pfpUrl ? 'Change photo' : 'Add a photo so classmates recognise you'}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePfpUpload} className="hidden" />
                </label>
              </div>

              {/* The roster has confirmed the program above, so this is one tap. */}
              <button
                onClick={handleComplete}
                disabled={saving || !lookup?.found || !lookup.program?.id}
                className="py-4 rounded-2xl bg-amber-600 text-white font-display font-bold text-base hover:bg-amber-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <span>Creating your shirt…</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Get my shirt</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center font-sans">
                Your shirt stays open for signatures unless you change it in Settings.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
