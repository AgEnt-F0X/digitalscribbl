import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import BottomNav from '@/components/nav/BottomNav'
import { ROUTES } from '@/lib/constants'
import YearbookControls from './YearbookControls'
import ExportRequestForm from './ExportRequestForm'

export const dynamic = 'force-dynamic'

interface GridRow {
  id: string
  display_name: string
  avatar_config: unknown
  head_front_url: string | null
  yearbook_quote: string | null
  batch_id: string
  scribble_count: number
}

interface Props {
  searchParams: Promise<{ batch?: string; group?: string }>
}

export default async function YearbookPage({ searchParams }: Props) {
  const { supabase, user } = await requirePageUser()
  const filters = await searchParams

  // Fetch viewer's batch for default filter
  const { data: me } = await supabase
    .from('users')
    .select('batch_id, batches(label, graduation_year, programs(name, academic_groups(name)))')
    .eq('id', user.id)
    .single()

  const defaultBatchId  = me?.batch_id ?? ''
  const activeBatchId   = filters.batch ?? defaultBatchId

  // Fetch all batches for the filter dropdown
  const { data: batches } = await supabase
    .from('batches')
    .select('id, label, graduation_year, programs(name, academic_groups(name))')
    .order('graduation_year', { ascending: false })

  // Fetch yearbook grid from the materialized view — avoids the N+1
  // scribble-count query that the previous page did.
  const { data: rawGrid } = await supabase
    .from('yearbook_grid_stats')
    .select('*')
    .eq('onboarding_completed', true)
    .order('display_name')

  let grid = (rawGrid ?? []) as GridRow[]
  if (activeBatchId) {
    grid = grid.filter(r => r.batch_id === activeBatchId)
  }
  const countMap: Record<string, number> = {}
  for (const r of grid) {
    countMap[r.id] = r.scribble_count
  }

  const activeBatch = batches?.find(b => b.id === activeBatchId)
  const batchLabel  = activeBatch
    ? ((activeBatch as unknown as { label: string | null; graduation_year: number }).label
        ?? String((activeBatch as unknown as { graduation_year: number }).graduation_year))
    : 'All batches'

  const { data: groupMemberships } = await supabase
    .from('friend_group_members')
    .select('friend_groups(id, name)')
    .eq('user_id', user.id)

  const exportGroups = (groupMemberships ?? [])
    .map(row => row.friend_groups as unknown as { id: string; name: string } | null)
    .filter((group): group is { id: string; name: string } => Boolean(group?.id))

  return (
    <div className="min-h-screen bg-paper-100 pb-24 md:pb-0">
      {/* Nav */}
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur print:hidden">
        <Link href="/dashboard" className="font-display font-bold text-xl text-ink-900">scribbl</Link>
        <YearbookControls
          batches={(batches ?? []).map(b => {
            const bb = b as unknown as { id: string; label: string | null; graduation_year: number; programs: { name: string } }
            return { id: bb.id, label: bb.label, graduation_year: bb.graduation_year, programName: bb.programs.name }
          })}
          activeBatchId={activeBatchId}
        />
      </nav>

      {/* Download all cards link */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900">Yearbook</h1>
          <p className="text-sm text-gray-500">{batchLabel} · {grid.length} students</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/api/avatar/export?userId=${user.id}&panel=front`}
            target="_blank"
            className="btn-secondary text-sm"
          >
            ⬇ My card (PNG)
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-3">
        <ExportRequestForm activeBatchId={activeBatchId} batchLabel={batchLabel} groups={exportGroups} />
      </div>

      {/* ── Yearbook grid ── */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {/* Print header (visible only in print) */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900">{batchLabel}</h1>
          <p className="text-gray-500 mt-1">Scribbl · {new Date().getFullYear()}</p>
        </div>

        {grid.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📖</p>
            <p>No students in this batch yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 print:grid-cols-4 print:gap-3">
            {grid.map(u => {
              const scribbles  = countMap[u.id] ?? 0

              return (
                <Link
                  key={u.id}
                  href={ROUTES.profile(u.id)}
                  className="group flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition print:break-inside-avoid print:border print:border-gray-200"
                >
                  <div className="relative w-full">
                    <Avatar
                      row={{ avatar_config: u.avatar_config, head_front_url: u.head_front_url }}
                      displayName={u.display_name}
                      scribbleCount={scribbles}
                      size="sm"
                      className="mx-auto group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="text-center w-full">
                    <p className="text-xs font-semibold text-ink-900 truncate">
                      {u.display_name}
                    </p>
                    {u.yearbook_quote ? (
                      <p className="text-[10px] text-gray-400 italic line-clamp-2 mt-0.5 leading-tight">
                        &ldquo;{u.yearbook_quote}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-300 mt-0.5">—</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Print footer */}
        <div className="hidden print:block text-center mt-12 text-xs text-gray-400 border-t border-gray-200 pt-4">
          Generated by scribbl · {new Date().toLocaleDateString()}
        </div>
      </main>

      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block  { display: block !important; }
          .print\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .print\\:gap-3 { gap: 0.75rem !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
      <div className="print:hidden">
        <BottomNav currentUserId={user.id} />
      </div>
    </div>
  )
}
