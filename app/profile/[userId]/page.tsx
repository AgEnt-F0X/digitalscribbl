// Profile — Sunlit Lawn signature page (doc 18 § 3 row "Profile").
//
// Secondary signature page after the dashboard, also a portfolio screenshot
// candidate (this page is *literally* the reference image — friend's
// shirt with sticker notes drifting around it). Composition mirrors the
// dashboard hero with two differences:
//   - Place layer is always ambient (never plays the vivid hero).
//   - The wall-mounted whiteboard is replaced with a `small` whiteboard
//     carrying the "scribbled by N friends" tally.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import BottomNav from '@/components/nav/BottomNav'
import ShirtViewLoader from './ShirtViewLoader'
import { ActivityLog } from '@/components/activity/ActivityLog'
import RequestScribbleButton from './RequestScribbleButton'
import ReportUserButton from './ReportUserButton'
import ShareButton from '@/app/dashboard/ShareButton'
import PlaceBackground from '@/components/place/PlaceBackground'
import Whiteboard from '@/components/brand/Whiteboard'
import AvatarHalo from '@/components/brand/AvatarHalo'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import {
  HeroStickerNotes,
  DEFAULT_HERO_NOTE_SLOTS,
  type HeroStickerNoteData,
} from '@/components/marginalia/HeroStickerNotes'
import { ROUTES } from '@/lib/constants'
import { getPublicSiteUrl } from '@/lib/utils/siteUrl'
import { canAttemptScribble } from '@/lib/utils/safetyAccess'
import { buildActivityItems, type ActivityReactionInput, type ActivityScribbleInput, type ActivityUserInput } from '@/lib/utils/activity'
import { getPlatformFlags } from '@/lib/utils/platformFlags'
import type { Panel } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ panel?: string; shirt?: string }>
}

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params, searchParams }: Props) {
  const { supabase, user: currentUser } = await requirePageUser()
  const { userId: targetId } = await params
  const resolvedSearchParams = await searchParams

  const panel    = (resolvedSearchParams.panel ?? 'front') as Panel
  const shirtNum = Number(resolvedSearchParams.shirt ?? 1)

  const { data: target } = await supabase
    .from('users')
    .select(`
      id, display_name, body_style, shirt_color, avatar_config,
      head_front_url, head_back_url, shirt_permission,
      yearbook_quote, is_suspended, batch_id,
      batches(label, graduation_year, programs(name, academic_groups(name)))
    `)
    .eq('id', targetId)
    .single()

  if (!target || target.is_suspended) notFound()

  const isOwner = currentUser.id === targetId

  const { data: viewerProfile } = await supabase
    .from('users')
    .select('display_name, body_style, shirt_color, head_front_url, avatar_config')
    .eq('id', currentUser.id)
    .single()

  const { data: shirts } = await supabase
    .from('shirts')
    .select('id, owner_id, group_id, shirt_number, front_texture_url, back_texture_url, sleeves_texture_url, front_occupancy, back_occupancy, sleeves_occupancy, is_locked, avatar_config_override, level_override, level_override_reason, created_at')
    .eq('owner_id', targetId)
    .order('shirt_number')

  const activeShirt = shirts?.find(s => s.shirt_number === shirtNum) ?? shirts?.[0]

  const realtimeFlags = await getPlatformFlags(supabase)

  const { count: scribbleCount } = await supabase
    .from('scribbles')
    .select('id', { count: 'exact', head: true })
    .eq('shirt_id', activeShirt?.id ?? '')
    .eq('is_hidden', false)

  const { data: scribbles } = await supabase
    .from('scribbles')
    .select('id, x, y, w, h, canvas_svg')
    .eq('shirt_id', activeShirt?.id ?? '')
    .eq('panel', panel)
    .eq('is_hidden', false)

  // Hero sticker notes — pull the most recent textual messages friends have
  // left on this shirt. Falls back to a welcome trio so the hero never reads
  // empty for owners with day-one shirts.
  const { data: socialNotes } = activeShirt
    ? await supabase
        .from('shirt_social_notes')
        .select('id, body, emoji')
        .eq('shirt_id', activeShirt.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(4)
    : { data: [] }

  // Full scribbler list — used only to count distinct friends for the
  // "scribbled by N" whiteboard subtitle. `head: true, count: 'exact'`
  // wouldn't give us distinct counts without a custom RPC, so we pull
  // the column and Set-dedupe in JS. Acceptable scan; shirts cap at ~150
  // signatures per the goal in dashboard / lib.
  const { data: scribblerRows } = activeShirt
    ? await supabase
        .from('scribbles')
        .select('scribbler_id')
        .eq('shirt_id', activeShirt.id)
        .eq('is_hidden', false)
    : { data: [] }
  const uniqueScribblerCount = new Set((scribblerRows ?? []).map(row => row.scribbler_id)).size

  const { data: recentActivity } = activeShirt
    ? await supabase
        .from('scribbles')
        .select('id, scribbler_id, panel, x, y, w, h, canvas_svg, created_at')
        .eq('shirt_id', activeShirt.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(6)
    : { data: [] }

  const activityScribbles = (recentActivity ?? []) as ActivityScribbleInput[]
  const activityScribblerIds = Array.from(new Set(activityScribbles.map(item => item.scribbler_id)))
  const activityScribbleIds = activityScribbles.map(item => item.id)

  const { data: activityUsers } = activityScribblerIds.length
    ? await supabase
        .from('users')
        .select('id, display_name')
        .in('id', activityScribblerIds)
    : { data: [] }

  const { data: activityReactions } = activityScribbleIds.length
    ? await supabase
        .from('scribble_reactions')
        .select('scribble_id, user_id, emoji')
        .in('scribble_id', activityScribbleIds)
    : { data: [] }

  let canScribble = false
  let permissionState: 'can' | 'request' | 'locked' | 'own' = 'locked'

  if (isOwner) {
    permissionState = 'own'
  } else if (!activeShirt?.is_locked && target.shirt_permission !== 'locked') {
    if (target.shirt_permission === 'open') {
      canScribble = true
      permissionState = 'can'
    } else {
      const [{ data: me }, { data: req }] = await Promise.all([
        supabase.from('users').select('batch_id').eq('id', currentUser.id).single(),
        supabase
        .from('scribble_requests')
        .select('status')
        .eq('requester_id', currentUser.id)
        .eq('owner_id', targetId)
        .maybeSingle(),
      ])
      const sameBatch = Boolean(target.batch_id && me?.batch_id && target.batch_id === me.batch_id)
      const approvedRequest = req?.status === 'approved'
      canScribble = canAttemptScribble({
        isOwner: false,
        permission: target.shirt_permission,
        sameBatch,
        approvedRequest,
      })
      permissionState = canScribble ? 'can' : 'request'
    }
  }

  const textureKey: Record<Panel, string> = {
    front:   'front_texture_url',
    back:    'back_texture_url',
    sleeves: 'sleeves_texture_url',
  }
  const textureUrl = activeShirt ? (activeShirt as Record<string, unknown>)[textureKey[panel]] as string | undefined : undefined

  const batch = target.batches as unknown as { label: string | null; graduation_year: number; programs: { name: string; academic_groups: { name: string } } } | null
  const panelStats = activeShirt
    ? [
        { key: 'front',   label: 'Front',   value: Math.round(activeShirt.front_occupancy   ?? 0) },
        { key: 'back',    label: 'Back',    value: Math.round(activeShirt.back_occupancy    ?? 0) },
        { key: 'sleeves', label: 'Sleeves', value: Math.round(activeShirt.sleeves_occupancy ?? 0) },
      ]
    : []
  const profileUrl = `${getPublicSiteUrl()}${ROUTES.profile(targetId)}`
  const activityItems = buildActivityItems({
    viewerId:    currentUser.id,
    shirtOwner:  { id: target.id, display_name: target.display_name },
    scribbles:   activityScribbles,
    users:       (activityUsers ?? []) as ActivityUserInput[],
    reactions:   (activityReactions ?? []) as ActivityReactionInput[],
  })

  const fallbackHeroNotes: readonly HeroStickerNoteData[] = [
    { id: 'welcome', body: `Welcome to ${target.display_name.split(' ')[0]}'s shirt!`, emoji: null },
    { id: 'sign',    body: 'Be the first to scribble here.', emoji: null },
    { id: 'memory',  body: 'Every mark is a memory.', emoji: null },
    { id: 'shine',   body: 'Sign on the front first ✨', emoji: null },
  ]
  const heroNoteSource: readonly HeroStickerNoteData[] = (socialNotes?.length ?? 0) > 0
    ? socialNotes!.map(note => ({
        id: note.id,
        body: note.body ?? 'Reacted to your shirt',
        emoji: note.emoji,
      }))
    : fallbackHeroNotes
  const heroNotes = heroNoteSource.slice(0, DEFAULT_HERO_NOTE_SLOTS.length)

  // Whiteboard copy. Always uses the live unique-scribbler count; if zero,
  // switches to "no scribbles yet / share the link" so the small board
  // doubles as an empty-state callout (doc 18 § 7 example).
  const friendsCount = uniqueScribblerCount
  const whiteboardTitle = friendsCount === 0
    ? 'no scribbles yet'
    : `scribbled by ${friendsCount}`
  const whiteboardSubtitle = friendsCount === 0
    ? isOwner ? 'share your link' : 'be the first'
    : `friend${friendsCount === 1 ? '' : 's'}`

  const firstName = target.display_name.split(' ')[0]
  const canvasHeadline = isOwner ? 'Your canvas' : `${firstName}'s canvas`

  return (
    <div className="scribbl-page relative min-h-screen pb-24 text-ink-900 md:pb-0">
      {/* Place layer — always ambient on profile (doc 18 § 3, § 11). */}
      <PlaceBackground surface="profile" illustration="lawn-golden-hour" alwaysAmbient />

      <nav className="sticky top-0 z-30 border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <Link href="/dashboard" className="scribble-underline font-display text-3xl font-bold leading-none text-ink-900">
            Scribbl
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.explore}
              className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink-700 transition hover:bg-paper-50 hover:text-ink-900 sm:inline-flex"
            >
              Explore
            </Link>
            <NotificationBell userId={currentUser.id} />
            <Link href={ROUTES.profile(currentUser.id)} className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-paper-50">
              <Avatar
                row={viewerProfile ?? null}
                displayName={viewerProfile?.display_name}
                size="sm"
              />
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-screen-md px-4 pt-6 sm:pt-10 md:max-w-screen-lg md:pb-12">
        {/* ───────── HERO ─────────────────────────────────────────
            This composition is the canonical avatar-view image: avatar
            wearing the shirt, soft brand halo behind, four sticker notes
            from friends drifting around it, drifting doodles in the
            corners, small whiteboard tallying "scribbled by N friends."
        */}
        <section className="relative mb-10 pt-2 md:mb-14 md:pt-4">
          <DriftingDoodles density="high" className="hidden md:block" />
          <DriftingDoodles density="low" className="md:hidden" />

          {/* Desktop small whiteboard tally — anchors to the top-right. */}
          <div className="absolute right-0 top-0 hidden w-[180px] md:block lg:w-[200px]">
            <Whiteboard
              variant="small"
              title={whiteboardTitle}
              subtitle={whiteboardSubtitle}
              markerColor="blue"
            />
          </div>

          {/* Avatar + halo + sticker notes — a single positioned column. */}
          <div className="relative mx-auto w-full max-w-md">
            <HeroStickerNotes notes={heroNotes} />

            <div className="relative mx-auto w-full">
              <AvatarHalo width="80%" height="50%" top="12%" />
              <Avatar
                row={target}
                displayName={target.display_name}
                scribbleCount={scribbleCount ?? 0}
                size="hero"
                className="relative z-10 mx-auto"
              />
            </div>
          </div>

          {/* Scribbled name + batch line. */}
          <h1 className="text-hero-name mt-6 text-center tilt-tiny">
            {target.display_name}
          </h1>
          {batch && (
            <p className="text-nostalgia mt-1 text-center text-ink-500">
              {batch.programs.name} · {batch.label ?? `Class of ${batch.graduation_year}`}
            </p>
          )}

          {/* Mobile whiteboard tally — same primitive, drops below name. */}
          <div className="mt-6 flex justify-center md:hidden">
            <div className="w-[180px]">
              <Whiteboard
                variant="small"
                title={whiteboardTitle}
                subtitle={whiteboardSubtitle}
                markerColor="blue"
              />
            </div>
          </div>

          {/* Action row — owner gets Share + Settings (Share is the primary
              brand CTA), viewer gets Request or a "locked" pill. */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {isOwner && (
              <ShareButton
                profileUrl={profileUrl}
                label="Share your link"
                variant="primary"
              />
            )}
            {isOwner && (
              <Link href="/settings" className="pencil-button">
                Customize look
              </Link>
            )}
            {!isOwner && permissionState === 'request' && (
              <RequestScribbleButton ownerId={targetId} />
            )}
            {!isOwner && permissionState === 'locked' && (
              <span className="inline-flex items-center rounded-xl border border-[color:var(--line-soft)] bg-white/85 px-3 py-2 text-xs text-ink-500">
                Shirt is locked
              </span>
            )}
          </div>
        </section>

        <AsteriskDivider />

        {/* ───────── CANVAS ──────────────────────────────────────
            The shirt canvas itself — the page's dominant content moment.
            On substrate (no card chrome around the section); the canvas
            inside `ShirtViewLoader` carries its own framing. */}
        <section className="mb-10" aria-labelledby="profile-canvas">
          <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="profile-canvas" className="text-eyebrow-display">{canvasHeadline}</h2>
            {(shirts?.length ?? 0) > 1 && (
              <div className="flex flex-wrap gap-2">
                {shirts!.map(s => (
                  <Link
                    key={s.id}
                    href={`?shirt=${s.shirt_number}&panel=${panel}`}
                    className="panel-tab"
                    data-active={s.shirt_number === shirtNum}
                  >
                    Shirt {s.shirt_number}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--line-soft)] bg-white/85 p-2 backdrop-blur-sm shadow-sm">
            <div className="flex gap-1">
              {/* Sleeves stayed view-only legacy after the studio became the
                  single signing surface (front/back) — tab removed. */}
              {(['front', 'back'] as Panel[]).map(p => (
                <Link
                  key={p}
                  href={`?shirt=${shirtNum}&panel=${p}`}
                  className="panel-tab capitalize"
                  data-active={panel === p}
                >
                  {p}
                </Link>
              ))}
            </div>
            <p className="px-2 text-xs text-ink-500">
              Switch surface without leaving the shirt.
            </p>
          </div>

          {activeShirt ? (
            <ShirtViewLoader
              shirt={activeShirt}
              ownerId={targetId}
              ownerName={target.display_name}
              panel={panel}
              existingScribbles={scribbles ?? []}
              currentUserId={currentUser.id}
              currentUserName={viewerProfile?.display_name ?? null}
              canScribble={canScribble}
              isOwner={isOwner}
              bodyStyle={target.body_style}
              shirtColor={target.shirt_color}
              headFrontUrl={target.head_front_url}
              headBackUrl={target.head_back_url}
              yearbookQuote={target.yearbook_quote}
              textureUrl={textureUrl ?? undefined}
              disablePresence={realtimeFlags.disable_realtime_presence}
              disableBroadcast={realtimeFlags.disable_realtime_broadcast}
            />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center rounded-[28px] border border-dashed border-[color:var(--line-soft)] bg-white/80">
              <p className="text-sm text-ink-500">No shirt has been created yet.</p>
            </div>
          )}
        </section>

        <AsteriskDivider />

        {/* ───────── SHIRT MAP + YEARBOOK ─────────────────────────
            Two compact info blocks side-by-side on desktop, stacked on
            mobile. Section wrappers on substrate; the yearbook card is
            a `paper-note` because it IS a thing (the user's yearbook
            stub) and earns the chrome (doc 18 § 6 panel discipline). */}
        <section className="mb-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-eyebrow-display mb-3">Shirt map</h2>
            <div className="space-y-3">
              {panelStats.length === 0 ? (
                <p className="text-sm text-ink-500">No occupancy data yet.</p>
              ) : (
                panelStats.map(stat => (
                  <Link
                    key={stat.key}
                    href={`?shirt=${shirtNum}&panel=${stat.key}`}
                    className="block"
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-700">{stat.label}</span>
                      <span className="text-ink-500">{stat.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/[0.08]">
                      <div
                        className="h-full rounded-full bg-ink-900 transition-all"
                        style={{ width: `${Math.min(100, stat.value)}%` }}
                      />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-eyebrow-display mb-3">Yearbook card</h2>
            <div className="paper-note tilt-tiny-left p-4">
              <p className="font-display text-base font-semibold text-ink-900">
                {target.display_name}
              </p>
              {batch && (
                <p className="mt-1 text-xs text-ink-500">
                  {batch.programs.name} · {batch.label ?? batch.graduation_year}
                </p>
              )}
              <p className="mt-4 text-sm">
                {target.yearbook_quote ? `“${target.yearbook_quote}”` : 'No yearbook quote yet.'}
              </p>
            </div>
          </div>
        </section>

        <AsteriskDivider />

        {/* ───────── SIGNING STATE ─────────────────────────────── */}
        <section className="mb-10" aria-labelledby="profile-signing">
          <h2 id="profile-signing" className="text-eyebrow-display mb-3">
            {isOwner ? 'You can manage this shirt' : 'Signing state'}
          </h2>
          <p className="text-sm text-ink-500">
            {isOwner
              ? 'You can remove anything from your shirt and share the link for more signatures.'
              : canScribble
                ? 'You can sign this shirt now. Open the studio, zoom into the fabric, draw, and save your mark.'
                : 'You can view this shirt, but signing is currently restricted.'}
          </p>
          {!isOwner && (
            <div className="mt-4">
              <ReportUserButton userId={targetId} userName={target.display_name} />
            </div>
          )}
        </section>

        <AsteriskDivider />

        {/* ───────── RECENT MARKS ─────────────────────────────── */}
        <section className="mb-12" aria-labelledby="profile-activity">
          <h2 id="profile-activity" className="sr-only">Recent marks</h2>
          <ActivityLog
            items={activityItems}
            viewerId={currentUser.id}
            title="Recent marks"
            eyebrow="Sign-back loop"
            emptyText="No one has signed this shirt yet."
          />
        </section>
      </main>
      <BottomNav currentUserId={currentUser.id} />
    </div>
  )
}
