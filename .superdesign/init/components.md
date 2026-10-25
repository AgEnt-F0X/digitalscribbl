# Shared UI Components (source of truth)

Full source for every shared UI primitive under `components/**` and the reusable
sub-primitives under `src/features/scribble/components/`.
Route-level compositions live in `app/**` and are listed in `pages.md` instead.

---

## `components/ui/EmptyState.tsx` — `EmptyState`

Single empty-state primitive used across the app; always paper-note styled, centered, warm.

**Key props:** `icon?: ReactNode`, `title: string` (required), `description?: string`, `action?: ReactNode`, `className?: string`

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  /** A single hand-drawn-feeling doodle or emoji. Keep it tiny (32–48px). */
  icon?: ReactNode
  /** Short emotional heading, will be rendered in handwritten font. */
  title: string
  /** Optional explanatory copy, kept brief and warm. */
  description?: string
  /** Optional primary action (typically a pencil-button). */
  action?: ReactNode
  className?: string
}

/**
 * The single empty-state component used across the app.
 * Always paper-note styled, always centered, always warm.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('paper-note px-6 py-8 text-center max-w-md mx-auto', className)}>
      {icon && (
        <div className="grid place-items-center text-3xl mb-3 text-ink-500" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-display text-2xl text-ink-900 leading-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex items-center justify-center">{action}</div>}
    </div>
  )
}
```

---

## `components/ui/PageError.tsx` — `PageError` (default export)

Shared `error.tsx` body. POSTs the error to `/api/errors/report` on mount and renders a
retry + back-to-dashboard pair. Client component.

**Key props:** `error: Error & { digest?: string }`, `reset: () => void`, `route: string`,
`title = 'Something tore the paper.'`, `description`, `homeHref = '/dashboard'`, `homeLabel`

```tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface PageErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  route: string
  /** Override the headline if the default ("Something tore the paper.") doesn't fit. */
  title?: string
  /** Override the description copy. */
  description?: string
  /** Override the destination of the secondary action. */
  homeHref?: string
  /** Override the secondary action label. */
  homeLabel?: string
}

/**
 * Shared error.tsx body. Every route's error.tsx imports this so
 * styling + reporting are consistent.
 */
export default function PageError({
  error,
  reset,
  route,
  title = 'Something tore the paper.',
  description = 'We hit an unexpected error. Try again, and if it keeps happening, tap the report button at the bottom.',
  homeHref = '/dashboard',
  homeLabel = 'Back to dashboard',
}: PageErrorProps) {
  useEffect(() => {
    void fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route,
        message: error.message,
        digest: error.digest,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }),
    }).catch(() => {})
  }, [error, route])

  return (
    <div className="scribbl-page min-h-screen grid place-items-center px-6 py-12">
      <div className="paper-note px-6 py-8 text-center max-w-md w-full">
        <div className="text-4xl mb-2" aria-hidden="true">📓</div>
        <h1 className="font-display text-3xl text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">{description}</p>
        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-ink-300">Ref: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href={homeHref} className="btn-secondary">{homeLabel}</Link>
        </div>
      </div>
    </div>
  )
}
```

---

## `components/ui/PageLoading.tsx` — `PageLoading` (default export)

Shared `loading.tsx` body; five skeleton layouts keyed by `shape`.

**Key props:** `shape?: 'list' | 'shirt' | 'form' | 'studio' | 'table'` (default `list`)

```tsx
import { Skeleton } from './Skeleton'

interface PageLoadingProps {
  /**
   * The layout shape to skeletonize.
   *  - 'list': vertical stack of cards (explore, groups)
   *  - 'shirt': avatar centerpiece + side panels (profile, dashboard)
   *  - 'form': field stack (settings, onboarding)
   *  - 'studio': scribble studio (canvas + tools)
   *  - 'table': admin tables
   */
  shape?: 'list' | 'shirt' | 'form' | 'studio' | 'table'
}

/**
 * Shared loading.tsx body. Uses the paper-shimmer skeleton style so loading
 * feels like part of the design language, not a generic spinner.
 */
