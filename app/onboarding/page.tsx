'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlaceBackground from '@/components/place/PlaceBackground'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import InkUnderline from '@/components/forms/InkUnderline'
import { Sparkles, Camera, ArrowRight, CheckCircle2, HelpCircle, X, School } from 'lucide-react'

interface SchoolOption {
  id: string
  name: string
}

interface ProgramOption {
  id: string
  academic_group_id: string
  name: string
}

interface BatchOption {
  id: string
  program_id: string
  graduation_year: number
  label: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<1 | 2>(1)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Step 1 State
  const [displayName, setDisplayName] = useState('')
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [pfpUrl, setPfpUrl] = useState<string | null>(null)
  const [isUploadingPfp, setIsUploadingPfp] = useState(false)

  // Step 2 State (Cascading Academic Data)
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [programs, setPrograms] = useState<ProgramOption[]>([])
  const [batches, setBatches] = useState<BatchOption[]>([])
  
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')

  // Unlisted Program Modal State
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [reqSchool, setReqSchool] = useState('')
  const [reqProgram, setReqProgram] = useState('')
  const [reqBatch, setReqBatch] = useState('Class of 2026')
  const [isSubmittingReq, setIsSubmittingReq] = useState(false)
  const [reqSubmitted, setReqSubmitted] = useState(false)

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

      // Fetch Academic Hierarchy Data
      const { data: schoolRows } = await supabase.from('academic_groups').select('id, name').order('name')
      const { data: programRows } = await supabase.from('programs').select('id, academic_group_id, name').order('name')
      const { data: batchRows } = await supabase.from('batches').select('id, program_id, graduation_year, label').order('graduation_year', { ascending: false })

      if (schoolRows && schoolRows.length > 0) {
        setSchools(schoolRows)
        // Default to CS school if available
        const csSchool = schoolRows.find(s => s.name.toLowerCase().includes('computer')) ?? schoolRows[0]
        setSelectedSchoolId(csSchool.id)
      }

      if (programRows && programRows.length > 0) {
        setPrograms(programRows)
      }

