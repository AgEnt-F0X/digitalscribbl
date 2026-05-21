'use client'

// ShareButton — copy-the-profile-URL CTA. Used on the dashboard hero (as
// the primary share invitation) and on the profile page (owner action row).
//
// The `variant` prop picks the chrome family so the same component can wear
// the brand's primary pencil-button on a hero, the idle pencil-button on a
// secondary cluster, or the older `.btn-secondary` chrome on tight surfaces
// where the pencil-button's 44px tap target would crowd a row of metadata.
// Custom `className` still threads through for one-off overrides.

import { useState } from 'react'
import { showToast } from '@/lib/hooks/useToast'
import { cn } from '@/lib/utils/cn'

export type ShareButtonVariant = 'primary' | 'pencil' | 'secondary'

interface ShareButtonProps {
  profileUrl: string
  label?: string
  className?: string
  variant?: ShareButtonVariant
}

const VARIANT_CLASS: Record<ShareButtonVariant, string> = {
  primary:   'pencil-button-primary',
  pencil:    'pencil-button',
  secondary: 'btn-secondary text-xs px-3 py-1.5',
}

export default function ShareButton({
  profileUrl,
  label = 'Share link',
  className,
  variant = 'secondary',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      showToast({ tone: 'success', title: 'Link copied' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast({ tone: 'error', title: 'Could not copy link', body: profileUrl })
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Link copied to clipboard' : `${label} — copies your profile URL`}
      className={cn(VARIANT_CLASS[variant], className)}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
