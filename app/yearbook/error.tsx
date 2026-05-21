'use client'

import PageError from '@/components/ui/PageError'

export default function YearbookError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} route="/yearbook" />
}
