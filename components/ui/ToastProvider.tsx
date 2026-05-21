'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  tone: ToastTone
  title: string
  body?: string
}

export const TOAST_EVENT = 'scribbl:toast'

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error:   'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info:    'border-blue-200 bg-blue-50 text-blue-900',
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<ToastMessage, 'id'> & { id?: string }>).detail
      const id = detail.id ?? crypto.randomUUID()
      const toast = { ...detail, id }
      setToasts(prev => [toast, ...prev].slice(0, 4))
      window.setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== id))
      }, 4200)
    }

    window.addEventListener(TOAST_EVENT, onToast)
    return () => window.removeEventListener(TOAST_EVENT, onToast)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-3 top-3 z-[100] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn('rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur', TONE_CLASS[toast.tone])}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{toast.title}</p>
              {toast.body && <p className="mt-0.5 text-xs opacity-80">{toast.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
              className="shrink-0 rounded-md px-1 text-xs opacity-60 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
