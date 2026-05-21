// Sunlit Lawn — design-system demo page (dev only).
// Doc 18, Phase 1B exit gate. Visual QA harness for every primitive shipped
// by Subagent A. Hidden in production: `notFound()` so accidental deploy
// doesn't expose internal scaffolding.

import { notFound } from 'next/navigation'
import SunlitLawnDemo from './SunlitLawnDemo'

export const dynamic = 'force-dynamic'

export default function SunlitLawnDemoPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return <SunlitLawnDemo />
}
