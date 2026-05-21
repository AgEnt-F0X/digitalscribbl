'use client'

import PageError from '@/components/ui/PageError'

export default function ScribbleStudioError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageError
      {...props}
      route="/shirts/[shirtId]/scribble"
      title="Couldn't open the signing studio."
      description="Something went wrong loading the shirt canvas. Try again — your draft (if any) is safe."
    />
  )
}
