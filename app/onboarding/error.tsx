'use client'

import PageError from '@/components/ui/PageError'

export default function OnboardingError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageError
      {...props}
      route="/onboarding"
      title="Onboarding hit a snag."
      description="Try refreshing. Your progress is saved as you go."
      homeHref="/login"
      homeLabel="Back to login"
    />
  )
}
