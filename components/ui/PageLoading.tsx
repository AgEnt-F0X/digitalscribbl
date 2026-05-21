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