export default function PageLoading({ shape = 'list' }: PageLoadingProps) {
  return (
    <div className="scribbl-page min-h-screen">
      {/* Compact header shimmer */}
      <div className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(45,41,35,0.10)' }}>
        <Skeleton variant="rect" className="h-7 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton variant="rect" className="h-8 w-24" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {shape === 'list' && (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-24" />
            ))}
          </div>
        )}

        {shape === 'shirt' && (
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <Skeleton variant="rect" className="h-8 w-20" />
                <Skeleton variant="rect" className="h-8 w-20" />
              </div>
              <Skeleton variant="card" className="h-[360px] md:h-[460px] w-full max-w-sm" />
              <div className="flex gap-2 w-full max-w-sm">
                <Skeleton variant="rect" className="h-10 flex-1" />
                <Skeleton variant="rect" className="h-10 flex-1" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton variant="card" className="h-40" />
              <Skeleton variant="card" className="h-32" />
              <Skeleton variant="card" className="h-28" />
            </div>
          </div>
        )}

        {shape === 'form' && (
          <div className="space-y-4 max-w-2xl">
            <Skeleton variant="card" className="h-28" />
            <Skeleton variant="card" className="h-20" />
            <Skeleton variant="card" className="h-20" />
            <Skeleton variant="card" className="h-44" />
            <Skeleton variant="rect" className="h-12 w-40" />
          </div>
        )}

        {shape === 'studio' && (
          <div className="grid gap-4 md:grid-cols-[260px_1fr_300px]">
            <Skeleton variant="card" className="h-[560px] hidden md:block" />
            <Skeleton variant="card" className="h-[560px]" />
            <Skeleton variant="card" className="h-[560px] hidden md:block" />
          </div>
        )}

        {shape === 'table' && (
          <div className="space-y-3">
            <div className="flex justify-between mb-2">
              <Skeleton variant="rect" className="h-10 w-64" />
              <Skeleton variant="rect" className="h-10 w-32" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-14" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## `components/ui/Skeleton.tsx` — `Skeleton`, `SkeletonText`, `PageShellSkeleton`

Paper-shimmer skeleton primitives. `Skeleton` is the atomic block; `SkeletonText` stacks
`line` variants; `PageShellSkeleton` is the page frame used by root `loading.tsx`.

**Key props:** `variant?: 'line' | 'circle' | 'rect' | 'card'` (default `rect`),
`lines?: number` (default 3), `children`, `className`

```tsx
import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'line' | 'circle' | 'rect' | 'card'
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  const variants = {
    line:   'h-3 rounded-full',
    circle: 'rounded-full',
    rect:   'rounded-xl',
    card:   'rounded-2xl',
  } as const

  return (
    <div
      className={cn('paper-skeleton', variants[variant], className)}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="line"
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function PageShellSkeleton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn('min-h-screen bg-paper-100 px-4 py-6 sm:px-6 lg:px-8', className)}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </main>
  )
}
```

---

## `components/ui/ToastProvider.tsx` — `ToastProvider`, `TOAST_EVENT`, `ToastTone`

Global toast host. Listens for the `scribbl:toast` window CustomEvent (fired by
`lib/hooks/useToast`'s `showToast`), stacks up to 4 toasts, auto-dismisses after 4200 ms.
Mounted once in `app/layout.tsx`.

**Key props:** none (no props)

```tsx
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
```

---

## `components/forms/InkCheckbox.tsx` — `InkCheckbox` (named + default)

Controlled checkbox whose check stroke draws itself in via `stroke-dashoffset` with a
cubic-bezier overshoot. Space/Enter toggles.

**Key props:** `checked: boolean`, `onChange: (next: boolean) => void`, `label?: string`,
`disabled?: boolean`, `id?: string`, `ariaLabel?: string`, `className?: string`

```tsx
'use client'

// InkCheckbox — controlled checkbox styled as a paper-and-ink mark.
// Doc 18 § 14. The check stroke draws in on change; cubic-bezier overshoot
// at the tail gives the "lifted the pen" feel.

import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/utils/cn'

interface InkCheckboxProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  /** Pass-through id for label[for]. */
  id?: string
  /** Override aria-label when no visible label is rendered. */
  ariaLabel?: string
}

const CHECK_LENGTH = 20

export function InkCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  id,
  ariaLabel,
}: InkCheckboxProps) {
  const toggle = () => {
    if (disabled) return
    onChange(!checked)
  }

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-2 select-none',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        id={id}
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKey}
        className={cn(
          'relative inline-grid place-items-center',
          'min-h-[44px] min-w-[44px] p-2 rounded-lg',
          'transition-colors',
          'focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--brand)]',
        )}
      >
        <span
          className={cn(
            'relative grid place-items-center',
            'h-6 w-6 rounded-md border bg-white',
            'transition-colors',
          )}
          style={{
            borderColor: checked ? 'var(--ink-bleed)' : 'var(--line-strong)',
          }}
        >
          <svg
            className="ink-check absolute inset-0 m-auto"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path
              d="M3 8 L7 12 L13 4"
              stroke="var(--ink-bleed)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray:  CHECK_LENGTH,
                strokeDashoffset: checked ? 0 : CHECK_LENGTH,
                transition:       'stroke-dashoffset 250ms cubic-bezier(0.45, 1.4, 0.6, 1)',
              }}
            />
          </svg>
        </span>
      </button>
      {label ? (
        <span className="text-sm text-ink-900">{label}</span>
      ) : null}
    </label>
  )
}

export default InkCheckbox
```

---

## `components/forms/InkUnderline.tsx` — `InkUnderline` (named + default)

SVG wave that draws itself under a focused/filled input; erases right-to-left when `active`
is false. Decorative (`aria-hidden`), absolutely positioned by the caller.

**Key props:** `active: boolean`, `className?: string`

```tsx
// InkUnderline — SVG wave that draws itself under a focused input.
// Doc 18 § 14. Stays drawn while the field has a value; erases right-to-left
// when the user clears it back to empty.

import { cn } from '@/lib/utils/cn'

interface InkUnderlineProps {
  active: boolean
  className?: string
}

const PATH_LENGTH = 200

export function InkUnderline({ active, className }: InkUnderlineProps) {
  return (
    <svg
      className={cn(
        'ink-underline pointer-events-none absolute inset-x-0 -bottom-1 h-2',
        className,
      )}
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 4 Q 50 1 100 4 T 198 4"
        stroke="var(--ink-bleed)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray:  PATH_LENGTH,
          strokeDashoffset: active ? 0 : PATH_LENGTH,
          transition:       'stroke-dashoffset 350ms ease-out',
        }}
      />
    </svg>
  )
}

export default InkUnderline
```

---

## `components/avatar/Avatar.tsx` — `Avatar` (default export)

The single avatar component for the app. Accepts a full user row, a pre-resolved config,
or a bare preset id, then delegates rendering to `AvatarRenderer`. `shirtColor` is
decorative-only — the shirt is always the white scribbling surface.

**Key props:** `row?`, `config?`, `presetId?`, legacy `bodyStyle` / `headFrontUrl` /
`headBackUrl`, `showBack?` / `side?: 'front' | 'back'`, `size?: AvatarSize` (default `lg`),
`className?`, `displayName?`, `scribbles?: { id, x, y, w, h, canvas_svg }[]`, `scribbleCount?: number`

```tsx
'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { resolveAvatar, type AvatarSourceRow } from '@/lib/utils/avatarResolve'
import AvatarRenderer from '@/src/features/avatar/components/AvatarRenderer'
import type { AvatarPresetId, UserAvatarConfig } from '@/src/features/avatar/types'

/**
 * The single avatar component for the entire app (Route 1).
 *
 * Caller patterns:
 *
 *  1) Modern — pass the full user row, we resolve the preset:
 *     <Avatar row={profile} size="md" />
 *
 *  2) Pre-resolved — pass an explicit config (e.g. from `resolveAvatar`):
 *     <Avatar config={resolved.config} size="md" />
 *
 *  3) Lightweight — pass just a presetId (no head image, no skin tone):
 *     <Avatar presetId="m-classic-straight" size="sm" />
 *
 * The old `AvatarDisplay` props (`bodyStyle`, `headFrontUrl`,
 * `shirtColor`, `showBack`, etc.) are also accepted for migration ease.
 * `shirtColor` is now decorative-only — the shirt is always the same
 * white scribbling surface.
 */

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

const SIZE_TO_MAX_WIDTH_PX: Record<AvatarSize, number> = {
  sm: 80,
  md: 156,
  lg: 240,
  xl: 340,
  hero: 440,
}

export interface AvatarProps {
  /** Pass the full user row — easiest for page migrations. */
  row?: AvatarSourceRow | null
  /** Pre-resolved config (from `resolveAvatar`). Beats `row` when both passed. */
  config?: UserAvatarConfig
  /** Direct preset id — minimal usage (e.g. small cards). Beats both above. */
  presetId?: AvatarPresetId

  /** Legacy compatibility (will resolve via `body_style` map). */
  bodyStyle?: string | null
  headFrontUrl?: string | null
  headBackUrl?: string | null

  /** Show the back of the shirt (alias for `side="back"`). */
  showBack?: boolean
  /** Modern API. Beats `showBack`. */
  side?: 'front' | 'back'

  size?: AvatarSize
  className?: string

  /** Owner display name — threads into aria labels for screen readers. */
  displayName?: string

  /**
   * Existing scribbles painted onto the shirt. Each item references a
   * `scribbles.canvas_svg` blob normalised into the 400x600 shirt-coordinate
   * space.
   */
  scribbles?: {
    id: string
    x: number
    y: number
    w: number
    h: number
    canvas_svg: string | null
  }[]

  /** Optional badge count rendered at the bottom-right. */
  scribbleCount?: number
}

export default function Avatar({
  row,
  config,
  presetId,
  bodyStyle,
  headFrontUrl,
  headBackUrl,
  showBack,
  side,
  size = 'lg',
  className,
  displayName,
  scribbles = [],
  scribbleCount,
}: AvatarProps) {
  const resolved = useMemo<UserAvatarConfig>(() => {
    if (config) return config

    if (presetId) {
      const base = resolveAvatar({
        avatar_config: { presetId },
        head_front_url: headFrontUrl ?? null,
        head_back_url: headBackUrl ?? null,
      })
      return base.config
    }

    return resolveAvatar(
      row ?? {
        body_style: bodyStyle ?? null,
        head_front_url: headFrontUrl ?? null,
        head_back_url: headBackUrl ?? null,
      },
    ).config
  }, [config, presetId, row, bodyStyle, headFrontUrl, headBackUrl])

  const renderSide = side ?? (showBack ? 'back' : 'front')
  const ownerLabel = displayName?.trim()
  const a11yLabel = ownerLabel ? `${ownerLabel}'s avatar` : 'Scribbl avatar'

  return (
    <div
      className={cn('relative inline-flex flex-col items-center justify-start', className)}
      style={{ width: '100%', maxWidth: SIZE_TO_MAX_WIDTH_PX[size] }}
      aria-label={a11yLabel}
    >
      <AvatarRenderer
        presetId={resolved.presetId}
        side={renderSide}
        skinToneId={resolved.skinToneId}
        frontFaceImageUrl={resolved.frontFaceImageUrl ?? null
        }
        backHairImageUrl={resolved.backHairImageUrl ?? null}
        frontFaceTransform={resolved.frontFaceTransform}
        backHairTransform={resolved.backHairTransform}
        scribbles={scribbles}
        className="w-full"
      />

      {typeof scribbleCount === 'number' && (
        <div className="absolute -bottom-1 right-2 min-w-[24px] rounded-full bg-ink-900 px-2 py-0.5 text-center text-[11px] font-bold leading-none text-white shadow-sm">
          {scribbleCount}
        </div>
      )}
    </div>
  )
}
```

---

## `components/brand/AvatarHalo.tsx` — `AvatarHalo` (named + default)

Soft `brand-soft` radial gradient behind an avatar. Purely decorative; sits at z-0.

**Key props:** `width = '70%'`, `height = '40%'`, `top`/`left`/`right`/`bottom`
(`number | string`, numbers are px), `className?`

```tsx
// AvatarHalo — soft brand-soft radial gradient behind the user's avatar.
// Doc 18 § 8 (round-5 primitive, confirmed by the avatar-view concept image).
// Decorative: sits at z-0 so the avatar (z-1) reads in front without card chrome.

import { cn } from '@/lib/utils/cn'

type Length = number | string

interface AvatarHaloProps {
  width?: Length
  height?: Length
  top?: Length
  left?: Length
  right?: Length
  bottom?: Length
  className?: string
}

function toCss(value: Length | undefined): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

export function AvatarHalo({
  width = '70%',
  height = '40%',
  top,
  left,
  right,
  bottom,
  className,
}: AvatarHaloProps) {
  // Default placement: centred horizontally + 30%-from-top vertically — sits
  // behind a head/shoulders avatar without bleeding past it.
  const resolvedTop    = toCss(top)    ?? (bottom === undefined ? '30%' : undefined)
  const resolvedLeft   = toCss(left)   ?? (right  === undefined ? '50%' : undefined)

  return (
    <div
      aria-hidden="true"
      className={cn('avatar-halo', className)}
      style={{
        width:  toCss(width),
        height: toCss(height),
        top:    resolvedTop,
        left:   resolvedLeft,
        right:  toCss(right),
        bottom: toCss(bottom),
        // When defaulting to left:50% we need a -50% translate to recentre.
        transform: left === undefined && right === undefined ? 'translateX(-50%)' : undefined,
      }}
    />
  )
}

export default AvatarHalo
```

---

## `components/brand/CountdownTimer.tsx` — `CountdownTimer` (named + default)

Four-unit countdown to the yearbook print lock, with framer-motion digit swaps. Ticks
every 1000 ms. Default target is `2026-08-15T23:59:59+05:30`, falling back to +14 days.

**Key props:** `targetDate?: string | Date`, `title`, `subtitle`, `className`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CountdownTimerProps {
  /** Target ISO date or timestamp. Defaults to 14 days from current date if not specified. */
  targetDate?: string | Date
  title?: string
  subtitle?: string
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - new Date().getTime()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  }
}

export function CountdownTimer({
  targetDate,
  title = 'Yearbook Ceremony & Print Lock',
  subtitle = 'The active signing phase is live! Lock-in your signatures before the flip.',
  className = '',
}: CountdownTimerProps) {
  // Default target: August 15, 2026 or 14 days from now if not passed
  const target = useState<Date>(() => {
    if (targetDate) return new Date(targetDate)
    const defaultTarget = new Date('2026-08-15T23:59:59+05:30')
    if (defaultTarget.getTime() > Date.now()) return defaultTarget
    // Fallback: 14 days from now
    const now = new Date()
    now.setDate(now.getDate() + 14)
    return now
  })[0]

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(target))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target))
    }, 1000)
    return () => clearInterval(timer)
  }, [target])

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-paper-100/90 backdrop-blur-md rounded-3xl border-2 border-[color:var(--line-soft,#e5dfd3)] shadow-xl ${className}`}>
      {title && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2">
          ✨ {title}
        </span>
      )}
      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-600 text-center mb-6 max-w-md font-sans">
          {subtitle}
        </p>
      )}

      {timeLeft.isExpired ? (
        <div className="text-center py-4">
          <h3 className="text-2xl font-bold font-display text-amber-900">🎓 The Yearbook is Flipping!</h3>
          <p className="text-sm text-gray-500 mt-1">Preparing final high-resolution shirt prints...</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-md">
          {timeUnits.map((unit) => (
            <div
              key={unit.label}
              className="flex flex-col items-center justify-center p-2 sm:p-3 bg-white rounded-2xl border border-paper-300 shadow-sm relative overflow-hidden group"
            >
              <div className="text-2xl sm:text-4xl font-extrabold font-display text-ink-900 tracking-tight">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={unit.value}
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 15, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="inline-block"
                  >
                    {String(unit.value).padStart(2, '0')}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CountdownTimer
```

---

## `components/brand/DriftingDoodles.tsx` — `DriftingDoodles` (named + default)

Twelve hand-drawn SVG doodles absolutely positioned around a container. Layout is picked
by `density` (3 / 4 / 6 slots); the glyph set is picked round-robin from `palette`.
Renders via `dangerouslySetInnerHTML` from an internal static `SVG_MAP`.

**Key props:** `density?: 'low' | 'medium' | 'high'` (default `medium`),
`palette?: readonly DoodleName[]`, `className?: string`

```tsx
import { cn } from '@/lib/utils/cn'

export type DoodleDensity = 'low' | 'medium' | 'high'

export type DoodleName =
  | 'arrow'
  | 'bear-doodle'
  | 'crown'
  | 'fire'
  | 'flower'
  | 'heart'
  | 'lightning'
  | 'paper-plane'
  | 'smile'
  | 'sparkle'
  | 'speech-bubble'
  | 'star'

interface DriftingDoodlesProps {
  density?: DoodleDensity
  palette?: readonly DoodleName[]
  className?: string
}

interface DoodleSlot {
  name: DoodleName
  top?:    string
  left?:   string
  right?:  string
  bottom?: string
  size: number
  rotate: number
  opacity: number
}

const SVG_MAP: Record<DoodleName, string> = {
  arrow:         '<svg viewBox="0 0 120 120"><path d="M21 70c24-31 52-35 78-20" fill="none" stroke="#2d2923" stroke-width="7" stroke-linecap="round"/><path d="m82 34 20 19-26 9" fill="none" stroke="#2d2923" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'bear-doodle': '<svg viewBox="0 0 120 120"><circle cx="36" cy="35" r="15" fill="#fff7fb" stroke="#6f54df" stroke-width="5"/><circle cx="84" cy="35" r="15" fill="#fff7fb" stroke="#6f54df" stroke-width="5"/><circle cx="60" cy="62" r="39" fill="#fff7fb" stroke="#6f54df" stroke-width="5"/><circle cx="47" cy="57" r="4" fill="#6f54df"/><circle cx="73" cy="57" r="4" fill="#6f54df"/><path d="M53 72c5 6 10 6 15 0" fill="none" stroke="#6f54df" stroke-width="4" stroke-linecap="round"/></svg>',
  crown:         '<svg viewBox="0 0 120 120"><path d="M25 84 20 39l25 20 15-34 15 34 25-20-5 45Z" fill="#fff0a6" stroke="#f5a400" stroke-width="6" stroke-linejoin="round"/><path d="M32 91h56" stroke="#f5a400" stroke-width="6" stroke-linecap="round"/></svg>',
  fire:          '<svg viewBox="0 0 120 120"><path d="M64 105c24-8 36-26 29-48-4-13-14-20-22-31-2 17-10 25-20 34 3-17-3-27-13-38 0 29-22 39-16 62 5 18 22 27 42 21Z" fill="#fff1dd" stroke="#ef5f23" stroke-width="6" stroke-linejoin="round"/><path d="M59 91c10-4 16-13 12-24-5 8-11 12-19 18 2-7 0-13-5-18-2 15 1 24 12 24Z" fill="#ffbd42"/></svg>',
  flower:        '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="13" fill="#fff5a8" stroke="#2f7d48" stroke-width="4"/><g fill="#fce5f0" stroke="#2f7d48" stroke-width="4"><ellipse cx="60" cy="30" rx="13" ry="20"/><ellipse cx="60" cy="90" rx="13" ry="20"/><ellipse cx="30" cy="60" rx="20" ry="13"/><ellipse cx="90" cy="60" rx="20" ry="13"/></g></svg>',
  heart:         '<svg viewBox="0 0 120 120"><path d="M60 96C22 70 20 42 38 31c11-7 22-1 22 10 0-11 12-17 23-10 18 11 15 39-23 65Z" fill="#fff7fb" stroke="#ec4b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 74c8 7 16 12 22 16" fill="none" stroke="#ec4b82" stroke-width="3" stroke-linecap="round" opacity=".35"/></svg>',
  lightning:     '<svg viewBox="0 0 120 120"><path d="M68 12 28 65h28l-8 43 44-58H63Z" fill="#ffe66d" stroke="#f08a00" stroke-width="6" stroke-linejoin="round"/></svg>',
  'paper-plane': '<svg viewBox="0 0 120 120"><path d="M17 58 103 20 78 100 56 68Z" fill="#f8fbff" stroke="#2563eb" stroke-width="6" stroke-linejoin="round"/><path d="M56 68 103 20 42 78" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/></svg>',
  smile:         '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="42" fill="#fff2a8" stroke="#2d2923" stroke-width="5"/><circle cx="45" cy="51" r="5" fill="#2d2923"/><circle cx="75" cy="51" r="5" fill="#2d2923"/><path d="M40 69c11 14 30 14 40 0" fill="none" stroke="#2d2923" stroke-width="5" stroke-linecap="round"/></svg>',
  sparkle:       '<svg viewBox="0 0 120 120"><path d="M60 15c7 25 20 38 45 45-25 7-38 20-45 45-7-25-20-38-45-45 25-7 38-20 45-45Z" fill="#f8f1ff" stroke="#6f54df" stroke-width="6" stroke-linejoin="round"/><path d="M86 16c3 10 8 15 18 18-10 3-15 8-18 18-3-10-8-15-18-18 10-3 15-8 18-18Z" fill="#fff" stroke="#6f54df" stroke-width="3"/></svg>',
  'speech-bubble': '<svg viewBox="0 0 120 120"><path d="M23 27h74c10 0 16 7 16 17v28c0 10-6 17-16 17H61l-25 17 5-17H23c-10 0-16-7-16-17V44c0-10 6-17 16-17Z" fill="#fff" stroke="#6f54df" stroke-width="5" stroke-linejoin="round"/><path d="M32 54h50M32 70h35" stroke="#6f54df" stroke-width="4" stroke-linecap="round"/></svg>',
  star:          '<svg viewBox="0 0 120 120"><path d="m60 18 12 27 30 2-23 20 8 31-27-17-27 17 8-31-23-20 30-2Z" fill="#fff5c7" stroke="#f2a51a" stroke-width="6" stroke-linejoin="round"/><path d="M48 44 60 24l10 22" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/></svg>',
}

const DEFAULT_PALETTE: readonly DoodleName[] = [
  'paper-plane',
  'heart',
  'lightning',
  'sparkle',
  'star',
  'smile',
  'flower',
  'crown',
  'arrow',
  'bear-doodle',
]

const LAYOUTS: Record<DoodleDensity, ReadonlyArray<Omit<DoodleSlot, 'name'>>> = {
  low: [
    { top: '6%',    left: '8%',  size: 32, rotate: -8, opacity: 0.72 },
    { bottom: '10%', right: '10%', size: 28, rotate: 6,  opacity: 0.68 },
    { top: '54%',  right: '4%',  size: 24, rotate: -4, opacity: 0.62 },
  ],
  medium: [
    { top: '4%',    left: '6%',   size: 34, rotate: -10, opacity: 0.74 },
    { top: '14%',   right: '8%',  size: 26, rotate: 8,   opacity: 0.66 },
    { bottom: '12%', left: '10%', size: 30, rotate: 6,   opacity: 0.70 },
    { bottom: '6%',  right: '14%', size: 24, rotate: -6, opacity: 0.64 },
  ],
  high: [
    { top: '4%',    left: '5%',   size: 38, rotate: -12, opacity: 0.78 },
    { top: '10%',   right: '6%',  size: 28, rotate: 8,   opacity: 0.68 },
    { top: '38%',   left: '2%',   size: 24, rotate: -5, opacity: 0.62 },
    { top: '46%',   right: '3%',  size: 26, rotate: 6,   opacity: 0.66 },
    { bottom: '14%', left: '12%',  size: 32, rotate: 10, opacity: 0.72 },
    { bottom: '4%',  right: '10%', size: 40, rotate: -7, opacity: 0.76 },
  ],
}

function pickName(palette: readonly DoodleName[], index: number): DoodleName {
  return palette[index % palette.length] as DoodleName
}

export function DriftingDoodles({
  density = 'medium',
  palette,
  className,
}: DriftingDoodlesProps) {
  const activePalette = palette && palette.length > 0 ? palette : DEFAULT_PALETTE
  const layout = LAYOUTS[density]

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {layout.map((slot, index) => {
        const name = pickName(activePalette, index)
        const svgContent = SVG_MAP[name]
        return (
          <span
            key={`${name}-${index}`}
            className="absolute select-none"
            style={{
              top:       slot.top,
              left:      slot.left,
              right:     slot.right,
              bottom:    slot.bottom,
              width:     `${slot.size}px`,
              height:    `${slot.size}px`,
              opacity:   slot.opacity,
              transform: `rotate(${slot.rotate}deg)`,
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )
      })}
    </div>
  )
}

export default DriftingDoodles
```

---

## `components/brand/Whiteboard.tsx` — `Whiteboard` (named + default)

The most-repeated brand surface after the avatar: inline SVG aluminum frame + off-white
surface, with HTML marker text layered on top so dynamic copy reflows. Three variants with
fully specified geometry (`a-frame` includes a tripod base).

**Key props:** `variant: 'a-frame' | 'wall-mounted' | 'small'` (required), `title: string`
(required), `subtitle?: string`, `markerColor?: 'blue' | 'black' | 'red' | 'green'`,
`rotation?: 'left' | 'right' | 'none'`, `className?: string`, `customSvg?: ReactNode`

```tsx
// Whiteboard — the most-repeated brand surface after the avatar.
// Doc 18 § 7. Inline SVG frame + surface, HTML marker text positioned over the
// surface so dynamic content (countdowns, names) reflows naturally.

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type WhiteboardVariant = 'a-frame' | 'wall-mounted' | 'small'
export type WhiteboardMarkerColor = 'blue' | 'black' | 'red' | 'green'
export type WhiteboardRotation = 'left' | 'right' | 'none'

interface WhiteboardProps {
  variant: WhiteboardVariant
  title: string
  subtitle?: string
  markerColor?: WhiteboardMarkerColor
  rotation?: WhiteboardRotation
  className?: string
  /** Replaces the surface text with a hand-designed SVG (frame is preserved). */
  customSvg?: ReactNode
}

// Default marker colour per variant — see doc 18 § 7.
// Dashboard (wall-mounted): blue. Explore (wall-mounted): black.
// Login (a-frame): black. Onboarding (a-frame): blue. Small: blue.
// `wall-mounted` defaults to blue because dashboard is the most common usage;
// explore overrides to black at the call site.
const DEFAULT_MARKER_COLOR: Record<WhiteboardVariant, WhiteboardMarkerColor> = {
  'a-frame':      'black',
  'wall-mounted': 'blue',
  'small':        'blue',
}

const MARKER_CLASS: Record<WhiteboardMarkerColor, string> = {
  blue:  'marker-blue',
  black: 'marker-black',
  red:   'marker-red',
  green: 'marker-green',
}

const MARKER_HEX: Record<WhiteboardMarkerColor, string> = {
  blue:  '#2563EB',
  black: '#1A1208',
  red:   '#D83F6B',
  green: '#5F8B48',
}

const ROTATION_STYLE: Record<WhiteboardRotation, string | undefined> = {
  left:  'rotate(-2deg)',
  right: 'rotate(2deg)',
  none:  undefined,
}

interface VariantSpec {
  aspect: string
  surfacePadding: string
  titleSize: string
  subtitleSize: string
  titleLeading: string
  subtitleLeading: string
  shadow: string
  underlineWidth: number
  underlineStrokeWidth: number
  cornerScrewRadius: number
  frameInsetPct: number
  basePct: number
}

const VARIANT_SPECS: Record<WhiteboardVariant, VariantSpec> = {
  'a-frame': {
    aspect: 'aspect-[2/3]',
    surfacePadding: 'px-6 py-8',
    titleSize: 'text-[24px] sm:text-[28px]',
    subtitleSize: 'text-[16px] sm:text-[18px]',
    titleLeading: 'leading-[1.05]',
    subtitleLeading: 'leading-[1.25]',
    shadow: 'drop-shadow-[0_12px_18px_rgba(80,90,105,0.20)]',
    underlineWidth: 110,
    underlineStrokeWidth: 3,
    cornerScrewRadius: 2.5,
    frameInsetPct: 4,
    basePct: 22,
  },
  'wall-mounted': {
    aspect: 'aspect-[3/2]',
    surfacePadding: 'px-6 py-5',
    titleSize: 'text-[20px] sm:text-[22px]',
    subtitleSize: 'text-[14px] sm:text-[16px]',
    titleLeading: 'leading-[1.1]',
    subtitleLeading: 'leading-[1.3]',
    shadow: 'drop-shadow-[0_6px_10px_rgba(80,90,105,0.16)]',
    underlineWidth: 90,
    underlineStrokeWidth: 2.6,
    cornerScrewRadius: 2.5,
    frameInsetPct: 5,
    basePct: 0,
  },
  'small': {
    aspect: 'aspect-[4/3]',
    surfacePadding: 'px-3 py-2.5',
    titleSize: 'text-[15px] sm:text-[16px]',
    subtitleSize: 'text-[13px] sm:text-[14px]',
    titleLeading: 'leading-[1.1]',
    subtitleLeading: 'leading-[1.3]',
    shadow: '',
    underlineWidth: 60,
    underlineStrokeWidth: 2,
    cornerScrewRadius: 1.5,
    frameInsetPct: 6,
    basePct: 0,
  },
}

export function Whiteboard({
  variant,
  title,
  subtitle,
  markerColor,
  rotation = 'none',
  className,
  customSvg,
}: WhiteboardProps) {
  const spec = VARIANT_SPECS[variant]
  const colorKey = markerColor ?? DEFAULT_MARKER_COLOR[variant]
  const markerClass = MARKER_CLASS[colorKey]
  const markerHex = MARKER_HEX[colorKey]
  const rotateTransform = ROTATION_STYLE[rotation]

  const ariaLabel = subtitle ? `${title}. ${subtitle}` : title
  const showTripod = variant === 'a-frame'

  // Surface lives in the inset area; the frame draws as a layered ring.
  // Heights/widths use percentages so the SVG scales with the container.
  const inset = spec.frameInsetPct
  const surfaceBottom = showTripod ? spec.basePct : 0

  return (
    <figure
      role="img"
      aria-label={ariaLabel}
      className={cn('relative', spec.shadow, className)}
      style={rotateTransform ? { transform: rotateTransform } : undefined}
    >
      <div className={cn('relative w-full', spec.aspect)}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          {/* Outer aluminum frame */}
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height={(100 - surfaceBottom).toString()}
            rx="2"
            ry="2"
            fill="var(--whiteboard-frame)"
            stroke="var(--whiteboard-frame-edge)"
            strokeWidth="0.6"
          />
          {/* Inner shadow ring */}
          <rect
            x={(inset / 2).toString()}
            y={(inset / 2).toString()}
            width={(100 - inset).toString()}
            height={(100 - surfaceBottom - inset).toString()}
            rx="1.5"
            ry="1.5"
            fill="var(--whiteboard-frame-edge)"
            opacity="0.45"
          />
          {/* Off-white surface */}
          <rect
            x={inset.toString()}
            y={inset.toString()}
            width={(100 - inset * 2).toString()}
            height={(100 - surfaceBottom - inset * 2).toString()}
            rx="0.8"
            ry="0.8"
            fill="var(--whiteboard-surface)"
          />
          {/* Erased-content smudge in lower-right */}
          <defs>
            <radialGradient id={`erased-${variant}`} cx="0.72" cy="0.82" r="0.4">
              <stop offset="0%" stopColor="var(--whiteboard-frame-edge)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--whiteboard-frame-edge)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect
            x={inset.toString()}
            y={inset.toString()}
            width={(100 - inset * 2).toString()}
            height={(100 - surfaceBottom - inset * 2).toString()}
            fill={`url(#erased-${variant})`}
          />
          {/* Corner screw dots */}
          {[
            [inset + 1, inset + 1],
            [100 - inset - 1, inset + 1],
            [inset + 1, 100 - surfaceBottom - inset - 1],
            [100 - inset - 1, 100 - surfaceBottom - inset - 1],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx.toString()}
              cy={cy.toString()}
              r={spec.cornerScrewRadius.toString()}
              fill="var(--whiteboard-frame-edge)"
              opacity="0.75"
            />
          ))}
          {/* Highlight along top inner edge */}
          <line
            x1={inset.toString()}
            y1={(inset + 0.5).toString()}
            x2={(100 - inset).toString()}
            y2={(inset + 0.5).toString()}
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="0.4"
          />
          {/* Tripod base (a-frame only) */}
          {showTripod && (
            <g>
              <line
                x1="35"
                y1={(100 - surfaceBottom).toString()}
                x2="22"
                y2="100"
                stroke="var(--whiteboard-frame-edge)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="65"
                y1={(100 - surfaceBottom).toString()}
                x2="78"
                y2="100"
                stroke="var(--whiteboard-frame-edge)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="50"
                y1={(100 - surfaceBottom).toString()}
                x2="50"
                y2={(100 - surfaceBottom + 4).toString()}
                stroke="var(--whiteboard-frame-edge)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>

        {/* Content layer: HTML positioned over the surface area */}
        <div
          className={cn(
            'absolute flex flex-col items-center justify-center text-center',
            spec.surfacePadding,
          )}
          style={{
            top:    `${inset}%`,
            left:   `${inset}%`,
            right:  `${inset}%`,
            bottom: `${inset + surfaceBottom}%`,
          }}
        >
          {customSvg ? (
            <div className="w-full h-full grid place-items-center">{customSvg}</div>
          ) : (
            <>
              <span
                className={cn(
                  'font-marker',
                  markerClass,
                  spec.titleSize,
                  spec.titleLeading,
                )}
              >
                {title}
              </span>
              {subtitle ? (
                <span
                  className={cn(
                    'font-display mt-1.5 opacity-80',
                    markerClass,
                    spec.subtitleSize,
                    spec.subtitleLeading,
                  )}
                >
                  {subtitle}
                </span>
              ) : null}
              {/* Hand-drawn marker underline */}
              <svg
                viewBox={`0 0 ${spec.underlineWidth} 8`}
                width={spec.underlineWidth}
                height="8"
                className="mt-2 opacity-80"
                aria-hidden="true"
              >
                <path
                  d={`M2 5 Q ${spec.underlineWidth * 0.27} 1 ${spec.underlineWidth * 0.5} 4 T ${spec.underlineWidth - 2} 5`}
                  stroke={markerHex}
                  strokeWidth={spec.underlineStrokeWidth.toString()}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </>
          )}
        </div>
      </div>
    </figure>
  )
}

export default Whiteboard
```

---

## `components/marginalia/HeroStickerNotes.tsx` — `HeroStickerNotes`, `HeroStickerNote`, `STICKER_TONES`, `DEFAULT_HERO_NOTE_SLOTS`

Positions floating sticker notes around an avatar. Owns the four-slot palette
(yellow / pink / green / blue), each note's rotation + position, and the mobile collapse
rule (slots flagged `mobile: false` are hidden below `md`).

**Key props:** `notes: readonly HeroNoteSlotData[]` (`{ id, body, emoji? }`),
`slots?: readonly HeroNoteSlot[]`. Single-note variant takes `{ slot, children }`.

```tsx
/**
 * HeroStickerNotes — shared hero composition primitive for signature pages
 * (Dashboard + Profile + any future surface that frames an avatar with
 * floating "messages from friends" sticker notes).
 *
 * Doc 18 § 8 — Marginalia primitives. The component owns the slot palette,
 * the per-slot positioning + rotation + tone, and the mobile collapse rule
 * (slots 3+ hidden on <md so the avatar doesn't crowd on phones).
 *
 * Reference image (doc 17 round 5): the avatar-view mockup with four
 * sticker notes drifting around the head. This component is what produces
 * those notes on the hero — call it inside a `relative` container that
 * also holds the avatar, then it positions itself absolutely around it.
 */
import type { CSSProperties, ReactNode } from 'react'

/**
 * Sticker palette — four warm-paper tones that read together as a family.
 * Each tone is a paired `bg-*` + `text-*` Tailwind utility string. Keep the
 * palette small so the hero never looks like a colour-wheel; bigger surfaces
 * (the inside-shirt scribble palette) can use the full scribble tones from
 * `lib/constants.ts`.
 */
export const STICKER_TONES = {
  yellow: 'bg-[#fff3bf] text-[#3c3326]',
  pink:   'bg-[#ffe6ef] text-[#b62056]',
  green:  'bg-[#e9f7df] text-[#315a2d]',
  blue:   'bg-[#edf4ff] text-[#17428a]',
} as const
export type StickerTone = keyof typeof STICKER_TONES

export interface HeroNoteSlot {
  top:      string
  left?:    string
  right?:   string
  rotation: number
  tone:     StickerTone
  /** When false, the slot collapses on <md (mobile composition rules). */
  mobile:   boolean
  width:    string
}

/**
 * Default four-slot composition that matches the reference image. Slots 1-2
 * sit near the top corners (visible on mobile); slots 3-4 anchor the lower
 * corners (md+ only) for the desktop "messages drifting all around" look.
 */
export const DEFAULT_HERO_NOTE_SLOTS: readonly HeroNoteSlot[] = [
  { top: '4%',  left:  '0%', rotation: -8,  tone: 'yellow', mobile: true,  width: 'clamp(100px, 28vw, 150px)' },
  { top: '10%', right: '0%', rotation: 7,   tone: 'pink',   mobile: true,  width: 'clamp(100px, 28vw, 150px)' },
  { top: '58%', left:  '0%', rotation: -10, tone: 'green',  mobile: false, width: '160px' },
  { top: '62%', right: '0%', rotation: 9,   tone: 'blue',   mobile: false, width: '160px' },
]

export interface HeroStickerNoteData {
  /** Stable React key — usually a row id from the data source. */
  id:      string
  /** The note text. Renders through the auto-applied .text-handwritten-note. */
  body:    string
  /** Optional decorative emoji prefix. Pass null to skip. */
  emoji?:  string | null
}

interface HeroStickerNoteProps {
  slot:     HeroNoteSlot
  children: ReactNode
}

/**
 * One sticker note, positioned by a slot descriptor. Exposed for hand-placed
 * compositions where the default slot palette doesn't match (e.g. a future
 * group-page hero with five notes in a different arrangement).
 */
export function HeroStickerNote({ slot, children }: HeroStickerNoteProps) {
  const style: CSSProperties = {
    top: slot.top,
    left: slot.left,
    right: slot.right,
    width: slot.width,
    transform: `rotate(${slot.rotation}deg)`,
  }
  return (
    <div
      className={`sticker-note ${STICKER_TONES[slot.tone]} ${slot.mobile ? '' : 'hidden md:block'}`}
      style={style}
    >
      {children}
    </div>
  )
}

interface HeroStickerNotesProps {
  /**
   * The notes to render. The component takes the first `slots.length` items
   * and drops the rest, so callers can pass an oversized array safely.
   */
  notes: readonly HeroStickerNoteData[]
  /**
   * Slot palette. Defaults to the four-slot composition from the reference
   * image; override for a different hero layout.
   */
  slots?: readonly HeroNoteSlot[]
}

/**
 * Renders the hero sticker notes as a positioned cluster. Drop this inside
 * the relatively-positioned avatar container alongside `<AvatarHalo>` and
 * the `<Avatar>` itself.
 */
export function HeroStickerNotes({ notes, slots = DEFAULT_HERO_NOTE_SLOTS }: HeroStickerNotesProps) {
  return (
    <>
      {notes.slice(0, slots.length).map((note, index) => {
        const slot = slots[index]
        if (!slot) return null
        return (
          <HeroStickerNote key={note.id} slot={slot}>
            {note.emoji ? `${note.emoji} ` : null}
            {note.body}
          </HeroStickerNote>
        )
      })}
    </>
  )
}
```

---

## `components/marginalia/AsteriskDivider.tsx` — `AsteriskDivider` (named + default)

Three `✶` glyphs centered between sections. Always decorative (`aria-hidden`).

**Key props:** `className?: string`

```tsx
// Asterisk divider — three Unicode ✶ glyphs centered between sections on
// signature pages. Doc 18 § 8. Caveat 18-20px in ink-500. Always decorative.

import { cn } from '@/lib/utils/cn'

interface AsteriskDividerProps {
  className?: string
}

export function AsteriskDivider({ className }: AsteriskDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'my-8 flex items-center justify-center gap-4 text-eyebrow-display text-ink-500 select-none',
        className,
      )}
    >
      <span>✶</span>
      <span>✶</span>
      <span>✶</span>
    </div>
  )
}

export default AsteriskDivider
```

---

## `components/marginalia/HandDrawnArrow.tsx` — `HandDrawnArrow` (named + default)

Squiggly SVG arrow pointing from a scribbled name to a CTA. One canonical right-pointing
path rotated via CSS `transform`, with a `stroke-dashoffset` reveal on mount (body 600 ms,
head delayed 400 ms).

**Key props:** `direction?: 'right' | 'down' | 'left' | 'up'` (default `right`),
`length = 80`, `className?`, `attention?: boolean`, `stroke = 'var(--ink-700)'`,
`strokeWidth = 2.2`

```tsx
'use client'

// HandDrawnArrow — squiggly hand-drawn arrow doodle pointing from the
// scribbled name to a CTA. Doc 18 § 8 + § 14. SVG stroke-dasharray reveal
// on mount; optional attention-wiggle for empty-state arrows.

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

export type ArrowDirection = 'right' | 'down' | 'left' | 'up'

interface HandDrawnArrowProps {
  direction?: ArrowDirection
  length?: number
  className?: string
  /** Toggle on for empty-state attention wiggle (doc 18 § 14). */
  attention?: boolean
  /** Override stroke colour; defaults to ink-700. */
  stroke?: string
  strokeWidth?: number
}

const ROTATION: Record<ArrowDirection, number> = {
  right: 0,
  down:  90,
  left:  180,
  up:    270,
}

// Single canonical right-pointing path in a 100x40 viewbox. We rotate the
// outer SVG element for direction variants so the dasharray reveal still
// reads "left-to-right" relative to the user's eye.
const ARROW_PATH    = 'M4 22 Q 24 12 50 22 T 92 20'
const ARROW_HEAD_A  = 'M82 12 L 95 20 L 80 28'
const PATH_LENGTH   = 110

export function HandDrawnArrow({
  direction = 'right',
  length = 80,
  className,
  attention = false,
  stroke = 'var(--ink-700)',
  strokeWidth = 2.2,
}: HandDrawnArrowProps) {
  const ref = useRef<SVGSVGElement | null>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    // Trigger the dasharray reveal one frame after mount so the transition
    // animates rather than jumping straight to drawn.
    const handle = window.requestAnimationFrame(() => setDrawn(true))
    return () => window.cancelAnimationFrame(handle)
  }, [])

  const rotateDeg = ROTATION[direction]
  const width  = length
  const height = Math.round(length * 0.4)

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox="0 0 100 40"
      role="img"
      aria-label="hand-drawn pointer"
      className={cn(
        'hand-drawn-arrow inline-block',
        attention && 'hand-drawn-arrow--attention',
        className,
      )}
      style={{ transform: `rotate(${rotateDeg}deg)`, transformOrigin: '50% 50%' }}
    >
      <path
        d={ARROW_PATH}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          strokeDasharray:  PATH_LENGTH,
          strokeDashoffset: drawn ? 0 : PATH_LENGTH,
          transition:       'stroke-dashoffset 600ms ease-out',
        }}
      />
      <path
        d={ARROW_HEAD_A}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray:  40,
          strokeDashoffset: drawn ? 0 : 40,
          transition:       'stroke-dashoffset 350ms ease-out 400ms',
        }}
      />
    </svg>
  )
}

