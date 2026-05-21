import Link from 'next/link'
import { Bell, CheckCircle2, ExternalLink } from 'lucide-react'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import BottomNav from '@/components/nav/BottomNav'
import { ActivityLog } from '@/components/activity/ActivityLog'
import Whiteboard from '@/components/brand/Whiteboard'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import HandDrawnArrow from '@/components/marginalia/HandDrawnArrow'
import { ROUTES } from '@/lib/constants'
import { buildActivityItems, type ActivityReactionInput, type ActivityScribbleInput, type ActivityUserInput } from '@/lib/utils/activity'

export const dynamic = 'force-dynamic'

interface NotificationRow {
  id: string
  title: string
  body: string | null
  type: string
  related_user_id: string | null
  related_shirt_id: string | null
  related_scribble_id: string | null
  is_read: boolean
  created_at: string
}

type DayBucket = 'Today' | 'Yesterday' | 'Earlier'

// Bucket each notification into Today / Yesterday / Earlier so the page can
// space-out the timeline with asterisk dividers (doc 18 § 3 Activity row).
function bucketByDay(items: NotificationRow[]): Array<{ bucket: DayBucket; rows: NotificationRow[] }> {
  if (items.length === 0) return []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000)

  const groups: Record<DayBucket, NotificationRow[]> = {
    Today:     [],
    Yesterday: [],
    Earlier:   [],
  }

  for (const item of items) {
    const t = new Date(item.created_at).getTime()
    if (t >= startOfToday.getTime()) {
      groups.Today.push(item)
    } else if (t >= startOfYesterday.getTime()) {
      groups.Yesterday.push(item)
    } else {
      groups.Earlier.push(item)
    }
  }

  return (['Today', 'Yesterday', 'Earlier'] as const)
    .map(bucket => ({ bucket, rows: groups[bucket] }))
    .filter(group => group.rows.length > 0)
}

export default async function ActivityPage() {
  const { supabase, user } = await requirePageUser()

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, body_style, shirt_color, head_front_url, avatar_config')
    .eq('id', user.id)
    .single()

  const { data: shirt } = await supabase
    .from('shirts')
    .select('id')
    .eq('owner_id', user.id)
    .order('shirt_number', { ascending: true })
    .limit(1)
    .maybeSingle()

  const [{ data: notifications }, { data: recentScribbles }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, body, type, related_user_id, related_shirt_id, related_scribble_id, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40),
    shirt
      ? supabase
          .from('scribbles')
          .select('id, scribbler_id, panel, x, y, w, h, canvas_svg, created_at')
          .eq('shirt_id', shirt.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
  ])

  const scribbles = (recentScribbles ?? []) as ActivityScribbleInput[]
  const scribblerIds = Array.from(new Set(scribbles.map(item => item.scribbler_id)))
  const scribbleIds = scribbles.map(item => item.id)

  const [{ data: users }, { data: reactions }] = await Promise.all([
    scribblerIds.length
      ? supabase.from('users').select('id, display_name').in('id', scribblerIds)
      : Promise.resolve({ data: [] }),
    scribbleIds.length
      ? supabase.from('scribble_reactions').select('scribble_id, user_id, emoji').in('scribble_id', scribbleIds)
      : Promise.resolve({ data: [] }),
  ])

  const activityItems = buildActivityItems({
    viewerId: user.id,
    shirtOwner: { id: user.id, display_name: profile?.display_name ?? 'Your shirt' },
    scribbles,
    users: (users ?? []) as ActivityUserInput[],
    reactions: (reactions ?? []) as ActivityReactionInput[],
  })

  const dayGroups = bucketByDay((notifications ?? []) as NotificationRow[])
  const hasNotifications = dayGroups.length > 0

  return (
    <div className="scribbl-page min-h-screen pb-24 text-ink-900 md:pb-0">
      <nav className="sticky top-0 z-30 border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/dashboard" className="scribble-underline font-display text-3xl font-bold leading-none">
            Scribbl
          </Link>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.explore} className="hidden text-sm font-semibold text-ink-700 sm:inline">Explore</Link>
            <Link href={ROUTES.groups} className="hidden text-sm font-semibold text-ink-700 sm:inline">Groups</Link>
            <NotificationBell userId={user.id} />
            <Link href={ROUTES.profile(user.id)}>
              <Avatar
                row={profile ?? null}
                displayName={profile?.display_name}
                size="sm"
              />
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="activity-center-heading">
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-eyebrow-uppercase">Activity center</p>
              <h1 id="activity-center-heading" className="text-hero-display mt-2">
                What happened around your shirt
              </h1>
            </div>
            <Bell className="mt-2 text-brand" aria-hidden="true" />
          </header>

          {!hasNotifications ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
              <Whiteboard
                variant="small"
                title="no notifications"
                subtitle="go leave a mark"
                markerColor="blue"
                className="w-full max-w-[220px]"
              />
              <div className="flex items-center gap-3">
                <p className="text-nostalgia">Find someone to sign →</p>
                <HandDrawnArrow direction="right" attention length={64} />
              </div>
              <Link href={ROUTES.explore} className="pencil-button-primary">
                Find someone to sign
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {dayGroups.map((group, groupIndex) => (
                <div key={group.bucket}>
                  {groupIndex > 0 && <AsteriskDivider className="my-6" />}
                  <h2 className="text-eyebrow-display mb-3">{group.bucket}</h2>
                  <ul className="divide-y divide-black/10">
                    {group.rows.map(item => (
                      <li key={item.id} className="flex gap-3 py-4">
                        <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                          {item.is_read ? <CheckCircle2 size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{item.title}</p>
                          {item.body && <p className="mt-1 text-sm text-ink-500">{item.body}</p>}
                          <p className="mt-1 text-xs text-ink-500">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                        {item.related_user_id && (
                          <Link
                            href={ROUTES.profile(item.related_user_id)}
                            aria-label="Open related profile"
                            className="mt-1 text-ink-500 hover:text-ink-900"
                          >
                            <ExternalLink size={16} aria-hidden="true" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside aria-labelledby="recent-marks-heading">
          <ActivityLog
            items={activityItems}
            viewerId={user.id}
            title="Recent shirt marks"
            eyebrow="Your shirt"
            emptyText="No visible scribbles on your shirt yet."
          />
        </aside>
      </main>
      <BottomNav currentUserId={user.id} />
    </div>
  )
}
