import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import BottomNav from '@/components/nav/BottomNav'
import PlaceBackground from '@/components/place/PlaceBackground'
import Whiteboard from '@/components/brand/Whiteboard'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import HandDrawnArrow from '@/components/marginalia/HandDrawnArrow'
import { CreateGroupForm, JoinGroupForm } from './CreateGroupForm'
import { ROUTES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const { supabase, user } = await requirePageUser()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, body_style, shirt_color, head_front_url, avatar_config')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const { data: memberships } = await supabase
    .from('friend_group_members')
    .select(`
      group_id,
      joined_at,
      friend_groups!inner(id, name, admin_id, invite_token, created_at)
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const groupIds = (memberships ?? []).map(m => m.group_id)
  const { data: memberCounts } = groupIds.length
    ? await supabase
        .from('friend_group_members')
        .select('group_id')
        .in('group_id', groupIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const m of memberCounts ?? []) {
    countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1
  }

  const groups = (memberships ?? []).map(m => ({
    ...m.friend_groups as unknown as { id: string; name: string; admin_id: string; invite_token: string; created_at: string },
    memberCount: countMap[m.group_id] ?? 1,
    isAdmin: (m.friend_groups as unknown as { admin_id: string }).admin_id === user.id,
  }))

  return (
    <div className="scribbl-page relative min-h-screen pb-24 md:pb-0">
      {/* Lawn place layer — ambient only on groups (doc 18 § 3). */}
      <PlaceBackground surface="groups" illustration="lawn-golden-hour" alwaysAmbient />

      <div className="relative z-10">
        <nav className="sticky top-0 z-30 border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Link href="/dashboard" className="font-display font-bold text-xl text-ink-900">scribbl</Link>
            <div className="flex items-center gap-3">
              <Link href={ROUTES.explore} className="text-sm text-ink-500 hover:text-ink-900 transition">Explore</Link>
              <NotificationBell userId={user.id} />
              <Link href={ROUTES.profile(user.id)}>
                <Avatar
                  row={profile}
                  displayName={profile.display_name}
                  size="sm"
                />
              </Link>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-2xl px-4 py-8">
          <header className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow-uppercase">Wings & circles</p>
              <h1 className="text-hero-display mt-2">Friend groups</h1>
              <p className="text-nostalgia mt-2">A name on a whiteboard. The people show up.</p>
            </div>
            <div className="flex gap-2">
              <JoinGroupForm />
              <CreateGroupForm />
            </div>
          </header>

          <AsteriskDivider />

          {groups.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-8 text-center">
              <Whiteboard
                variant="small"
                title="no groups yet"
                subtitle="start your wing"
                markerColor="blue"
                className="w-full max-w-[220px]"
              />
              <div className="flex items-center gap-3">
                <p className="text-nostalgia">Create or join one →</p>
                <HandDrawnArrow direction="right" attention length={64} />
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <JoinGroupForm />
                <CreateGroupForm />
              </div>
            </div>
          ) : (
            <section aria-labelledby="your-groups-heading">
              <h2 id="your-groups-heading" className="text-eyebrow-display mb-3">Your groups</h2>
              <ul className="space-y-3">
                {groups.map(g => (
                  <li key={g.id}>
                    <Link
                      href={ROUTES.group(g.id)}
                      className="sketch-panel flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
                    >
                      {/* Mini whiteboard carries the group's identity — green
                          marker per doc 18 § 7 marker rotation rules. */}
                      <div className="w-20 sm:w-24 flex-shrink-0">
                        <Whiteboard
                          variant="small"
                          title={g.name}
                          markerColor="green"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-ink-900 truncate">{g.name}</h3>
                          {g.isAdmin && (
                            <span className="text-[10px] bg-ink-900 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                              admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-1">
                          {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span aria-hidden="true" className="text-ink-500 transition text-xl">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
        <BottomNav currentUserId={user.id} />
      </div>
    </div>
  )
}