export default HandDrawnArrow
```

---

## `components/place/PlaceBackground.tsx` — `PlaceBackground` (named + default)

Illustrated campus background layered behind signature pages via `mix-blend-mode: multiply`.
Three phases (`vivid` → `fading` → `ambient`); the hero only plays on first visit, is
skipped entirely for slow connections, and shortens from 1800 ms to 1100 ms under 768 px.
Serves `/illustrations/place/{illustration}-{mobile|tablet|desktop}.svg` through `<picture>`.

**Key props:** `surface: FirstVisitSurface`, `illustration: 'lawn-golden-hour' | 'classroom-hall'`,
`alwaysVivid?`, `alwaysAmbient?`, `className?`

```tsx
'use client'

// Place layer — illustrated campus background behind every signature page.
// Doc 18 § 4 + § 11. Three phases: vivid (first visit), fading (animating),
// ambient (settled). Honours reduced-motion + slow-connection.

import { useEffect, useState } from 'react'
import {
  useFirstVisit,
  type FirstVisitSurface,
} from '@/lib/hooks/useFirstVisit'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { useSlowConnection } from '@/lib/hooks/useSlowConnection'
import { cn } from '@/lib/utils/cn'

export type PlaceIllustration = 'lawn-golden-hour' | 'classroom-hall'

