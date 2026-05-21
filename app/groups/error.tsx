'use client'

import PageError from '@/components/ui/PageError'

export default function GroupsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} route="/groups" />
}
