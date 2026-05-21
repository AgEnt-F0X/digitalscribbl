'use client'

import PageError from '@/components/ui/PageError'

export default function ProfileError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} route="/profile/[userId]" />
}
