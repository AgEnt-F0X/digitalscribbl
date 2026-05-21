'use client'

// Search field for the Explore page wrapped in the doc 18 § 14
// ink-underline. The wave draws on focus + stays drawn while the field
// has content, erases right-to-left when emptied. Server form submission
// is unchanged — this is a pure visual upgrade.

import { useState } from 'react'
import { Search } from 'lucide-react'
import InkUnderline from '@/components/forms/InkUnderline'

interface Props {
  defaultValue?: string
  name?: string
  placeholder?: string
  className?: string
  /** Optional aria-label when no visible label is rendered. */
  ariaLabel?: string
}

export function ExploreSearchField({
  defaultValue = '',
  name = 'q',
  placeholder = 'Search classmates by name…',
  className,
  ariaLabel = 'Search classmates by name',
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const active = focused || value.length > 0

  return (
    <label className={`relative flex-1 min-w-[200px] max-w-xs block ${className ?? ''}`}>
      <span className="sr-only">{ariaLabel}</span>
      <div className="relative">
        <Search
          aria-hidden="true"
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="input w-full pl-9"
        />
        <InkUnderline active={active} />
      </div>
    </label>
  )
}

export default ExploreSearchField
