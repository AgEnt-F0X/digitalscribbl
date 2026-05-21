import Link from 'next/link'
import { Search } from 'lucide-react'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import BottomNav from '@/components/nav/BottomNav'
import PlaceBackground from '@/components/place/PlaceBackground'
import Whiteboard from '@/components/brand/Whiteboard'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import HandDrawnArrow from '@/components/marginalia/HandDrawnArrow'
import ExploreSearchField from './ExploreSearchField'
import { ROUTES, ONLINE_THRESHOLD_MS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    q?:     string
    group?: string
    prog?:  string
    batch?: string
    page?:  string
  }>
}

const PAGE_SIZE = 24

export default async function ExplorePage({ searchParams }: Props) {
  const { supabase, user } = await requirePageUser()
  const filters = await searchParams

  const page  = Math.max(0, Number(filters.page ?? 0))
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString()

  let query = supabase
    .from('users')
    .select(`
      id, display_name, body_style, shirt_color, head_front_url, avatar_config, last_seen,
      batches(label, graduation_year, programs(name, academic_groups(name))),
      shirts(id)
    `)
    .eq('onboarding_completed', true)
    .eq('is_suspended', false)
    .neq('id', user.id)
    .order('display_name')
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (filters.q) {
    query = query.ilike('display_name', `%${filters.q}%`)
  }
  if (filters.batch) {
    query = query.eq('batch_id', filters.batch)
  } else if (filters.prog) {
    query = query.eq('program_id', filters.prog)
  } else if (filters.group) {
    query = query.eq('academic_group_id', filters.group)
  }

  const { data: users } = await query

  const { data: viewerProfile } = await supabase
    .from('users')
    .select('display_name, body_style, shirt_color, head_front_url, avatar_config')
    .eq('id', user.id)
    .single()

  // Verified-classmate count for the wall-mounted whiteboard subtitle.
  // Doc 18 § 7 "wall-mounted on /explore" — `class of 2026 · N classmates`.
  // Pulled with `head: true` so we only fetch the count, no rows.
  const { count: verifiedCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('onboarding_completed', true)
    .eq('is_suspended', false)

  const [{ data: groups }, { data: programs }, { data: batches }] = await Promise.all([
    supabase.from('academic_groups').select('id, name').order('name'),
    filters.group
      ? supabase.from('programs').select('id, name').eq('academic_group_id', filters.group).order('name')
      : Promise.resolve({ data: [] }),
    filters.prog
      ? supabase.from('batches').select('id, label, graduation_year').eq('program_id', filters.prog).order('graduation_year', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const userIds = (users ?? []).map(u => u.id)
  const { data: scribblesData } = userIds.length
    ? await supabase.from('scribbles')
        .select('shirt_id, shirts!inner(owner_id)')
        .in('shirts.owner_id', userIds)
        .eq('is_hidden', false)
    : { data: [] }

  const scribbleCountMap: Record<string, number> = {}
  for (const s of scribblesData ?? []) {
    const oid = (s.shirts as unknown as { owner_id: string }).owner_id
    scribbleCountMap[oid] = (scribbleCountMap[oid] ?? 0) + 1
  }

  const classmatesLabel = `${(verifiedCount ?? 0).toLocaleString()} classmates`

  return (
    <div className="scribbl-page relative min-h-screen pb-24 md:pb-0">
      {/* Place layer — classroom-hall, first-visit hero → ambient (doc 18 § 3). */}
      <PlaceBackground surface="explore" illustration="classroom-hall" />
      {/* Drifting doodles — low density on a search-focused surface. */}
      <DriftingDoodles density="low" />

      <div className="relative z-10">
        <nav className="sticky top-0 z-30 border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/dashboard" className="font-display font-bold text-xl text-ink-900">scribbl</Link>
            <div className="flex items-center gap-3">
              <NotificationBell userId={user.id} />
              <Link href={ROUTES.profile(user.id)}>
                <Avatar
                  row={viewerProfile ?? null}
                  displayName={viewerProfile?.display_name}
                  size="sm"
                />
              </Link>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {/* Whiteboard hero — replaces the old card-style page header. */}
          <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3">
              <p className="text-eyebrow-uppercase">Explore</p>
              <h1 className="text-hero-display">Find someone to sign</h1>
              <p className="text-nostalgia max-w-md">
                Jump between real shirts and leave visible marks. The whiteboard above shows tonight&apos;s roll.
              </p>
            </div>
            <div className="w-full max-w-[320px] self-start sm:self-end">
              <Whiteboard
                variant="wall-mounted"
                title="class of 2026"
                subtitle={classmatesLabel}
                markerColor="black"
              />
            </div>
          </header>

          <AsteriskDivider />

          {/* Filters — substrate, no card chrome. The search input grows
              the InkUnderline beneath it on focus / non-empty. */}
          <form className="mb-8 flex flex-wrap items-end gap-3">
            <ExploreSearchField defaultValue={filters.q} />
            <select
              name="group"
              defaultValue={filters.group}
              aria-label="Filter by academic group"
              className="input w-auto"
            >
              <option value="">All groups</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {programs && programs.length > 0 && (
              <select
                name="prog"
                defaultValue={filters.prog}
                aria-label="Filter by program"
                className="input w-auto"
              >
                <option value="">All programs</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {batches && batches.length > 0 && (
              <select
                name="batch"
                defaultValue={filters.batch}
                aria-label="Filter by batch"
                className="input w-auto"
              >
                <option value="">All batches</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.label ?? b.graduation_year}</option>)}
              </select>
            )}
            <button type="submit" className="pencil-button-primary">
              <Search size={15} aria-hidden="true" />
              Search
            </button>
          </form>

          <section aria-labelledby="explore-results-heading">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 id="explore-results-heading" className="text-eyebrow-display">
                {filters.q ? `Results for “${filters.q}”` : 'All classmates'}
              </h2>
              {(users?.length ?? 0) > 0 && (
                <p className="text-meta text-ink-500">
                  Page {page + 1}
                </p>
              )}
            </div>

            {(users?.length ?? 0) === 0 ? (
              <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
                <Whiteboard
                  variant="small"
                  title="no one matches"
                  subtitle="try a looser search"
                  markerColor="blue"
                  className="w-full max-w-[220px]"
                />
                <div className="flex items-center gap-3">
                  <p className="text-nostalgia">Reset the filters →</p>
                  <HandDrawnArrow direction="right" attention length={64} />
                </div>
                <Link href={ROUTES.explore} className="pencil-button">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {users!.map(u => {
                  const isOnline = u.last_seen && new Date(u.last_seen) > new Date(cutoff)
                  const batch    = u.batches as unknown as { label: string | null; graduation_year: number; programs: { name: string } } | null

                  return (
                    <Link
                      key={u.id}
                      href={ROUTES.profile(u.id)}
                      className="group sketch-panel-flat overflow-hidden transition hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-center bg-paper-50 p-4">
                        <div className="relative">
                          <Avatar
                            row={u}
                            displayName={u.display_name}
                            scribbleCount={scribbleCountMap[u.id] ?? 0}
                            size="md"
                            className="transition-transform group-hover:scale-[1.03]"
                          />
                          {isOnline && (
                            <div className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-400" aria-label="Online now" />
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink-900">{u.display_name}</p>
                            {batch && (
                              <p className="mt-1 truncate text-xs text-ink-500">{batch.programs.name} · {batch.label ?? batch.graduation_year}</p>
                            )}
                          </div>
                          <span className="rounded-full bg-ink-900 px-2 py-1 text-[10px] font-semibold text-white">
                            Sign
                          </span>
                        </div>
                        {batch && (
                          <p className="mt-3 text-xs text-ink-500">{scribbleCountMap[u.id] ?? 0} scribbles received</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="mt-8 flex justify-center gap-3">
              {page > 0 && (
                <Link
                  href={`?${new URLSearchParams({ ...filters, page: String(page - 1) })}`}
                  className="pencil-button"
                >
                  ← Prev
                </Link>
              )}
              {(users?.length ?? 0) === PAGE_SIZE && (
                <Link
                  href={`?${new URLSearchParams({ ...filters, page: String(page + 1) })}`}
                  className="pencil-button"
                >
                  Next →
                </Link>
              )}
            </div>
          </section>
        </main>
        <BottomNav currentUserId={user.id} />
      </div>
    </div>
  )
}
