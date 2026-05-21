import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import PlaceBackground from '@/components/place/PlaceBackground'
import Whiteboard from '@/components/brand/Whiteboard'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import InviteLink from './InviteLink'
import LeaveButton from './LeaveButton'
import RemoveMemberButton from './RemoveMemberButton'
import { ROUTES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ groupId: string }>
}

export default async function GroupDetailPage({ params }: Props) {
  const { supabase, user } = await requirePageUser()
  const { groupId } = await params

  const { data: group } = await supabase
    .from('friend_groups')
    .select('id, name, admin_id, invite_token, created_at')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  const { data: membership } = await supabase
    .from('friend_group_members')
    .select('user_id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) notFound()

  const isAdmin = group.admin_id === user.id

  const { data: members } = await supabase
    .from('friend_group_members')
    .select(`
      user_id,
      joined_at,
      users!inner(id, display_name, body_style, shirt_color, head_front_url, avatar_config, last_seen)
    `)
    .eq('group_id', group.id)
    .order('joined_at', { ascending: true })

  const memberList = (members ?? []).map(m => ({
    ...(m.users as unknown as {
      id: string
      display_name: string
      body_style: string
      shirt_color: string
      head_front_url: string | null
      avatar_config: unknown
      last_seen: string | null
    }),
    joined_at: m.joined_at,
    isAdmin: m.user_id === group.admin_id,
    isMe: m.user_id === user.id,
  }))

  const now = Date.now()
  const ONLINE_MS = 15 * 60 * 1000

  const { data: myProfile } = await supabase
    .from('users')
    .select('display_name, body_style, shirt_color, head_front_url, avatar_config')
    .eq('id', user.id)
    .single()

  const memberCount = memberList.length
  const memberLabel = `${memberCount} member${memberCount !== 1 ? 's' : ''}`

  return (
    <div className="scribbl-page relative min-h-screen">
      {/* Lawn place layer — always ambient on group detail (doc 18 § 3). */}
      <PlaceBackground surface="groups" illustration="lawn-golden-hour" alwaysAmbient />
      {/* A touch of energy — low-density doodles. */}
      <DriftingDoodles density="low" />

      <div className="relative z-10">
        <nav className="sticky top-0 z-30 border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Link href="/dashboard" className="font-display font-bold text-xl text-ink-900">scribbl</Link>
            <div className="flex items-center gap-3">
              <NotificationBell userId={user.id} />
              <Link href={ROUTES.profile(user.id)}>
                <Avatar
                  row={myProfile ?? null}
                  displayName={myProfile?.display_name}
                  size="sm"
                />
              </Link>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-2xl px-4 py-8">
          <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link href="/groups" className="text-eyebrow-uppercase hover:text-ink-900 transition">
                ← Groups
              </Link>
              <h1 className="text-hero-display mt-2">{group.name}</h1>
              <p className="text-nostalgia mt-2">
                {memberLabel} · Created {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="w-full max-w-[260px] sm:self-end">
              {/* Wall-mounted whiteboard carries the group identity. */}
              <Whiteboard
                variant="wall-mounted"
                title={group.name}
                subtitle={memberLabel}
                markerColor="green"
              />
            </div>
          </header>

          {!isAdmin && (
            <div className="mb-6 flex justify-end">
              <LeaveButton groupId={group.id} />
            </div>
          )}

          <section aria-labelledby="invite-heading" className="sketch-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <h2 id="invite-heading" className="text-eyebrow-display">Invite link</h2>
              <span className="text-xs text-ink-500">— share with friends to add them</span>
            </div>
            <InviteLink token={group.invite_token} />
          </section>

          <AsteriskDivider />

          <section aria-labelledby="members-heading">
            <h2 id="members-heading" className="text-eyebrow-display mb-4">
              Members ({memberCount})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {memberList.map(m => {
                const isOnline = m.last_seen && now - new Date(m.last_seen).getTime() < ONLINE_MS
                return (
                  <div
                    key={m.id}
                    className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-white/55 hover:shadow-sm"
                  >
                    <Link href={ROUTES.profile(m.id)} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <Avatar
                          row={m}
                          displayName={m.display_name}
                          size="sm"
                          className="transition-transform group-hover:scale-105"
                        />
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400" aria-label="Online now" />
                        )}
                        {m.isAdmin && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink-900 text-[8px] font-bold text-white" aria-label="Group admin">
                            A
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="w-full truncate text-xs font-semibold text-ink-900">
                          {m.display_name.split(' ')[0]}
                          {m.isMe && <span className="font-normal text-ink-500"> (you)</span>}
                        </p>
                      </div>
                    </Link>
                    {isAdmin && !m.isAdmin && (
                      <RemoveMemberButton groupId={group.id} userId={m.id} name={m.display_name} />
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {isAdmin && (
            <>
              <AsteriskDivider />
              <section aria-labelledby="admin-heading" className="sketch-panel p-4">
                <h2 id="admin-heading" className="text-eyebrow-display mb-2">Admin controls</h2>
                <p className="text-sm text-ink-500">
                  Share the invite link above to add members. Hover a member card to remove someone from this friend group.
                </p>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
