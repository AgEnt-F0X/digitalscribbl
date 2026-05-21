'use client'

import type { ReactNode } from 'react'
import { Sparkles, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AvatarCategory } from '../types'

interface AvatarStyleStepProps {
  value: AvatarCategory | null
  onChange: (category: AvatarCategory) => void
}

const OPTIONS: { id: AvatarCategory; title: string; body: string; icon: ReactNode }[] = [
  {
    id: 'masculine',
    title: 'Boys styles',
    body: 'Relaxed farewell-shirt silhouettes with simple shoulders and school-shirt proportions.',
    icon: <UserRound size={24} />,
  },
  {
    id: 'feminine',
    title: 'Girls styles',
    body: 'Soft upper-body presets with the same white half-sleeve scribble shirt system.',
    icon: <Sparkles size={24} />,
  },
]

export default function AvatarStyleStep({ value, onChange }: AvatarStyleStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            'group min-h-[220px] rounded-[26px] border-2 bg-paper-100 p-6 text-left shadow-[0_16px_35px_rgba(45,35,22,0.08)] transition hover:-translate-y-0.5',
            value === option.id ? 'border-ink-900' : 'border-black/10 hover:border-ink-900/45'
          )}
        >
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-paper-300 text-ink-900">
            {option.icon}
          </div>
          <h3 className="font-display text-3xl font-bold text-ink-900">{option.title}</h3>
          <p className="mt-3 text-sm leading-6 text-gray-600">{option.body}</p>
        </button>
      ))}
    </div>
  )
}
