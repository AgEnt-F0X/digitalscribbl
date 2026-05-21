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
