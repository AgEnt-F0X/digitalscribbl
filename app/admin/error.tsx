'use client'

import PageError from '@/components/ui/PageError'

export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} route="/admin" homeHref="/dashboard" />
}
