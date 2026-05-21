'use client'

import { TOAST_EVENT, type ToastTone } from '@/components/ui/ToastProvider'

export function showToast({
  tone = 'info',
  title,
  body,
}: {
  tone?: ToastTone
  title: string
  body?: string
}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { tone, title, body } }))
}
