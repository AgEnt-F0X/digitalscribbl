import Link from 'next/link'
import InteractiveIAMap from './InteractiveIAMap'
import { Shield, Database, Sparkles, Layers, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Interactive Information Architecture Map · Scribbl Dev Tools',
  description: 'Visual system mapping, database schemas, and route authorization hierarchy for Scribbl v2.',
}

export default function IAMapPage() {
  return (
    <div className="min-h-screen bg-paper-100 text-ink-900 selection:bg-amber-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-paper-300 bg-paper-100/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white border border-paper-300 hover:bg-paper-200 transition text-ink-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display font-black text-xl text-ink-900 tracking-tight flex items-center gap-2">
                <span>🗺️</span> Scribbl System Information Architecture
              </h1>
              <p className="text-xs text-gray-500 font-sans">
                Senior Design Engineering & PostgreSQL Database Mapping Tool
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>PostgreSQL + Cloudinary Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sunlit Lawn v2 Theme</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="font-display font-extrabold text-2xl text-ink-900">
            Interactive User Flow & System Architecture Map
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl">
            Explore the complete user lifecycle from the Sneak Peek Landing Page to the active Mobile Signing Studio and the final archived Yearbook composite. Click on nodes to highlight permissions, data models, and API boundaries.
          </p>
        </div>

        {/* Interactive Client Component */}
        <InteractiveIAMap />
      </main>
    </div>
  )
}
