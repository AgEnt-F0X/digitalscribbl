'use client'

import PageError from '@/components/ui/PageError'

export default function ExploreError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} route="/explore" />
}