type Phase = 'vivid' | 'fading' | 'ambient'

interface PlaceBackgroundProps {
  surface: FirstVisitSurface
  illustration: PlaceIllustration
  /** Login: stays vivid forever (brand front door). */
  alwaysVivid?: boolean
  /** Profile, groups, group-detail: never plays the hero, just ambient. */
  alwaysAmbient?: boolean
  className?: string
}

// Per doc 18 § 11: desktop ~1800ms, mobile ~1100ms.
// We pick the boundary purely off viewport width so SSR is deterministic
// (the CSS keyframe duration shortens for the same breakpoint in globals).
const DESKTOP_DURATION_MS = 1800
const MOBILE_DURATION_MS = 1100
const MOBILE_BREAKPOINT_PX = 768

function pickFadeDuration(): number {
  if (typeof window === 'undefined') return DESKTOP_DURATION_MS
  return window.innerWidth <= MOBILE_BREAKPOINT_PX
    ? MOBILE_DURATION_MS
    : DESKTOP_DURATION_MS
}

export function PlaceBackground({
  surface,
  illustration,
  alwaysVivid = false,
  alwaysAmbient = false,
  className,
}: PlaceBackgroundProps) {
  const { isFirstVisit, markVisited } = useFirstVisit(surface)
  const prefersReducedMotion = usePrefersReducedMotion()
  const slowConnection = useSlowConnection()

  // Initial render is always 'ambient' to avoid a flash of vivid before the
  // mount effect resolves the real first-visit + media-query state. The
  // effect below flips us into 'vivid' when we actually want the hero.
  const [phase, setPhase] = useState<Phase>(() => {
    if (alwaysVivid) return 'vivid'
    return 'ambient'
  })

  useEffect(() => {
    if (alwaysVivid) {
      setPhase('vivid')
      return undefined
    }
    if (alwaysAmbient || !isFirstVisit) {
      setPhase('ambient')
      return undefined
    }
    if (prefersReducedMotion || slowConnection) {
      setPhase('ambient')
      markVisited()
      return undefined
    }
    setPhase('vivid')
    const fadeDuration = pickFadeDuration()

    const fadeTimer = window.setTimeout(() => setPhase('fading'), 50)
    const settleTimer = window.setTimeout(() => {
      setPhase('ambient')
      markVisited()
    }, 50 + fadeDuration)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(settleTimer)
    }
  }, [
    alwaysVivid,
    alwaysAmbient,
    isFirstVisit,
    prefersReducedMotion,
    slowConnection,
    markVisited,
  ])

  // Slow-2g / 2g: skip the place layer entirely. Substrate carries the page.
  if (slowConnection) {
    return <div className={cn('place-layer', className)} aria-hidden="true" />
  }

  const phaseClass =
    phase === 'vivid'
      ? 'place-layer--vivid'
      : phase === 'fading'
        ? 'place-layer--fading'
        : 'place-layer--ambient'

  const desktopSrc = `/illustrations/place/${illustration}-desktop.svg`
  const tabletSrc = `/illustrations/place/${illustration}-tablet.svg`
  const mobileSrc = `/illustrations/place/${illustration}-mobile.svg`

  return (
    <div
      className={cn('place-layer', phaseClass, className)}
      aria-hidden="true"
    >
      <picture className="block w-full h-full">
        <source media="(max-width: 768px)" srcSet={mobileSrc} />
        <source media="(max-width: 1280px)" srcSet={tabletSrc} />
        <img
          src={desktopSrc}
          alt=""
          decoding="async"
          loading={alwaysVivid ? 'eager' : 'lazy'}
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
      </picture>
    </div>
  )
}

export default PlaceBackground
```

---

## `components/feedback/PencilLoader.tsx` — `PencilLoader` (named + default)

Replaces Lucide spinners in submitting-button states: a wavy ink stroke whose
`stroke-dasharray` animates on a 700 ms loop (SMIL `<animate>`).

**Key props:** `className?: string`, `label = 'Loading'`

```tsx
// PencilLoader — pencil drawing a wavy line, replaces Lucide spinners in
// "submitting" button states. Doc 18 § 14.

import { cn } from '@/lib/utils/cn'

interface PencilLoaderProps {
  className?: string
  /** Accessible label for assistive tech; defaults to "Loading". */
  label?: string
}

export function PencilLoader({ className, label = 'Loading' }: PencilLoaderProps) {
  return (
    <svg
      className={cn('inline-block', className)}
      viewBox="0 0 40 20"
      width="40"
      height="20"
      role="img"
      aria-label={label}
    >
      <path
        d="M2 12 Q 12 6 22 12 T 38 12"
        stroke="var(--ink-bleed)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0,40;40,0"
          dur="700ms"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  )
}

export default PencilLoader
```

---

## `components/feedback/StampSuccess.tsx` — `StampSuccess` (named + default)

Circular teacher's-stamp approval mark in `--ink-stamp-green`, lightly blurred to read as
rubber. Fires `onComplete` 260 ms after `show` flips true (once per show).

**Key props:** `show: boolean`, `onComplete?`, `className?`,
`primaryText = 'scribbled!'`, `secondaryText = '✓ approved'`

```tsx
'use client'

