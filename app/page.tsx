import Link from 'next/link'
import { getServerAuthContext } from '@/lib/auth/server'
import PlaceBackground from '@/components/place/PlaceBackground'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import CountdownTimer from '@/components/brand/CountdownTimer'
import { Sparkles, Edit3, ShieldCheck, Heart, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const { user, supabase } = await getServerAuthContext()

  let userProfile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, onboarding_completed, shirt_id')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  return (
    <div className="relative min-h-screen bg-paper-100 overflow-hidden text-ink-900 selection:bg-amber-200 selection:text-amber-900">
      {/* Background Campus Illustration Layer */}
      <PlaceBackground
        surface="login"
        illustration="lawn-golden-hour"
        alwaysVivid
        className="opacity-40 pointer-events-none"
      />

      {/* Floating Animated Doodles */}
      <DriftingDoodles density="high" />

      {/* Navigation Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-paper-300/50 bg-paper-100/60 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-black text-ink-900 tracking-tight">
          <span className="text-amber-600 text-3xl">✨</span> scribbl
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href={userProfile?.onboarding_completed ? '/dashboard' : '/onboarding'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-900 text-paper-100 font-semibold text-sm hover:bg-ink-800 transition shadow-md"
            >
              {userProfile?.onboarding_completed ? 'Go to Dashboard' : 'Complete Setup'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-ink-700 hover:text-ink-900 transition"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition shadow-md"
              >
                Claim Your Shirt
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center">
        {/* Banner Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/60 text-amber-900 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Class of 2026 Scribble Day Ritual</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-ink-900 leading-[1.1] max-w-3xl">
          Wear the shirt. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600">
            Let everyone sign it.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-xl text-gray-600 max-w-2xl font-sans leading-relaxed">
          The traditional last-day scribble ritual—recreated online as a one-month memory event, preserved forever in a digital class yearbook.
        </p>

        {/* Action CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {user ? (
            <Link
              href={userProfile?.onboarding_completed ? '/dashboard' : '/onboarding'}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-600 text-white font-display font-bold text-lg hover:bg-amber-700 transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              {userProfile?.onboarding_completed ? 'Open My Signing Studio' : 'Setup My Avatar & Shirt'}
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-600 text-white font-display font-bold text-lg hover:bg-amber-700 transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Claim My Shirt Now
            </Link>
          )}

          <a
            href="#sneak-peek"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/80 border border-paper-300 text-ink-800 font-semibold text-base hover:bg-white transition flex items-center justify-center gap-2"
          >
            Yearbook Sneak Peek
          </a>
        </div>

        {/* Live Countdown Component */}
        <div className="mt-14 w-full max-w-xl">
          <CountdownTimer
            title="Signing Phase Active"
            subtitle="The live signing window is open! Collect drawings, doodles, and voice notes before the Yearbook Flip."
          />
        </div>

        {/* Sneak Peek Yearbook Cover Section */}
        <div id="sneak-peek" className="mt-20 w-full">
          <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-paper-200/90 via-white/80 to-amber-50/90 border-2 border-paper-300 shadow-2xl overflow-hidden">
            {/* Lock Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-900/80 text-white text-xs font-semibold backdrop-blur">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Yearbook Gatekept</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="text-5xl mb-3">📖</span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900">
                Sneak Peek: Class of 2026 Composite
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-lg">
                Once the signing countdown ends, all shirts are permanently frozen and composited into Polaroid spreads, class stats, and downloadable yearbook cards.
              </p>

              {/* Blurred Preview Grid */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-4 rounded-2xl border border-white/60">
                  <div className="p-3 bg-white rounded-full shadow-md mb-2">
                    <ShieldCheck className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="font-display font-bold text-ink-900 text-base">Contents Locked Until Ceremony</p>
                  <p className="text-xs text-gray-600 mt-1 max-w-xs">
                    Get your friends to sign your shirt now so your final card looks amazing!
                  </p>
                </div>

                {/* Dummy Mockup Cards underneath the blur */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-paper-300 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 mb-2 flex items-center justify-center text-2xl">
                      🎓
                    </div>
                    <div className="w-20 h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="w-12 h-2 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          <div className="p-6 bg-white/90 rounded-2xl border border-paper-300 shadow-sm flex flex-col items-start">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-800 font-display font-black text-xl mb-4">
              01
            </div>
            <h3 className="font-display font-bold text-lg text-ink-900">Custom Avatar & Shirt</h3>
            <p className="text-sm text-gray-600 mt-2">
              Create your personalized illustrated avatar with your plain white shirt. You own your canvas.
            </p>
          </div>

          <div className="p-6 bg-white/90 rounded-2xl border border-paper-300 shadow-sm flex flex-col items-start">
            <div className="p-3 bg-rose-100 rounded-xl text-rose-800 font-display font-black text-xl mb-4">
              02
            </div>
            <h3 className="font-display font-bold text-lg text-ink-900">Mobile Signing Studio</h3>
            <p className="text-sm text-gray-600 mt-2">
              Share your link. Classmates draw doodles, write messages, drop stickers, and leave voice notes.
            </p>
          </div>

          <div className="p-6 bg-white/90 rounded-2xl border border-paper-300 shadow-sm flex flex-col items-start">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-800 font-display font-black text-xl mb-4">
              03
            </div>
            <h3 className="font-display font-bold text-lg text-ink-900">Class Yearbook Preserved</h3>
            <p className="text-sm text-gray-600 mt-2">
              At the ceremony flip, your shirt is printed into a high-res PNG and published in the class composite.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-paper-300 bg-white/80 py-8 px-6 text-center text-xs text-gray-500">
        <p className="flex items-center justify-center gap-1">
          Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for the Class of 2026
        </p>
        <p className="mt-1 text-[11px] text-gray-400">Scribbl · Digital Memories Preserved</p>
      </footer>
    </div>
  )
}
