import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="scribbl-page min-h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(45,41,35,0.10)' }}>
        <Skeleton variant="rect" className="h-7 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton variant="rect" className="h-8 w-24" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 grid gap-6 md:grid-cols-[260px_1fr_280px]">
        {/* Left rail */}
        <div className="hidden md:flex flex-col gap-4">
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-44" />
          <Skeleton variant="card" className="h-28" />
        </div>

        {/* Avatar centerpiece */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-2 self-center">
            <Skeleton variant="rect" className="h-8 w-20" />
            <Skeleton variant="rect" className="h-8 w-20" />
          </div>
          <Skeleton variant="card" className="h-[360px] md:h-[420px] w-full max-w-sm" />
          <div className="flex gap-2 w-full max-w-sm">
            <Skeleton variant="rect" className="h-10 flex-1" />
            <Skeleton variant="rect" className="h-10 flex-1" />
            <Skeleton variant="rect" className="h-10 w-10" />
          </div>
        </div>

        {/* Right rail */}
        <div className="hidden md:flex flex-col gap-4">
          <Skeleton variant="card" className="h-44" />
          <Skeleton variant="card" className="h-36" />
          <Skeleton variant="card" className="h-28" />
        </div>
      </div>
    </div>
  )
}