      if (batchRows && batchRows.length > 0) {
        setBatches(batchRows)
      }
    }

    bootstrap()
  }, [router, supabase])

  // Filtered Programs based on Selected School
  const availablePrograms = useMemo(() => {
    if (!selectedSchoolId) return programs
    return programs.filter(p => p.academic_group_id === selectedSchoolId)
  }, [programs, selectedSchoolId])

  // Auto-select first program when school changes
  useEffect(() => {
    if (availablePrograms.length > 0) {
      setSelectedProgramId(availablePrograms[0].id)
    } else {
      setSelectedProgramId('')
    }
  }, [availablePrograms])

  // Filtered Batches based on Selected Program
  const availableBatches = useMemo(() => {
    if (!selectedProgramId) return batches
    return batches.filter(b => b.program_id === selectedProgramId)
  }, [batches, selectedProgramId])

  // Auto-select first batch when program changes
  useEffect(() => {
    if (availableBatches.length > 0) {
      setSelectedBatchId(availableBatches[0].id)
    } else {
      setSelectedBatchId('')
    }
  }, [availableBatches])

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

  // Handle Unlisted Program Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqSchool || !reqProgram || !reqBatch) return

    setIsSubmittingReq(true)
    try {
      const res = await fetch('/api/onboarding/request-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: reqSchool,
          programName: reqProgram,
          batchLabel: reqBatch,
        }),
      })

      if (res.ok) {
        setReqSubmitted(true)
        setTimeout(() => {
          setShowRequestModal(false)
          setReqSubmitted(false)
        }, 2000)
      }
    } catch {
      /* ignore */
    } finally {
      setIsSubmittingReq(false)
    }
  }

  // Complete Onboarding
  const handleComplete = async () => {
    if (!userId || !displayName.trim() || !enrollmentNumber.trim()) {
      setError('Please fill in your name and enrollment number.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      displayName: displayName.trim(),
      enrollmentNumber: enrollmentNumber.trim(),
      academicGroupId: selectedSchoolId,
      programId: selectedProgramId,
      batchId: selectedBatchId,
      avatarConfig: {
        presetId: 'm-classic-straight',
        skinToneId: 'skin_03',
        skinTone: { depth: 50, undertone: 50, hex: '#e5b899' },
        headSource: pfpUrl ? 'upload' : 'skipped',
        frontFaceImageUrl: pfpUrl ?? undefined,
        lockedAt: new Date().toISOString(),
      },
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

  const selectedSchoolObj = schools.find(s => s.id === selectedSchoolId)
  const selectedProgramObj = programs.find(p => p.id === selectedProgramId)
  const selectedBatchObj = batches.find(b => b.id === selectedBatchId)

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
            <span>Step {step} of 2</span>
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
                {displayName || 'Your Full Name'}
              </h2>
              <p className="text-xs font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md mt-1 border border-amber-200">
                {enrollmentNumber || 'Enrollment Number'}
              </p>

              <div className="mt-4 pt-4 border-t border-paper-200 w-full text-xs text-gray-600 flex flex-col gap-1">
                <p className="font-medium text-ink-800">{selectedSchoolObj?.name ?? 'Bennett University'}</p>
                <p className="text-gray-500">{selectedProgramObj?.name ?? 'Program'} · {selectedBatchObj?.label ?? 'Class of 2026'}</p>
              </div>

              <div className="mt-4 px-3 py-1.5 rounded-full bg-paper-100 text-[11px] font-semibold text-gray-500 border border-paper-300">
                ✨ Virtual Shirt #1 Ready
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3 max-w-xs">
              Don’t worry! You can personalize your full 3D Avatar & AI head anytime inside your dashboard after setup.
            </p>
          </div>

          {/* Right Column: Step Controls Form */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-2 border-paper-300 shadow-xl">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Phase 1 · Step 1</span>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-ink-900 mt-1">
                    Student Identity & Photo
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Enter your display name and upload a real profile photo so classmates can easily identify you.
                  </p>
                </div>

                {/* Display Name Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Full Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Rudra Prasad"
                    className="w-full px-4 py-3 rounded-xl border border-paper-300 bg-paper-100/60 font-sans text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                  <InkUnderline active={displayName.length > 0} />
                </div>

                {/* Enrollment Number Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Roll / Enrollment Number *
                  </label>
                  <input
                    type="text"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    placeholder="e.g. E22CSEU1042"
                    className="w-full px-4 py-3 rounded-xl border border-paper-300 bg-paper-100/60 font-mono text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                  <InkUnderline active={enrollmentNumber.length > 0} />
                </div>

                {/* PFP Upload Option */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Profile Photo (PFP)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-paper-200 border border-paper-300 text-ink-900 font-semibold text-xs hover:bg-paper-300 transition shadow-sm">
                      <Camera className="w-4 h-4 text-amber-600" />
                      <span>{pfpUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePfpUpload} className="hidden" />
                    </label>
                    <span className="text-xs text-gray-500">PNG, JPG or WebP (max 5MB)</span>
                  </div>
                </div>

                {/* Next Step Button */}
                <button
                  onClick={() => {
                    if (!displayName.trim() || !enrollmentNumber.trim()) {
                      setError('Please enter your full name and enrollment number.')
                      return
                    }
                    setError(null)
                    setStep(2)
                  }}
                  className="mt-4 w-full py-4 rounded-2xl bg-amber-600 text-white font-display font-bold text-base hover:bg-amber-700 transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>Continue to School & Batch</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Phase 1 · Step 2</span>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-ink-900 mt-1">
                    Select Your School & Program
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Select your Bennett University academic school, degree program, and graduation batch.
                  </p>
                </div>

                {/* CSE Launch Focus Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      Active Launch Focus
                    </span>
                    <span className="text-xs font-bold text-amber-700">Class of 2026</span>
                  </div>
                  <h3 className="font-display font-black text-lg text-ink-900 mt-1">
                    School of Computer Science & Engineering
                  </h3>
                  <p className="text-xs text-gray-600 font-sans">
                    Program: <strong className="text-ink-900">B.Tech Computer Science (CSE)</strong>
                  </p>
                </div>

                {/* Contact Me / Request Course Button */}
                <div className="p-4 rounded-xl bg-paper-100 border border-paper-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-left text-xs">
                    <p className="font-bold text-ink-900">From another school or course?</p>
                    <p className="text-gray-500">Contact me to add your school and batch immediately.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(true)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-white border border-amber-400 text-amber-900 font-bold text-xs hover:bg-amber-50 transition shadow-xs flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Contact Me / Add Course</span>
                  </button>
                </div>

                {/* Buttons */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-4 rounded-2xl bg-paper-200 border border-paper-300 text-ink-800 font-semibold text-sm hover:bg-paper-300 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={saving}
                    className="flex-1 py-4 rounded-2xl bg-amber-600 text-white font-display font-bold text-base hover:bg-amber-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <span>Saving Profile...</span>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Complete Setup & Enter App</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Unlisted Program Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-paper-300 shadow-2xl p-6 sm:p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-paper-100 text-gray-400 hover:text-ink-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <School className="w-5 h-5 text-amber-600" />
              <h3 className="font-display font-bold text-xl text-ink-900">Request Course / Batch</h3>
            </div>
            <p className="text-xs text-gray-600 mb-6">
              Let us know which school or program you belong to, and we will activate it in the database immediately!
            </p>

            {reqSubmitted ? (
              <div className="py-6 text-center text-emerald-800 font-semibold text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                <span>Request Logged! We will add your course right away.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-gray-700 mb-1">School Name</label>
                  <input
                    type="text"
                    required
                    value={reqSchool}
                    onChange={(e) => setReqSchool(e.target.value)}
                    placeholder="e.g. School of Media & Liberal Arts"
                    className="w-full px-3 py-2.5 rounded-xl border border-paper-300 bg-paper-100/60 font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-700 mb-1">Program Name</label>
                  <input
                    type="text"
                    required
                    value={reqProgram}
                    onChange={(e) => setReqProgram(e.target.value)}
                    placeholder="e.g. BA Journalism & Mass Comm"
                    className="w-full px-3 py-2.5 rounded-xl border border-paper-300 bg-paper-100/60 font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-700 mb-1">Graduation Batch</label>
                  <input
                    type="text"
                    required
                    value={reqBatch}
                    onChange={(e) => setReqBatch(e.target.value)}
                    placeholder="e.g. Class of 2026"
                    className="w-full px-3 py-2.5 rounded-xl border border-paper-300 bg-paper-100/60 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="mt-2 py-3 rounded-xl bg-ink-900 text-white font-bold hover:bg-ink-800 transition"
                >
                  {isSubmittingReq ? 'Submitting...' : 'Submit Program Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