// StampSuccess — circular teacher's-stamp approval mark.
// Doc 18 § 14. Phase 1 uses: onboarding complete, scribble published,
// avatar locked. The `stamp-land` keyframe gives the slight overshoot.

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface StampSuccessProps {
  show: boolean
  /** Fires ~260ms after `show` flips true (animation end). */
  onComplete?: () => void
  className?: string
  /** Override the inner copy; defaults to "scribbled!" / "✓ approved". */
  primaryText?: string
  secondaryText?: string
}

const ANIMATION_MS = 260

export function StampSuccess({
  show,
  onComplete,
  className,
  primaryText = 'scribbled!',
  secondaryText = '✓ approved',
}: StampSuccessProps) {
  const completed = useRef(false)

  useEffect(() => {
    if (!show) {
      completed.current = false
      return undefined
    }
    if (completed.current) return undefined
    const timer = window.setTimeout(() => {
      completed.current = true
      onComplete?.()
    }, ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [show, onComplete])

  if (!show) return null

  return (
    <svg
      className={cn('stamp-success', className)}
      viewBox="0 0 120 120"
      width="120"
      height="120"
      role="img"
      aria-label={`${primaryText} ${secondaryText}`}
      style={{ filter: 'blur(0.4px)' }}
    >
      <circle
        cx="60"
        cy="60"
        r="56"
        stroke="var(--ink-stamp-green)"
        strokeWidth="3"
        fill="none"
      />
      <text
        x="60"
        y="55"
        textAnchor="middle"
        fontFamily="var(--font-display), Caveat, cursive"
        fontSize="22"
        fontWeight="600"
        fill="var(--ink-stamp-green)"
      >
        {primaryText}
      </text>
      <text
        x="60"
        y="80"
        textAnchor="middle"
        fontFamily="var(--font-display), Caveat, cursive"
        fontSize="14"
        fill="var(--ink-stamp-green)"
        opacity="0.7"
      >
        {secondaryText}
      </text>
    </svg>
  )
}

export default StampSuccess
```

---

## `components/support/ReportIssueButton.tsx` — `ReportIssueButton` (default export)

Floating "Report issue" pill mounted once in `app/layout.tsx`, so it appears on every route.
Expands into a 300-char textarea panel and POSTs to `/api/errors/report`. Posts the live
pathname and the full href as metadata.

**Key props:** none

```tsx
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ReportIssueButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setStatus(null)
    setLoading(true)
    const res = await fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: pathname,
        error_code: 'USER_REPORTED_ISSUE',
        message,
        metadata: {
          source: 'manual_report_button',
          href: window.location.href,
        },
      }),
    })
    setLoading(false)
    if (!res.ok) {
      setStatus('Could not send the issue.')
      return
    }
    setMessage('')
    setOpen(false)
    setStatus('Issue sent.')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {open && (
        <div className="w-72 rounded-2xl border border-black/10 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-ink-900">Report a problem</p>
          <textarea
            className="input mt-3 min-h-24 resize-none text-sm"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={300}
            placeholder="What broke or felt confusing?"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={submit} disabled={loading || !message.trim()} className="btn-primary text-xs">
              {loading ? 'Sending…' : 'Send'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
      {status && !open && (
        <p className="rounded-full bg-white px-3 py-1.5 text-xs text-gray-500 shadow-sm">{status}</p>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:text-ink-900"
      >
        Report issue
      </button>
    </div>
  )
}
```

---

## `components/shirt/ShirtShell.tsx` — `ShirtShell` (default export)

The t-shirt canvas: shoulder bar + two rotated sleeve bars + a torso SVG built from
`getShirtTemplate(panel)`, with a `clipPath`/`foreignObject` seam so children (Fabric canvas,
sticker layers) render only inside the drawable area. Picks light/dark strokes and thread
patterns from the shirt hex via `isDark()`.

**Key props:** `shirtColor: string`, `headUrl?: string | null`, `panel: Panel`,
`className?`, `children?`, `showHead = true`, `surfaceClassName?`

```tsx
'use client'

import Image from 'next/image'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'
import { getShirtTemplate } from '@/lib/utils/shirtTemplate'
import type { Panel } from '@/lib/supabase/types'

interface ShirtShellProps {
  shirtColor: string
  headUrl?: string | null
  panel: Panel
  className?: string
  children?: React.ReactNode
  showHead?: boolean
  surfaceClassName?: string
}

const HEAD_PLACEHOLDER =
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#e8e5de"/><circle cx="40" cy="33" r="15" fill="#cfd5df"/><path d="M16 74c5-20 43-20 48 0" fill="#cfd5df"/></svg>')}`

function isDark(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return false
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 120
}

export default function ShirtShell({
  shirtColor,
  headUrl,
  panel,
  className,
  children,
  showHead = true,
  surfaceClassName,
}: ShirtShellProps) {
  const rawId = useId()
  const clipId = `shirt-clip-${rawId.replace(/:/g, '')}`
  const template = getShirtTemplate(panel)
  const dark = isDark(shirtColor)
  const isBack = panel === 'back'
  const isSleeves = panel === 'sleeves'
  const shoulderTop = showHead ? '20%' : '5%'
  const sleeveTop = showHead ? '26%' : '12%'
  const torsoTop = showHead ? '25%' : '8%'
  const torsoHeight = showHead ? '70%' : '88%'

  return (
    <div className={cn('relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-black/10 bg-[#ebe4d8]', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.82),rgba(255,255,255,0)_34%),linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0))]" />

      {showHead && (
        <div className="absolute left-1/2 top-[2.5%] z-30 w-[25%] -translate-x-1/2 overflow-hidden rounded-full border-[5px] border-[#f8f5ee] bg-[#e3e5eb] shadow-sm">
          <div className="relative aspect-square w-full">
            <Image
              src={headUrl ?? HEAD_PLACEHOLDER}
              alt="Avatar head"
              fill
              sizes="180px"
              className={cn('object-cover', isBack && 'opacity-70 blur-[0.4px]')}
            />
          </div>
        </div>
      )}

      <div
        className="absolute left-1/2 z-10 h-[18%] w-[86%] -translate-x-1/2 rounded-[999px] border border-black/5"
        style={{
          top: shoulderTop,
          background: shirtColor,
          boxShadow: 'inset 0 -18px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      />
      <div
        className={cn('absolute left-[4%] z-10 h-[17%] w-[30%] rounded-[999px] border border-black/5', isSleeves && 'ring-2 ring-ink-900/15')}
        style={{
          top: sleeveTop,
          background: shirtColor,
          transform: 'rotate(-9deg)',
          boxShadow: 'inset 0 -18px 32px rgba(0,0,0,0.05)',
        }}
      />
      <div
        className={cn('absolute right-[4%] z-10 h-[17%] w-[30%] rounded-[999px] border border-black/5', isSleeves && 'ring-2 ring-ink-900/15')}
        style={{
          top: sleeveTop,
          background: shirtColor,
          transform: 'rotate(9deg)',
          boxShadow: 'inset 0 -18px 32px rgba(0,0,0,0.05)',
        }}
      />

      <div
        className={cn(
          'absolute left-[18%] z-20 w-[64%] overflow-hidden',
          isSleeves && 'opacity-70',
          surfaceClassName,
        )}
        style={{
          top: torsoTop,
          height: torsoHeight,
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full drop-shadow-sm"
          viewBox={template.viewBox.join(' ')}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path d={template.drawablePath} />
            </clipPath>
            <radialGradient id={`${clipId}-shine`} cx="50%" cy="4%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="42%" stopColor="white" stopOpacity="0.12" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <pattern id={`${clipId}-thread`} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M0 0H10M0 0V10" stroke={dark ? 'rgba(255,255,255,0.07)' : 'rgba(45,41,35,0.045)'} strokeWidth="0.8" />
            </pattern>
          </defs>

          <path
            d={template.visiblePath}
            fill={shirtColor}
            stroke={dark ? 'rgba(255,255,255,0.28)' : 'rgba(45,41,35,0.18)'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path d={template.visiblePath} fill={`url(#${clipId}-shine)`} />
          <path d={template.visiblePath} fill={`url(#${clipId}-thread)`} />
          <path
            d={template.drawablePath}
            fill="none"
            stroke={dark ? 'rgba(255,255,255,0.18)' : 'rgba(45,41,35,0.12)'}
            strokeDasharray="5 7"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />

          <foreignObject
            x="0"
            y="0"
            width={template.viewBox[2]}
            height={template.viewBox[3]}
            clipPath={`url(#${clipId})`}
          >
            <div className="relative h-full w-full">
              {children}
            </div>
          </foreignObject>

          <path
            d={panel === 'back' ? 'M148 54 C172 75 228 75 252 54' : 'M155 10 L170 66 C184 80 216 80 230 66 L245 10'}
            fill={dark ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.52)'}
            stroke={dark ? 'rgba(255,255,255,0.22)' : 'rgba(45,41,35,0.12)'}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M200 104 L200 570"
            stroke={dark ? 'rgba(255,255,255,0.22)' : 'rgba(45,41,35,0.12)'}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
          {[0, 1, 2, 3, 4].map(index => (
            <circle
              key={index}
              cx="200"
              cy={162 + index * 72}
              r="5"
              fill={dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)'}
              stroke={dark ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.22)'}
              strokeWidth="1.4"
            />
          ))}
        </svg>
      </div>

      {isSleeves && (
        <div className="absolute inset-x-6 bottom-4 z-30 rounded-full border border-black/10 bg-white/72 px-3 py-2 text-center text-xs font-medium text-gray-600 shadow-sm backdrop-blur">
          Sleeve mode highlights the side areas, but saves on the same lightweight canvas.
        </div>
      )}
    </div>
  )
}
```

---

## `components/activity/ActivityLog.tsx` — `ActivityLog` (named export)

Timeline of "X signed Y" entries with optimistic emoji reactions, a thumbnail of the
scribble's `canvas_svg`, and a "Sign back" / "Open shirt" link per row. Posts reactions to
`/api/scribble/react` in a transition with rollback on failure.

**Key props:** `items: ActivityItem[]`, `viewerId: string`, `title = 'Activity'`,
`eyebrow = 'Live memories'`, `emptyText = 'No scribbles yet.'`, `className?`

```tsx
'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUpRight, MessageCircleHeart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/utils/reactions'
import { createActionCooldown } from '@/lib/utils/actionCooldown'
import { showToast } from '@/lib/hooks/useToast'
import type { ActivityItem } from '@/lib/utils/activity'

interface ActivityLogProps {
  items: ActivityItem[]
  viewerId: string
  title?: string
  eyebrow?: string
  emptyText?: string
  className?: string
}

type LocalReactionState = Record<
  string,
  {
    counts: Record<ReactionEmoji, number>
    viewer: ReactionEmoji[]
  }
>

export function ActivityLog({
  items,
  viewerId,
  title = 'Activity',
  eyebrow = 'Live memories',
  emptyText = 'No scribbles yet.',
  className,
}: ActivityLogProps) {
  const initial = useMemo(() => {
    return Object.fromEntries(
      items.map(item => [
        item.id,
        { counts: item.reactionCounts, viewer: item.viewerReactions },
      ])
    ) as LocalReactionState
  }, [items])
  const [reactions, setReactions] = useState<LocalReactionState>(initial)
  const [pendingId, startTransition] = useTransition()
  const cooldown = useMemo(() => createActionCooldown({ cooldownMs: 700 }), [])

  useEffect(() => {
    setReactions(initial)
  }, [initial])

  function toggleReaction(itemId: string, emoji: ReactionEmoji) {
    if (!cooldown.canRun(`reaction:${itemId}:${emoji}`)) return
    const previous = reactions
    const current = previous[itemId]
    if (!current) return

    const active = current.viewer.includes(emoji)
    const next = {
      ...previous,
      [itemId]: {
        counts: {
          ...current.counts,
          [emoji]: Math.max(0, current.counts[emoji] + (active ? -1 : 1)),
        },
        viewer: active
          ? current.viewer.filter(existing => existing !== emoji)
          : [...current.viewer, emoji],
      },
    }

    setReactions(next)

    startTransition(async () => {
      try {
        const response = await fetch('/api/scribble/react', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ scribble_id: itemId, emoji }),
        })

        if (!response.ok) throw new Error('reaction failed')
      } catch {
        setReactions(previous)
        showToast({ tone: 'error', title: 'Reaction failed', body: 'Try again in a moment.' })
      }
    })
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <p className="text-eyebrow-uppercase">{eyebrow}</p>
        <h2 className="text-eyebrow-display mt-1">{title}</h2>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-paper-100/60 p-5 text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const local = reactions[item.id]
            const isMine = item.scribblerId === viewerId
            const signBackHref = isMine ? `/profile/${item.shirtOwnerId}` : `/profile/${item.scribblerId}`
            const signBackLabel = isMine ? 'Open shirt' : 'Sign back'

            return (
              <article
                key={item.id}
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-100 bg-paper-100"
                    aria-hidden="true"
                  >
                    {item.canvasSvg ? (
                      <div
                        className="h-full w-full bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(item.canvasSvg)}")` }}
                      />
                    ) : (
                      <MessageCircleHeart className="h-5 w-5 text-gray-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-900">
                      <span className="font-semibold">{item.scribblerName}</span>{' '}
                      signed <span className="font-semibold">{item.shirtOwnerName}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.panel} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {REACTION_EMOJIS.map(emoji => {
                        const count = local?.counts[emoji] ?? 0
                        const active = local?.viewer.includes(emoji) ?? false

                        return (
                          <button
                            key={emoji}
                            type="button"
                            disabled={pendingId}
                            onClick={() => toggleReaction(item.id, emoji)}
                            className={cn(
                              'h-8 rounded-full border px-2.5 text-xs transition',
                              active
                                ? 'border-ink-900 bg-ink-900 text-white'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            )}
                            aria-label={`React ${emoji}`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="ml-1 font-medium">{count}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Link
                    href={signBackHref}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-ink-900 transition hover:border-ink-900"
                  >
                    {signBackLabel}
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
```

---

## `components/notifications/NotificationBell.tsx` — `NotificationBell` (default export)

Bell + dropdown panel driven by `useNotifications(userId)`. Mark-all-read fires when the
panel **closes**. Doubles as the approval inbox: `scribble_pending_approval` rows render
"✓ Post it" / "✗ Not this one" buttons that POST to `/api/scribble/approve` then
`router.refresh()`. Bell glyph is a literal 🔔 emoji; each type maps to an emoji via
`typeEmoji`.

**Key props:** `userId: string`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(userId)
  const [open, setOpen]                 = useState(false)
  // Approval queue for pproval shirts (doc 07). Keyed by scribble, not by
  // person: the decision is about one drawing, not about someone's access.
  const [deciding, setDeciding] = useState<Set<string>>(new Set())
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({})

  const handleToggle = () => {
    // Mark all as read when the panel CLOSES (user had a chance to see them)
    if (open && unreadCount > 0) markAllRead()
    setOpen(v => !v)
  }

  const handleDecision = async (
    scribbleId:     string,
    decision:       'approved' | 'rejected',
    notificationId: string,
  ) => {
    if (deciding.has(scribbleId)) return
    setDeciding(prev => new Set([...prev, scribbleId]))

    try {
      await fetch('/api/scribble/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ scribble_id: scribbleId, decision }),
      })
      setDecisions(prev => ({ ...prev, [scribbleId]: decision }))
      markRead(notificationId)
      router.refresh()
    } finally {
      setDeciding(prev => {
        const next = new Set([...prev])
        next.delete(scribbleId)
        return next
      })
    }
  }

  // Resolve the trigger label dynamically so screen readers announce
  // unread state without the user opening the panel. `useNotifications`
  // streams `unreadCount` asynchronously; the initial value is `0` and
  // any later update flips the label automatically.
  const bellLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : 'Notifications, no unread'

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label={bellLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-scribble-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-badge-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-ink-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-gray-600">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Nothing here yet 🙂
                </div>
              ) : (
                notifications.map(n => {
                  // `scribble_pending_approval` is the owner's decision prompt for
                  // an `approval` shirt. Keyed by the scribble, because the
                  // decision is about one drawing.
                  const isApproval    = n.type === 'scribble_pending_approval'
                  const scribbleId    = n.related_scribble_id
                  const decided       = scribbleId ? decisions[scribbleId] : undefined
                  const isDeciding    = scribbleId ? deciding.has(scribbleId) : false

                  return (
                    <div
                      key={n.id}
                      onClick={() => !isApproval && markRead(n.id)}
                      className={cn(
                        'px-4 py-3 transition',
                        !n.is_read && 'bg-paper-100',
                        !isApproval && 'cursor-pointer hover:bg-gray-50',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">{typeEmoji(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm', !n.is_read && 'font-semibold text-ink-900')}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-gray-500 truncate">{n.body}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>

                          {/* Approve / Reject for scribble requests */}
                          {isApproval && scribbleId && (
                            <div className="mt-2">
                              {decided ? (
                                <p className={cn(
                                  'text-xs font-medium',
                                  decided === 'approved' ? 'text-green-600' : 'text-red-500',
                                )}>
                                  {decided === 'approved' ? '✓ Approved' : '✗ Not posted'}
                                </p>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    disabled={isDeciding}
                                    onClick={e => { e.stopPropagation(); handleDecision(scribbleId, 'approved', n.id) }}
                                    className="flex-1 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition disabled:opacity-50"
                                  >
                                    {isDeciding ? '…' : '✓ Post it'}
                                  </button>
                                  <button
                                    disabled={isDeciding}
                                    onClick={e => { e.stopPropagation(); handleDecision(scribbleId, 'rejected', n.id) }}
                                    className="flex-1 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition disabled:opacity-50"
                                  >
                                    {isDeciding ? '…' : '✗ Not this one'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {!n.is_read && !isApproval && (
                          <div className="w-2 h-2 rounded-full bg-scribble-blue mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function typeEmoji(type: string): string {
  const map: Record<string, string> = {
    scribble_received: '✏️',
    scribble_live:     '🎨',
    request_received:  '📬',
    request_approved:  '✅',
    request_rejected:  '❌',
    shirt_unlocked:    '🎉',
    admin_broadcast:   '📣',
    scribble_removed:  '🗑️',
    scribble_reaction: '❤️',
  }
  return map[type] ?? '🔔'
}
```

---

## `src/features/scribble/components/ScribbleToolbar.tsx` — `ScribbleToolbar` (default export)

The drawing-tool inspector. Groups brushes (pen / pencil / marker / highlighter / brush, each
with a live SVG stroke preview), shapes + a fill toggle, and eraser / text / sticky-note /
sticker. Then recent + curated colour swatches, a stroke-width slider with a live size dot,
a conditional handwriting + highlight section, and undo/redo. `variant` swaps the desktop
`sketch-panel` aside for a 5-column thumb-friendly grid.

**Key props:** `activeMode: CanvasMode`, `tool: ScribbleTool`, `color`, `brushSize`,
`fontStyleId`, `highlightEnabled`, `fillShapes`, `recentColors: string[]`,
`onTool`, `onColor`, `onBrushSize`, `onFontStyle`, `onHighlight`, `onFillShapes`, `onUndo`,
`onRedo`, `variant?: 'desktop' | 'mobile'` (default `desktop`)

```tsx
'use client'

import {
  ArrowUpRight,
  Brush,
  Circle as CircleIcon,
  Eraser,
  Highlighter,
  Minus,
  PaintBucket,
  PenLine,
  Pencil,
  Redo2,
  Smile,
  Square,
  StickyNote,
  Type,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CANVAS_COLORS } from '@/lib/constants'
import type { CanvasMode, ScribbleTool } from '../types'
import HandwritingStylePicker from './HandwritingStylePicker'

interface ScribbleToolbarProps {
  activeMode: CanvasMode
  tool: ScribbleTool
  color: string
  brushSize: number
  fontStyleId: string
  highlightEnabled: boolean
  fillShapes: boolean
  recentColors: string[]
  onTool: (tool: ScribbleTool) => void
  onColor: (color: string) => void
  onBrushSize: (size: number) => void
  onFontStyle: (styleId: string) => void
  onHighlight: (enabled: boolean) => void
  onFillShapes: (enabled: boolean) => void
  onUndo: () => void
  onRedo: () => void
  /**
   * `desktop` keeps the classic vertical aside chrome.
   * `mobile` strips the aside chrome so the toolbar fits inside the bottom sheet
   * and lays the tool buttons out in a more thumb-friendly grid.
   */
  variant?: 'desktop' | 'mobile'
}

interface ToolDescriptor {
  id: ScribbleTool
  label: string
  icon: typeof PenLine
  description: string
  shirt: boolean
  outside: boolean
  /**
   * Optional preview painter — drawn into the small swatch on each tool
   * button so the user can see the brush's character at a glance.
   * The viewBox is 56×16 (square button has more room than rectangular).
   */
  preview?: (color: string) => React.ReactNode
}

function previewLine(color: string, opacity: number, strokeWidth: number, cap: 'round' | 'butt' = 'round') {
  return (
    <svg viewBox="0 0 56 14" width="56" height="14" aria-hidden>
      <path
        d="M2 9 C 10 4, 20 12, 28 7 S 46 5, 54 9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap={cap}
        strokeLinejoin="round"
        fill="none"
        opacity={opacity}
      />
    </svg>
  )
}

const BRUSH_TOOLS: ToolDescriptor[] = [
  {
    id: 'pen',
    label: 'Pen',
    icon: PenLine,
    description: 'Pen — clean, opaque stroke. Great for outlines and tight handwriting.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 1, 2.5),
  },
  {
    id: 'pencil',
    label: 'Pencil',
    icon: Pencil,
    description: 'Pencil — slightly grainy, softer feel for sketchy strokes.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 0.85, 2),
  },
  {
    id: 'marker',
    label: 'Marker',
    icon: PenLine,
    description: 'Marker — bold, opaque, rounded ends. Pops on the shirt.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 1, 6.5),
  },
  {
    id: 'highlighter',
    label: 'Highlighter',
    icon: Highlighter,
    description: 'Highlighter — wide semi-transparent stroke that paints over other ink.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 0.32, 10, 'butt'),
  },
  {
    id: 'brush',
    label: 'Brush',
    icon: Brush,
    description: 'Brush — textured mid-opacity stroke for painterly signatures.',
    shirt: true,
    outside: false,
    preview: color => previewLine(color, 0.92, 5),
  },
]

const ERASER_AND_TEXT: ToolDescriptor[] = [
  {
    id: 'eraser',
    label: 'Eraser',
    icon: Eraser,
    description: 'Eraser — tap a stroke or object to remove it.',
    shirt: true,
    outside: false,
  },
  {
    id: 'text',
    label: 'Text',
    icon: Type,
    description: 'Text — tap on the canvas to add editable handwritten text.',
    shirt: true,
    outside: true,
  },
  {
    id: 'sticky-note',
    label: 'Sticky note',
    icon: StickyNote,
    description: 'Sticky note — yellow paper note pinned outside the shirt.',
    shirt: false,
    outside: true,
  },
  {
    id: 'sticker',
    label: 'Sticker',
    icon: Smile,
    description: 'Sticker — pick a fun icon and drop it on the canvas.',
    shirt: true,
    outside: true,
  },
]

const SHAPE_TOOLS: ToolDescriptor[] = [
  {
    id: 'line',
    label: 'Line',
    icon: Minus,
    description: 'Line — drag to draw a straight line in the current colour.',
    shirt: true,
    outside: false,
  },
  {
    id: 'rect',
    label: 'Rectangle',
    icon: Square,
    description: 'Rectangle — drag to draw a rectangle outline (or fill).',
    shirt: true,
    outside: false,
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: CircleIcon,
    description: 'Circle — drag to draw a circle outline (or fill).',
    shirt: true,
    outside: false,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: ArrowUpRight,
    description: 'Arrow — drag to draw an arrow pointing at the release point.',
    shirt: true,
    outside: false,
  },
]

export default function ScribbleToolbar({
  activeMode,
  tool,
  color,
  brushSize,
  fontStyleId,
  highlightEnabled,
  fillShapes,
  recentColors,
  onTool,
  onColor,
  onBrushSize,
  onFontStyle,
  onHighlight,
  onFillShapes,
  onUndo,
  onRedo,
  variant = 'desktop',
}: ScribbleToolbarProps) {
  const isTextLike = tool === 'text' || tool === 'sticky-note'
  const isShape = tool === 'line' || tool === 'rect' || tool === 'circle' || tool === 'arrow'
  const isMobile = variant === 'mobile'

  function renderToolButton(item: ToolDescriptor, opts: { withPreview?: boolean } = {}) {
    const Icon = item.icon
    const enabled = activeMode === 'shirt' ? item.shirt : item.outside
    const active = tool === item.id

    if (isMobile) {
      return (
        <button
          key={item.id}
          type="button"
          disabled={!enabled}
          onClick={() => onTool(item.id)}
          aria-pressed={active}
          aria-label={item.label}
          title={item.description}
          className={cn(
            'flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[11px] font-semibold transition',
            active
              ? 'border-brand bg-brand-soft text-brand'
              : 'border-black/10 bg-white text-ink-900 hover:bg-black/5',
            !enabled && 'cursor-not-allowed border-transparent bg-black/[0.03] opacity-40 hover:bg-black/[0.03]',
          )}
        >
          <Icon size={18} />
          <span className="leading-tight">{item.label}</span>
        </button>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        disabled={!enabled}
        onClick={() => onTool(item.id)}
        title={item.description}
        className={cn(
          'flex w-full min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition',
          active ? 'bg-brand-soft text-brand' : 'text-ink-900 hover:bg-black/5',
          !enabled && 'cursor-not-allowed opacity-35 hover:bg-transparent',
        )}
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        {opts.withPreview && item.preview && (
          <span className="opacity-90" aria-hidden>
            {item.preview(active ? color : '#2d2923')}
          </span>
        )}
        {active && !opts.withPreview && <span className="h-2 w-2 rounded-full bg-brand" />}
      </button>
    )
  }

  const previewDotPx = Math.min(28, Math.max(4, brushSize * 1.4))

  const body = (
    <>
      {!isMobile && (
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Brushes</p>
      )}
      <div className={isMobile ? 'grid grid-cols-5 gap-1.5' : 'space-y-1'}>
        {BRUSH_TOOLS.map(item => renderToolButton(item, { withPreview: !isMobile }))}
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-3')} />

      {!isMobile && (
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Shapes</p>
      )}
      <div className={isMobile ? 'grid grid-cols-5 gap-1.5' : 'space-y-1'}>
        {SHAPE_TOOLS.map(item => renderToolButton(item))}
        <button
          type="button"
          onClick={() => onFillShapes(!fillShapes)}
          aria-pressed={fillShapes}
          title="Fill shapes — when on, new shapes are filled with the current colour."
          className={cn(
            isMobile
              ? 'flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[11px] font-semibold transition'
              : 'flex w-full min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition',
            fillShapes
              ? 'border-brand bg-brand-soft text-brand'
              : isMobile
                ? 'border-black/10 bg-white text-ink-900 hover:bg-black/5'
                : 'text-ink-900 hover:bg-black/5',
          )}
        >
          <PaintBucket size={isMobile ? 18 : 16} />
          <span className={isMobile ? 'leading-tight' : 'flex-1 text-left'}>{fillShapes ? 'Fill: on' : 'Fill: off'}</span>
        </button>
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-3')} />

      {!isMobile && (
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">More</p>
      )}
      <div className={isMobile ? 'grid grid-cols-5 gap-1.5' : 'space-y-1'}>
        {ERASER_AND_TEXT.map(item => renderToolButton(item))}
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />

      {/* Recent + curated colour swatches. Recent shows the last 6 distinct
          colours the user has picked (state-only, no persistence). */}
      <div>
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Colours</p>
        </div>
        {recentColors.length > 0 && (
          <div className="mb-2 px-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Recent</p>
            <div className="flex flex-wrap gap-1">
              {recentColors.map(item => {
                const active = color === item
                return (
                  <button
                    key={`recent-${item}`}
                    type="button"
                    title={`Recent — ${item}`}
                    aria-label={`Use recent colour ${item}`}
                    aria-pressed={active}
                    onClick={() => onColor(item)}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full transition',
                      active ? 'bg-brand-soft' : 'hover:bg-black/5',
                    )}
                  >
                    <span
                      className={cn(
                        'block h-6 w-6 rounded-full border-2 shadow-sm',
                        active ? 'border-brand' : 'border-white',
                      )}
                      style={{ background: item }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className={isMobile ? 'grid grid-cols-8 gap-1 px-0' : 'grid grid-cols-4 gap-2 px-2'}>
          {CANVAS_COLORS.map(item => {
            const active = color === item
            return (
              <button
                key={item}
                type="button"
                title={`Use colour ${item}`}
                aria-label={`Use colour ${item}`}
                aria-pressed={active}
                onClick={() => onColor(item)}
                className={cn(
                  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition',
                  active ? 'bg-brand-soft' : 'hover:bg-black/5',
                )}
              >
                <span
                  className={cn(
                    'block h-8 w-8 rounded-full border-2 shadow-sm transition',
                    active ? 'scale-110 border-brand' : 'border-white',
                  )}
                  style={{ background: item }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />

      <div className="px-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Stroke</p>
          <span className="text-xs font-semibold text-ink-500">{brushSize}px</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={28}
            value={brushSize}
            onChange={event => onBrushSize(Number(event.target.value))}
            aria-label="Stroke width"
            title={`Stroke width: ${brushSize}px`}
            className="h-6 flex-1 accent-brand"
          />
          {/* Live preview circle whose size matches the current brush width
              (clamped to the inspector column to avoid eating layout). */}
          <span
            aria-hidden
            className="inline-block shrink-0 rounded-full border border-black/10 shadow-sm"
            style={{
              width: `${previewDotPx}px`,
              height: `${previewDotPx}px`,
              backgroundColor: color,
              opacity: tool === 'highlighter' ? 0.4 : tool === 'pencil' ? 0.85 : 1,
            }}
          />
        </div>
      </div>

      {(isTextLike || isShape) && (
        <>
          <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />
          {isTextLike && (
            <>
              <HandwritingStylePicker value={fontStyleId} onChange={onFontStyle} variant={isMobile ? 'grid' : 'stack'} />
              <button
                type="button"
                onClick={() => onHighlight(!highlightEnabled)}
                aria-pressed={highlightEnabled}
                title={highlightEnabled ? 'Disable text highlight' : 'Highlight new text in soft yellow'}
                className={cn(
                  'mt-3 flex w-full min-h-11 items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                  highlightEnabled ? 'border-[#f2c84b] bg-[#fff4b8]' : 'border-black/10 bg-white hover:bg-black/5',
                )}
              >
                Highlight note
                <span className="block h-4 w-8 rounded-full bg-white shadow-inner">
                  <span className={cn('block h-4 w-4 rounded-full bg-[#f2c84b] transition', highlightEnabled && 'translate-x-4')} />
                </span>
              </button>
            </>
          )}
          {isShape && (
            <p className="px-2 text-xs text-ink-500">
              Tap-and-drag on the shirt to draw {tool === 'arrow' ? 'an arrow' : `a ${tool}`}. Toggle Fill above to switch between outline and solid.
            </p>
          )}
        </>
      )}

      <div className={cn('border-t border-black/10', isMobile ? 'my-3' : 'my-4')} />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onUndo}
          aria-label="Undo"
          title="Undo last stroke"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          <Undo2 size={16} />
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          aria-label="Redo"
          title="Redo last undone stroke"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          <Redo2 size={16} />
          Redo
        </button>
      </div>
    </>
  )

  return isMobile
    ? <div className="space-y-3">{body}</div>
    : <aside className="sketch-panel p-3">{body}</aside>
}
```

---

## `src/features/scribble/components/ScribbleBottomBar.tsx` — `ScribbleBottomBar` (default export)

Sticky bottom action bar for the studio. A permission-state sentence, a zoom cluster
(−/percent/+/Fit, clamped 50–200 in 25-point steps), Clear draft, and Publish. Below `lg`
it collapses to a slim zoom cluster + brand-coloured Publish; from `lg` it expands to the
full four-column toolbar.

**Key props:** `activeMode: CanvasMode`, `permissionState: 'can' | 'request' | 'locked' | 'own'`,
`zoom: number`, `onZoom`, `onFitZoom`, `onClear`, `onPublish`, `canPublish: boolean`,
`isSaving: boolean`, `publishLabel?`

```tsx
'use client'

import { Maximize2, Minus, Plus, Send, Trash2 } from 'lucide-react'
import type { CanvasMode } from '../types'

interface ScribbleBottomBarProps {
  activeMode: CanvasMode
  permissionState: 'can' | 'request' | 'locked' | 'own'
  zoom: number
  onZoom: (zoom: number) => void
  onFitZoom: () => void
  onClear: () => void
  onPublish: () => void
  canPublish: boolean
  isSaving: boolean
  publishLabel?: string
}

const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 25

function statusText(activeMode: CanvasMode, permissionState: ScribbleBottomBarProps['permissionState']) {
  if (permissionState === 'can') {
    return activeMode === 'shirt'
      ? 'Drawing stays inside the shirt'
      : 'Outside notes stay around the profile'
  }
  if (permissionState === 'request') return 'Ask permission to scribble'
  if (permissionState === 'own') return 'You cannot sign your own shirt'
  return 'Waiting for approval'
}

export default function ScribbleBottomBar({
  activeMode,
  permissionState,
  zoom,
  onZoom,
  onFitZoom,
  onClear,
  onPublish,
  canPublish,
  isSaving,
  publishLabel,
}: ScribbleBottomBarProps) {
  const status = statusText(activeMode, permissionState)
  const sendingLabel = isSaving ? 'Publishing…' : (publishLabel ?? 'Publish scribble')
  const mobileSendingLabel = isSaving ? 'Publishing…' : (publishLabel ?? 'Publish')
  return (
    <footer
      className="sticky bottom-0 z-30 border-t border-black/10 bg-paper-100/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Mobile: condensed Publish bar with a slim zoom cluster on the left
          so the user can zoom on phones without opening the bottom sheet. */}
      <div className="flex items-center gap-2 px-3 py-2 lg:hidden">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-[36px] text-center tabular-nums">{zoom}%</span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={onFitZoom}
            aria-label="Fit"
            title="Fit to screen"
            className="ml-1 inline-flex items-center rounded-lg px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-black/5"
          >
            <Maximize2 size={12} />
          </button>
        </div>
        <p className="hidden min-w-0 flex-1 truncate text-xs font-semibold text-ink-500 xs:block">{status}</p>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSaving}
          className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Send size={16} />
          {mobileSendingLabel}
        </button>
      </div>

      {/* Desktop: full toolbar */}
      <div className="hidden gap-3 px-4 py-3 lg:grid lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <p className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink-500">
          {status}
        </p>
        <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => onZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            title="Zoom out"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Minus size={15} />
          </button>
          <span className="min-w-[42px] text-center tabular-nums">{zoom}%</span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            title="Zoom in"
            className="rounded-lg p-1 hover:bg-black/5 disabled:opacity-40"
          >
            <Plus size={15} />
          </button>
          <span aria-hidden className="mx-1 h-5 w-px bg-black/10" />
          <button
            type="button"
            onClick={onFitZoom}
            aria-label="Fit"
            title="Fit to screen (100%)"
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-bold uppercase tracking-[0.12em] hover:bg-black/5"
          >
            <Maximize2 size={13} />
            Fit
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex flex-1 min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Clear draft
          </button>
        </div>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSaving}
          className="rounded-2xl bg-ink-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {sendingLabel}
        </button>
      </div>
    </footer>
  )
}
```

---

## `src/features/scribble/components/StickerPicker.tsx` — `StickerPicker` (default export)

Grid of emoji stickers from `SCRIBBL_STICKERS`. Column count is 4 / 6 / 3 only; anything
else falls back to 3.

**Key props:** `onSelect: (stickerId: string) => void`, `heading = true`, `columns = 6`

```tsx
'use client'

import { cn } from '@/lib/utils/cn'
import { SCRIBBL_STICKERS } from '../data/stickers'

interface StickerPickerProps {
  onSelect: (stickerId: string) => void
  heading?: boolean
  columns?: number
}

export default function StickerPicker({ onSelect, heading = true, columns = 6 }: StickerPickerProps) {
  const gridClass = columns === 4
    ? 'grid-cols-4'
    : columns === 6
      ? 'grid-cols-6'
      : 'grid-cols-3'

  return (
    <div>
      {heading && (
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-2xl font-bold text-ink-900">Quick stickers</p>
          <span className="text-xs font-semibold text-brand">12 ready</span>
        </div>
      )}
      <div className={cn('grid gap-2', gridClass)}>
        {SCRIBBL_STICKERS.map(sticker => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => onSelect(sticker.id)}
            title={sticker.label}
            aria-label={sticker.label}
            className="flex aspect-square min-h-14 min-w-14 items-center justify-center rounded-2xl border border-black/10 bg-white text-2xl shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
          >
            {sticker.symbol}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## `src/features/scribble/components/HandwritingStylePicker.tsx` — `HandwritingStylePicker` (default export)

Buttons previewing each handwriting font by rendering `sampleText` in that font. Selected
state is `border-brand ring-2 ring-brand/30`.

**Key props:** `value: string`, `onChange: (styleId: string) => void`,
`variant?: 'stack' | 'grid'` (default `stack`)

```tsx
'use client'

import { cn } from '@/lib/utils/cn'
import { HANDWRITING_STYLES } from '../data/handwritingStyles'

interface HandwritingStylePickerProps {
  value: string
  onChange: (styleId: string) => void
  variant?: 'stack' | 'grid'
}

export default function HandwritingStylePicker({ value, onChange, variant = 'stack' }: HandwritingStylePickerProps) {
  return (
    <div>
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Handwriting</p>
      <div className={cn(variant === 'grid' ? 'grid grid-cols-2 gap-2' : 'grid gap-2')}>
        {HANDWRITING_STYLES.map(style => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={cn(
              'min-h-14 rounded-2xl border bg-white px-3 py-2 text-left transition hover:bg-black/5',
              value === style.id
                ? 'border-brand ring-2 ring-brand/30'
                : 'border-black/10',
            )}
          >
            <span className="block text-xs font-semibold text-ink-500">{style.label}</span>
            <span
              className="block truncate text-base text-ink-900"
              style={{
                fontFamily: style.fontFamily,
                fontWeight: 'defaultWeight' in style ? style.defaultWeight : undefined,
              }}
            >
              {style.sampleText}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## `src/features/scribble/components/SignaturePanel.tsx` — `SignaturePanel` (default export)

Signature-mode inspector: handwriting picker, 8-column colour grid, 18–72pt size slider, a
full-width brand "Sign" CTA, and an "Use full canvas instead" escape hatch. Does not touch
the canvas — the parent (`ScribbleStudio`) places the text.

**Key props:** `fontStyleId`, `color`, `fontSize`, `onFontStyle`, `onColor`, `onFontSize`,
`onExit`, `onPublish`, `canPublish`, `isSaving`, `variant?: 'desktop' | 'mobile'`

```tsx
'use client'

import { Send } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CANVAS_COLORS } from '@/lib/constants'
import { HANDWRITING_STYLES } from '../data/handwritingStyles'

interface SignaturePanelProps {
  fontStyleId: string
  color: string
  fontSize: number
  onFontStyle: (id: string) => void
  onColor: (color: string) => void
  onFontSize: (size: number) => void
  onExit: () => void
  onPublish: () => void
  canPublish: boolean
  isSaving: boolean
  variant?: 'desktop' | 'mobile'
}

/**
 * The signature-mode inspector. It collapses the full studio toolbar to just
 * the three controls a signer needs: font, colour, size — plus a big "Sign"
 * CTA and an escape hatch back to the full canvas. The signature text is
 * placed on the Fabric canvas by the parent (ScribbleStudio) so this panel
 * does not need to touch the canvas directly.
 */
export default function SignaturePanel({
  fontStyleId,
  color,
  fontSize,
  onFontStyle,
  onColor,
  onFontSize,
  onExit,
  onPublish,
  canPublish,
  isSaving,
  variant = 'desktop',
}: SignaturePanelProps) {
  const isMobile = variant === 'mobile'

  const body = (
    <div className="space-y-4">
      <div>
        <p className="font-display text-2xl font-bold text-ink-900">Signature mode</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">
          Edit the text on the shirt, pick a handwriting style and a colour,
          then tap Sign. You can return to the full canvas any time.
        </p>
      </div>

      <div>
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Handwriting</p>
        <div className="grid grid-cols-2 gap-2">
          {HANDWRITING_STYLES.map(style => (
            <button
              key={style.id}
              type="button"
              onClick={() => onFontStyle(style.id)}
              title={style.label}
              className={cn(
                'min-h-14 rounded-2xl border bg-white px-3 py-2 text-left transition hover:bg-black/5',
                fontStyleId === style.id ? 'border-brand ring-2 ring-brand/30' : 'border-black/10',
              )}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">{style.label}</span>
              <span
                className="block truncate text-base text-ink-900"
                style={{
                  fontFamily: style.fontFamily,
                  fontWeight: 'defaultWeight' in style ? style.defaultWeight : undefined,
                }}
              >
                {style.sampleText}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Colour</p>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {CANVAS_COLORS.map(item => {
            const active = color === item
            return (
              <button
                key={item}
                type="button"
                title={item}
                aria-label={`Use signature colour ${item}`}
                aria-pressed={active}
                onClick={() => onColor(item)}
                className={cn(
                  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition',
                  active ? 'bg-brand-soft' : 'hover:bg-black/5',
                )}
              >
                <span
                  className={cn(
                    'block h-7 w-7 rounded-full border-2 shadow-sm',
                    active ? 'scale-110 border-brand' : 'border-white',
                  )}
                  style={{ background: item }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">Size</p>
          <span className="text-xs font-semibold text-ink-500">{fontSize}pt</span>
        </div>
        <input
          type="range"
          min={18}
          max={72}
          step={2}
          value={fontSize}
          onChange={event => onFontSize(Number(event.target.value))}
          aria-label="Signature size"
          className="h-6 w-full accent-brand"
        />
      </div>

      <button
        type="button"
        onClick={onPublish}
        disabled={!canPublish || isSaving}
        className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Send size={16} />
        {isSaving ? 'Signing...' : 'Sign'}
      </button>

      <button
        type="button"
        onClick={onExit}
        className="block w-full text-center text-xs font-semibold text-brand underline-offset-2 hover:underline"
      >
        Use full canvas instead
      </button>
    </div>
  )

  return isMobile
    ? <div>{body}</div>
    : <aside className="sketch-panel p-4">{body}</aside>
}
```

---

## `src/features/scribble/components/ZoomViewport.tsx` — `ZoomViewport` (default export)

CSS `transform: scale()` wrapper that layers pan/zoom gestures over the Fabric canvas
**without** changing the Fabric coordinate space (drawing stays in the canonical 400×600
shirt space at any zoom). Procreate-style gestures: one finger draws; two fingers pan +
pinch-zoom anchored at the midpoint (cancelling the interrupted stroke via
`onGestureStart`); Ctrl/Cmd + wheel zooms toward the cursor; Space-drag or middle-drag pans
on desktop. Pan is clamped so the scaled stage never reveals void.

**Key props:** `zoom: number`, `onZoom: (zoom: number) => void`, `minZoom = 50`,
`maxZoom = 200`, `onGestureStart?`, `onGestureEnd?`, `className?`, `children`

```tsx
'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface ZoomViewportProps {
  /** Current zoom level as a percentage (100 = 1:1). */
  zoom: number
  /** Called when the user pinches (touch) or Ctrl/Cmd-wheels (desktop). */
  onZoom: (zoom: number) => void
  /** Min/max zoom percent for clamping pinch and wheel zoom. */
  minZoom?: number
  maxZoom?: number
  /** Fired when a pan/pinch gesture takes over from drawing (two fingers
   *  down, Space-drag, middle-drag). Use it to cancel an in-progress stroke. */
  onGestureStart?: () => void
  /** Fired when the pan/pinch gesture ends and drawing may resume. */
  onGestureEnd?: () => void
  className?: string
  children: React.ReactNode
}

/**
 * Scales its children with `transform: scale()` and layers pan/zoom gestures
 * on top WITHOUT changing the underlying Fabric coordinate space — drawing
 * always happens in the canonical 400×600 shirt space and works at any zoom
 * (Fabric maps pointers through the element's bounding rect, so the CSS
 * transform is invisible to it).
 *
 * Gesture model (Procreate-style):
 *   • one finger / pen / mouse → draws, at any zoom level
 *   • two fingers              → pan + pinch-zoom (anchored at the midpoint);
 *                                the interrupted stroke is cancelled via
 *                                `onGestureStart`
 *   • Ctrl/Cmd + wheel         → zoom toward the cursor (trackpad pinch too)
 *   • Space-drag / middle-drag → pan on desktop
 *
 * The pan offset is clamped so the scaled stage never reveals "void" outside
 * the original viewport bounds, keeping the shirt fully reachable.
 */
export default function ZoomViewport({
  zoom,
  onZoom,
  minZoom = 50,
  maxZoom = 200,
  onGestureStart,
  onGestureEnd,
  className,
  children,
}: ZoomViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)

  const pinchState = useRef<{ distance: number; mid: { x: number; y: number } } | null>(null)
  const panStart = useRef<{ pointerX: number; pointerY: number; panX: number; panY: number } | null>(null)
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const viewportSizeRef = useRef(viewportSize)
  const onZoomRef = useRef(onZoom)
  const onGestureStartRef = useRef(onGestureStart)
  const onGestureEndRef = useRef(onGestureEnd)
  // Mirror "actively interacting" into state so render can flip the transition
  // off mid-gesture (the refs themselves aren't safe to read during render).
  const [isPanning, setIsPanning] = useState(false)
  const [isPinching, setIsPinching] = useState(false)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { viewportSizeRef.current = viewportSize }, [viewportSize])
  useEffect(() => { onZoomRef.current = onZoom }, [onZoom])
  useEffect(() => { onGestureStartRef.current = onGestureStart }, [onGestureStart])
  useEffect(() => { onGestureEndRef.current = onGestureEnd }, [onGestureEnd])

  const scale = zoom / 100
  const isZoomed = zoom > 100

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => setViewportSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update)
      observer.observe(el)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Re-centre when the user zooms back to ≤100% so they never get "stuck"
  // looking at an off-canvas corner.
  useEffect(() => {
    if (!isZoomed) setPan({ x: 0, y: 0 })
  }, [isZoomed])

  function clampPanFor(next: { x: number; y: number }, forScale: number) {
    const size = viewportSizeRef.current
    const overflowX = Math.max(0, (size.w * (forScale - 1)) / 2)
    const overflowY = Math.max(0, (size.h * (forScale - 1)) / 2)
    return {
      x: Math.max(-overflowX, Math.min(overflowX, next.x)),
      y: Math.max(-overflowY, Math.min(overflowY, next.y)),
    }
  }

  /**
   * Zoom to `nextZoom` keeping the content under `focal` (viewport-relative
   * px) visually fixed. With transform-origin center:
   *   screen = center + pan + s · (p − center)
   * solving for the new pan that keeps p under the focal point.
   */
  function zoomAtPoint(nextZoomRaw: number, focal: { x: number; y: number }) {
    const nextZoom = Math.max(minZoom, Math.min(maxZoom, Math.round(nextZoomRaw)))
    const currentScale = zoomRef.current / 100
    const nextScale = nextZoom / 100
    const size = viewportSizeRef.current
    const cx = size.w / 2
    const cy = size.h / 2
    const ratio = nextScale / currentScale
    const currentPan = panRef.current
    const nextPan = clampPanFor({
      x: focal.x - cx - ratio * (focal.x - cx - currentPan.x),
      y: focal.y - cy - ratio * (focal.y - cy - currentPan.y),
    }, nextScale)
    setPan(nextPan)
    onZoomRef.current(nextZoom)
  }

  // Touch: two fingers pan + pinch. One-finger touches are never intercepted
  // — they belong to drawing. Raw listeners (passive: false) so we can
  // preventDefault before the browser starts a native scroll/zoom.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    function distance(a: Touch, b: Touch) {
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }

    function midpoint(a: Touch, b: Touch) {
      const rect = el!.getBoundingClientRect()
      return {
        x: (a.clientX + b.clientX) / 2 - rect.left,
        y: (a.clientY + b.clientY) / 2 - rect.top,
      }
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length === 2) {
        event.preventDefault()
        pinchState.current = {
          distance: distance(event.touches[0], event.touches[1]),
          mid: midpoint(event.touches[0], event.touches[1]),
        }
        setIsPinching(true)
        // The first finger may have already started a stroke — cancel it.
        onGestureStartRef.current?.()
      }
    }

    function onTouchMove(event: TouchEvent) {
      const state = pinchState.current
      if (!state || event.touches.length < 2) return
      event.preventDefault()

      const nextDistance = distance(event.touches[0], event.touches[1])
      const nextMid = midpoint(event.touches[0], event.touches[1])
      const currentScale = zoomRef.current / 100
      const nextZoom = Math.max(minZoom, Math.min(maxZoom,
        Math.round(zoomRef.current * (nextDistance / state.distance))))
      const nextScale = nextZoom / 100

      // Anchor the zoom at the previous midpoint, then follow the midpoint's
      // translation — this gives combined pan + pinch in one gesture.
      const size = viewportSizeRef.current
      const cx = size.w / 2
      const cy = size.h / 2
      const ratio = nextScale / currentScale
      const currentPan = panRef.current
      setPan(clampPanFor({
        x: nextMid.x - cx - ratio * (state.mid.x - cx - currentPan.x),
        y: nextMid.y - cy - ratio * (state.mid.y - cy - currentPan.y),
      }, nextScale))
      onZoomRef.current(nextZoom)

      pinchState.current = { distance: nextDistance, mid: nextMid }
    }

    function onTouchEnd(event: TouchEvent) {
      if (pinchState.current && event.touches.length < 2) {
        pinchState.current = null
        setIsPinching(false)
        onGestureEndRef.current?.()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
    // Latest zoom/pan/sizes are read via refs inside the listeners.
  }, [minZoom, maxZoom])

  // Desktop: Ctrl/Cmd + wheel (incl. trackpad pinch) zooms toward the cursor.
  // Raw listener because React's onWheel is passive and can't preventDefault.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const rect = el!.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * 0.0015)
      zoomAtPoint(zoomRef.current * factor, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // zoomAtPoint reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minZoom, maxZoom])

  // Space toggles pan mode on desktop (ignored while typing).
  useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const element = target as HTMLElement | null
      return Boolean(element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable))
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat || isTyping(event.target)) return
      event.preventDefault()
      setSpaceHeld(true)
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== 'Space') return
      setSpaceHeld(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Desktop pan: capture-phase pointer handlers so Space-drag / middle-drag
  // take the gesture before the drawing canvas sees it. Regular drags pass
  // straight through to Fabric.
  function onPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
    const wantsPan = spaceHeld || event.button === 1
    if (!wantsPan) return
    event.preventDefault()
    event.stopPropagation()
    panStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    setIsPanning(true)
    onGestureStartRef.current?.()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function onPointerMoveCapture(event: React.PointerEvent<HTMLDivElement>) {
    if (!panStart.current) return
    event.preventDefault()
    event.stopPropagation()
    const dx = event.clientX - panStart.current.pointerX
    const dy = event.clientY - panStart.current.pointerY
    setPan(clampPanFor({ x: panStart.current.panX + dx, y: panStart.current.panY + dy }, scale))
  }

  function onPointerUpCapture(event: React.PointerEvent<HTMLDivElement>) {
    if (!panStart.current) return
    event.stopPropagation()
    panStart.current = null
    setIsPanning(false)
    onGestureEndRef.current?.()
    try {
      ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    } catch {
      // Pointer might already be released; ignore.
    }
  }

  return (
    <div
      ref={viewportRef}
      className={className}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMoveCapture={onPointerMoveCapture}
      onPointerUpCapture={onPointerUpCapture}
      onPointerCancelCapture={onPointerUpCapture}
      style={{
        position: 'relative',
        overflow: 'hidden',
        // The viewport owns multi-touch; single-finger input flows through
        // to the drawing canvas (which sets its own touch-action: none).
        touchAction: 'none',
        cursor: isPanning ? 'grabbing' : spaceHeld ? 'grab' : undefined,
      }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isPanning || isPinching ? 'none' : 'transform 120ms ease',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

---

## `src/features/scribble/components/CanvasModeToggle.tsx` — `CanvasModeToggle` (default export)

Two-button segmented control switching between the shirt canvas and outside notes. Active
segment is `bg-brand text-white`.

**Key props:** `mode: CanvasMode`, `onMode: (mode: CanvasMode) => void`, `size?: 'sm' | 'md'`

```tsx
'use client'

import { cn } from '@/lib/utils/cn'
import type { CanvasMode } from '../types'

interface CanvasModeToggleProps {
  mode: CanvasMode
  onMode: (mode: CanvasMode) => void
  size?: 'sm' | 'md'
}

export default function CanvasModeToggle({ mode, onMode, size = 'md' }: CanvasModeToggleProps) {
  return (
    <div className="inline-flex rounded-2xl border border-black/10 bg-white p-1 shadow-sm">
      {([
        ['shirt', 'Shirt canvas'],
        ['outside-notes', 'Outside notes'],
      ] as const).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onMode(id)}
          className={cn(
            'min-h-11 rounded-xl font-bold transition',
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            mode === id ? 'bg-brand text-white shadow-sm' : 'text-ink-500 hover:bg-black/5',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```