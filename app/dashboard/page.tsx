// Dashboard — Sunlit Lawn signature page (doc 18 § 3 row "Dashboard").
//
// This is the portfolio-critical surface. The composition mirrors the
// avatar-view concept image: a lawn-grounded place layer + cream substrate +
// avatar with a soft brand-soft halo behind it + a handful of floating
// sticker notes drifting around it + a hand-drawn arrow pointing to the
// share CTA + a wall-mounted whiteboard carrying the live scribble-deadline
// countdown. Everything below the hero is substrate-rendered (no card
// chrome on the section wrappers) with asterisk dividers between sections.
// Individual social moments (a pending requester, a queued classmate)
// keep their own card chrome — the "the section is the page, the items
// are the things" rule from doc 18 § 6.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ExternalLink,
  Inbox,
  PenLine,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { requirePageUser } from '@/lib/auth/server'
import Avatar from '@/components/avatar/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import BottomNav from '@/components/nav/BottomNav'
import { ActivityLog } from '@/components/activity/ActivityLog'
import ThankYouMessagePopup from '@/src/features/dashboard/components/ThankYouMessagePopup'
import ApprovalInbox, { type ApprovalItem } from './ApprovalInbox'
import ShareButton from './ShareButton'
import PlaceBackground from '@/components/place/PlaceBackground'
import Whiteboard from '@/components/brand/Whiteboard'
import AvatarHalo from '@/components/brand/AvatarHalo'
import DriftingDoodles from '@/components/brand/DriftingDoodles'
import AsteriskDivider from '@/components/marginalia/AsteriskDivider'
import HandDrawnArrow from '@/components/marginalia/HandDrawnArrow'
import {
  HeroStickerNotes,
  DEFAULT_HERO_NOTE_SLOTS,
  type HeroStickerNoteData,
} from '@/components/marginalia/HeroStickerNotes'
import { ROUTES, ONLINE_THRESHOLD_MS } from '@/lib/constants'
import { getPublicSiteUrl } from '@/lib/utils/siteUrl'
import { buildActivityItems, type ActivityReactionInput, type ActivityScribbleInput, type ActivityUserInput } from '@/lib/utils/activity'
import { calculateShirtLevel } from '@/lib/utils/shirtLevel'

export const dynamic = 'force-dynamic'

const SIGNATURE_GOAL = 150

export default async function DashboardPage() {
  const { supabase, user } = await requirePageUser()

  const [{ data: profile }, { data: shirt }] = await Promise.all([
    supabase.from('users')
      .select(`
        id, display_name, body_style, shirt_color, head_front_url, head_back_url, avatar_config,
        batch_id, thank_you_message, onboarding_completed,
        batches(label, graduation_year, programs(name, academic_groups(name)))
      `)
      .eq('id', user.id)
      .single(),
    supabase.from('shirts')
      .select('id, shirt_number, front_occupancy, back_occupancy, sleeves_occupancy, is_locked, level_override')
      .eq('owner_id', user.id)
      .order('shirt_number', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (!profile) redirect('/onboarding')

  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString()

  const [
    { count: scribbleCount },
    { data: onlineBatch },
    { data: signingQueue },
    { data: settings },
    { data: recentOnMyShirt },
    { data: socialNotes },
    { data: shirtScribblerRows },
    { data: pendingApprovals },
    { data: memberships },
  ] = await Promise.all([
    supabase
      .from('scribbles')
      .select('id', { count: 'exact', head: true })
      .eq('shirt_id', shirt?.id ?? ''),
    supabase
      .from('users')
      .select('id, display_name, body_style, shirt_color, head_front_url, avatar_config')
      .eq('batch_id', profile.batch_id ?? '')
      .neq('id', user.id)
      .gte('last_seen', cutoff)
      .limit(8),
    supabase
      .from('users')
      .select(`
        id, display_name, body_style, shirt_color, head_front_url, avatar_config, last_seen,
        batches(label, graduation_year, programs(name))
      `)
      .eq('batch_id', profile.batch_id ?? '')
      .neq('id', user.id)
      .eq('onboarding_completed', true)
      .eq('is_suspended', false)
      .order('last_seen', { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['scribble_deadline', 'extraction_deadline', 'launch_deadline']),
    shirt
      ? supabase
          .from('scribbles')
          .select('id, scribbler_id, panel, x, y, w, h, canvas_svg, created_at')
          .eq('shirt_id', shirt.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    shirt
      ? supabase
          .from('shirt_social_notes')
          .select('id, note_type, body, emoji, x, y, rotation')
          .eq('shirt_id', shirt.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
    // Distinct signers, for the "scribbled by N friends" tally. Approved only:
    // a drawing still waiting for the owner is not yet a signature.
    shirt
      ? supabase
          .from('scribbles')
          .select('scribbler_id')
          .eq('shirt_id', shirt.id)
          .eq('is_hidden', false)
          .eq('approval_status', 'approved')
      : Promise.resolve({ data: [] }),
    // The owner's approval inbox (doc 07). Under the one-door model nobody asks
    // permission to draw, so there is no queue of people waiting to be let in —
    // only a queue of drawings waiting to be revealed.
    shirt
      ? supabase
          .from('scribbles')
          .select('id, panel, canvas_svg, created_at, scribbler:scribbler_id(id, display_name, body_style, shirt_color, head_front_url, head_back_url, avatar_config)')
          .eq('shirt_id', shirt.id)
          .eq('approval_status', 'pending')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('friend_group_members')
      .select(`
        group_id,
        friend_groups!inner(id, name, admin_id, created_at)
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(3),
    supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id),
  ])

  const queueIds = (signingQueue ?? []).map(u => u.id)
  const { data: queueScribbles } = queueIds.length
    ? await supabase.from('scribbles')
        .select('shirt_id, shirts!inner(owner_id)')
        .in('shirts.owner_id', queueIds)
        .eq('is_hidden', false)
    : { data: [] }

  const groupIds = (memberships ?? []).map(m => m.group_id)
  const { data: memberCounts } = groupIds.length
    ? await supabase.from('friend_group_members').select('group_id').in('group_id', groupIds)
    : { data: [] }

  const groupCountMap: Record<string, number> = {}
  for (const member of memberCounts ?? []) {
    groupCountMap[member.group_id] = (groupCountMap[member.group_id] ?? 0) + 1
  }

  const queueCountMap: Record<string, number> = {}
  for (const s of queueScribbles ?? []) {
    const oid = (s.shirts as unknown as { owner_id: string }).owner_id
    queueCountMap[oid] = (queueCountMap[oid] ?? 0) + 1
  }

  const activityScribbles = (recentOnMyShirt ?? []) as ActivityScribbleInput[]
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

  const deadlineValue = settings?.find(s => ['scribble_deadline', 'extraction_deadline', 'launch_deadline'].includes(s.key))?.value
  const deadlineIso = typeof deadlineValue === 'string'
    ? deadlineValue
    : deadlineValue && typeof deadlineValue === 'object' && 'date' in deadlineValue
      ? String((deadlineValue as { date?: unknown }).date)
      : null
  const deadlineDate = deadlineIso ? new Date(deadlineIso) : null
  const daysLeft = deadlineDate && !Number.isNaN(deadlineDate.getTime())
    ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const batch = profile.batches as unknown as { label: string | null; graduation_year: number; programs: { name: string; academic_groups: { name: string } } } | null
  const activityItems = buildActivityItems({
    viewerId:    user.id,
    shirtOwner:  { id: profile.id, display_name: profile.display_name },
    scribbles:   activityScribbles,
    users:       (activityUsers ?? []) as ActivityUserInput[],
    reactions:   (activityReactions ?? []) as ActivityReactionInput[],
  })

  const profileUrl = `${getPublicSiteUrl()}${ROUTES.profile(user.id)}`
  const signatureCount = scribbleCount ?? 0
  const uniqueScribblerCount = new Set((shirtScribblerRows ?? []).map(row => row.scribbler_id)).size
  const shirtLevel = calculateShirtLevel({
    uniqueScribblerCount,
    visibleScribbleCount: signatureCount,
    adminLevelOverride: shirt?.level_override ?? null,
  })
  const signatureProgress = Math.min(100, Math.round((signatureCount / SIGNATURE_GOAL) * 100))

  const groups = (memberships ?? []).map(member => {
    const group = member.friend_groups as unknown as { id: string; name: string }
    return {
      id: group.id,
      name: group.name,
      memberCount: groupCountMap[member.group_id] ?? 1,
      href: ROUTES.group(group.id),
    }
  })
  // No synthetic fallback cards. v1 invented a "batch" and a "program" group
  // here when the student had none, with member counts taken from unrelated
  // queries, both linking to /groups — which migration 004 emptied. Two doors
  // to an empty room is the exact dropoff doc 07 was written to fix, so an
  // empty list now renders an honest empty state instead.
  const displayGroups = groups

  // Hero sticker notes — pull from the live `shirt_social_notes` set, fall
  // back to a hand-written welcome trio when the shirt has no notes yet so
  // the hero never looks empty on day one.
  const fallbackHeroNotes: readonly HeroStickerNoteData[] = [
    { id: 'start',  body: 'Let the scribbles begin!', emoji: null },
    { id: 'legend', body: "You're a legend!",          emoji: null },
    { id: 'keep',   body: 'Keep going — share your link!', emoji: null },
    { id: 'shine',  body: 'Keep shining ✨',           emoji: null },
  ]
  const heroNoteSource: readonly HeroStickerNoteData[] = (socialNotes?.length ?? 0) > 0
    ? socialNotes!.map(note => ({
        id: note.id,
        body: note.body ?? 'Reacted to your shirt',
        emoji: note.emoji,
      }))
    : fallbackHeroNotes
  const heroNotes = heroNoteSource.slice(0, DEFAULT_HERO_NOTE_SLOTS.length)

  // One queue, one number. pproval mode is the only thing that ever puts
  // anything here, and an open shirt never asks the owner to do anything.
  const pendingApprovalCount = (pendingApprovals ?? []).length
  const queue = (signingQueue ?? []).slice(0, 4)

  // Whiteboard countdown copy — handles null deadline + 0-day edge cases
  // and pluralises correctly (doc 18 § 7 spec for the wall-mounted variant).
  const countdownTitle = daysLeft === null
    ? 'social mode'
    : daysLeft === 0
      ? 'last day'
      : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
  const countdownSubtitle = daysLeft === null
    ? 'scribble anytime'
    : daysLeft === 0
      ? 'sign before midnight'
      : 'to scribble'

  return (
    <div className="scribbl-page relative min-h-screen pb-24 text-ink-900 md:pb-0">
      {/* Layer 1 — Place: lawn at golden hour. First visit plays the vivid
          hero then settles to ambient; subsequent visits jump straight to
          ambient. localStorage-backed, see PlaceBackground / useFirstVisit. */}
      <PlaceBackground surface="dashboard" illustration="lawn-golden-hour" />

      <nav className="sticky top-0 z-30 border-b border-[color:var(--line-soft)] bg-paper-100/88 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <Link href="/dashboard" className="scribble-underline font-display text-3xl font-bold leading-none text-ink-900">
            Scribbl
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href={ROUTES.explore}
              className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink-700 transition hover:bg-paper-50 hover:text-ink-900 sm:inline-flex"
            >
              Explore
            </Link>
            <Link
              href={ROUTES.groups}
              className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink-700 transition hover:bg-paper-50 hover:text-ink-900 sm:inline-flex"
            >
              Groups
            </Link>
            <NotificationBell userId={user.id} />
            <Link
              href={ROUTES.profile(user.id)}
              className="flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium text-ink-900 transition hover:bg-paper-50"
            >
              <Avatar
                row={profile}
                displayName={profile.display_name}
                size="sm"
              />
              <span className="hidden sm:inline">{profile.display_name.split(' ')[0]}</span>
            </Link>
          </div>
        </div>
      </nav>

      <ThankYouMessagePopup
        currentMessage={profile.thank_you_message ?? null}
        onboardingCompleted={profile.onboarding_completed ?? false}
      />

      <main className="relative z-10 mx-auto w-full max-w-screen-md px-4 pt-6 sm:pt-10 md:max-w-screen-lg md:pb-12">
        {/* ───────── DEFERRED AVATAR STUDIO BANNER ────────────────────────── */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-100/90 via-rose-50/90 to-indigo-50/90 border-2 border-amber-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <span className="text-3xl p-2 rounded-2xl bg-white shadow-sm">🎨</span>
            <div>
              <h2 className="font-display font-bold text-base text-ink-900 flex items-center gap-1.5">
                <span>Personalize Your Virtual Shirt & AI Head</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">New Studio</span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Customize your hairstyle, skin tone, and face photo for your final printed Yearbook Card.
              </p>
            </div>
          </div>
          <Link
            href="/onboarding/avatar"
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-ink-900 text-paper-100 font-semibold text-xs hover:bg-ink-800 transition shadow flex items-center justify-center gap-1.5"
          >
            <span>Open Avatar Studio</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
        {/* ───────── HERO REGION ─────────────────────────────────────
            Composition matches the canonical avatar-view concept image:
            avatar centred under a soft brand-soft halo, four sticker
            notes drifting around it, drifting doodles in the corners,
            scribbled name + hand-drawn arrow + share CTA stacked below.
            The wall-mounted whiteboard countdown anchors to the top-right
            on desktop and drops below the hero on mobile.
        */}
        <section className="relative mb-10 pt-2 md:mb-14 md:pt-4">
          {/* Drifting doodles — high density on desktop, low on mobile.
              Both render as `pointer-events: none` page-level marginalia. */}
          <DriftingDoodles density="high" className="hidden md:block" />
          <DriftingDoodles density="low" className="md:hidden" />

          {/* Desktop wall-mounted whiteboard countdown. Mobile renders the
              same primitive below the hero (see WALL_BELOW block). */}
          <div className="absolute right-0 top-0 hidden w-[220px] md:block lg:w-[260px]">
            <Whiteboard
              variant="wall-mounted"
              title={countdownTitle}
              subtitle={countdownSubtitle}
              markerColor="blue"
            />
          </div>

          {/* Avatar + halo + sticker notes — single positioned column,
              max-w sized to leave room for the corner doodles. */}
          <div className="relative mx-auto w-full max-w-md">
            {/* Sticker notes float at the four hero corners. The first two
                always render; the last two collapse on mobile so the
                avatar doesn't get crowded (doc 18 § 12 mobile rules). */}
            <HeroStickerNotes notes={heroNotes} />

            {/* Soft brand-soft radial behind the head — the halo primitive
                from round-5 confirmed by the concept image. */}
            <div className="relative mx-auto w-full">
              <AvatarHalo width="80%" height="50%" top="12%" />
              <Link
                href={ROUTES.profile(user.id)}
                className="relative z-10 block transition hover:scale-[1.01]"
              >
                <Avatar
                  row={profile}
                  displayName={profile.display_name}
                  scribbleCount={signatureCount}
                  size="hero"
                  className="mx-auto"
                />
              </Link>
            </div>
          </div>

          {/* Scribbled name — Caveat 48-72px, slight 1° tilt for the
              "scribbled by hand" feel (doc 18 § 9 + § 6). */}
          <h1 className="text-hero-name mt-6 text-center tilt-tiny">
            {profile.display_name}
          </h1>
          {batch && (
            <p className="text-nostalgia mt-1 text-center text-ink-500">
              {batch.programs.name} · {batch.label ?? `Class of ${batch.graduation_year}`}
            </p>
          )}

          {/* Hand-drawn arrow → share CTA. Arrow is horizontal on desktop
              and vertical on mobile so the eye reads name → CTA in the
              vertical stack (doc 18 § 12). */}
          <div className="mt-6 flex flex-col items-center gap-2 md:mt-7 md:flex-row md:justify-center md:gap-4">
            <HandDrawnArrow
              direction="right"
              length={72}
              attention
              className="hidden md:inline-block"
            />
            <HandDrawnArrow
              direction="down"
              length={48}
              attention
              className="md:hidden"
            />
            <ShareButton
              profileUrl={profileUrl}
              label="Share your link"
              variant="primary"
            />
          </div>

          {/* WALL_BELOW — mobile-only whiteboard. Same primitive as the
              desktop top-right one; placement collapses below the hero. */}
          <div className="mt-8 flex justify-center md:hidden">
            <div className="w-[220px]">
              <Whiteboard
                variant="wall-mounted"
                title={countdownTitle}
                subtitle={countdownSubtitle}
                markerColor="blue"
              />
            </div>
          </div>

          {/* Quiet stat strip — replaces the old StatGrid card. Surfaces
              the three numbers the user cares about (signatures, level,
              pending) without any chrome competing with the hero. */}
          <dl className="mt-8 grid grid-cols-3 gap-3 text-center md:mt-10 md:gap-6">
            <div>
              <dt className="text-eyebrow-uppercase">Signatures</dt>
              <dd className="mt-1 text-2xl font-display font-semibold text-ink-900">
                {signatureCount}
                <span className="text-base text-ink-500"> / {SIGNATURE_GOAL}</span>
              </dd>
              <div
                className="mx-auto mt-1.5 h-1.5 max-w-[120px] overflow-hidden rounded-full bg-black/[0.08]"
                aria-hidden="true"
              >
                <div className="h-full rounded-full bg-scribble-green" style={{ width: `${signatureProgress}%` }} />
              </div>
            </div>
            <div>
              <dt className="text-eyebrow-uppercase">Shirt level</dt>
              <dd className="mt-1 inline-flex items-center justify-center gap-1.5 text-2xl font-display font-semibold text-ink-900">
                <Trophy size={18} style={{ color: shirtLevel.color }} aria-hidden="true" />
                Lv {shirtLevel.level}
              </dd>
              <p className="mt-0.5 truncate text-xs text-ink-500">{shirtLevel.label}</p>
            </div>
            <div>
              <dt className="text-eyebrow-uppercase">Pending</dt>
              <dd className="mt-1 text-2xl font-display font-semibold text-ink-900">{pendingApprovalCount}</dd>
              <Link
                href={ROUTES.profile(user.id)}
                className="text-xs font-semibold text-brand transition hover:text-brand-hover"
              >
                review →
              </Link>
            </div>
          </dl>
        </section>

        <AsteriskDivider />

        {/* ───────── GROUPS ─────────────────────────────────────────
            Section eyebrow + content on substrate. Individual group cards
            keep their pill chrome so each one reads as a "thing" you can
            tap into. Doc 18 § 6: section is the page, items are the things. */}
        <section className="mb-10" aria-labelledby="dash-groups">
          <header className="mb-5 flex items-baseline justify-between gap-3">
            <h2 id="dash-groups" className="text-eyebrow-display">Your groups</h2>
            <Link href={ROUTES.groups} className="text-xs font-semibold text-brand transition hover:text-brand-hover">
              Manage groups
            </Link>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayGroups.map((group, index) => (
              <Link
                key={group.id}
                href={group.href}
                className="group flex items-center gap-3 rounded-2xl border border-[color:var(--line-soft)] bg-white/85 p-4 backdrop-blur-sm transition hover:border-brand/30 hover:bg-white"
                style={{ borderRadius: '14px 16px 13px 15px' }}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: ['#6d914f', '#47769e', '#d66f2f'][index % 3] }}
                  aria-hidden="true"
                >
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{group.name}</span>
                  <span className="text-xs text-ink-500">
                    {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
                  </span>
                  <span className="mt-2 flex -space-x-2">
                    {(onlineBatch ?? []).slice(0, 4).map(person => (
                      <span
                        key={`${group.id}-${person.id}`}
                        className="relative h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-white"
                      >
                        <Avatar
                          row={person}
                          displayName={person.display_name}
                          size="sm"
                          className="absolute -left-3 -top-3 scale-[0.48]"
                        />
                      </span>
                    ))}
                    {group.memberCount > 4 && (
                      <span className="grid h-6 min-w-[24px] place-items-center rounded-full border-2 border-white bg-brand-soft px-1 text-[10px] font-semibold text-brand">
                        +{group.memberCount - 4}
                      </span>
                    )}
                  </span>
                </span>
                <ExternalLink size={14} className="text-ink-500/60 transition group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </section>

        <AsteriskDivider />

        {/* ───────── UP NEXT ────────────────────────────────────────
            Pending requests (rendered only when there are any) + the
            "sign next" classmate queue. Each row keeps its own card
            chrome — a pending request IS a thing, a classmate suggestion
            IS a thing — but the section wrapper is on substrate. */}
        <section className="mb-10" aria-labelledby="dash-upnext">
          <header className="mb-5 flex items-baseline justify-between gap-3">
            <div>
              <h2 id="dash-upnext" className="text-eyebrow-display">Up next</h2>
              <p className="mt-1 text-xs text-ink-500">
                {pendingApprovalCount > 0
                  ? `${pendingApprovalCount} waiting on you · classmates below`
                  : 'Classmates waiting for your mark.'}
              </p>
            </div>
            <Link href={ROUTES.explore} className="text-xs font-semibold text-brand transition hover:text-brand-hover">
              Find classmates
            </Link>
          </header>

          {/* ── Approval queue ─────────────────────────────────────
              Replaces "Pending requests". Under the one-door model nobody asks
              permission to draw, so there is no queue of people waiting to be
              let in — only a queue of drawings waiting to be revealed. The
              decision is about one scribble, never about a person's access, and
              a decline names nobody. */}
          {pendingApprovalCount > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-eyebrow-uppercase">
                  <Inbox size={12} className="text-brand" aria-hidden="true" />
                  Waiting on you
                </p>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                  {pendingApprovalCount}
                </span>
              </div>

              <p className="mb-3 text-xs text-ink-500">
                These are drawn and only you and the person who drew them can see them.
                Post the ones you want on the shirt.
              </p>

              <ApprovalInbox items={(pendingApprovals ?? []) as unknown as ApprovalItem[]} />
            </div>
          )}

          <p className="mb-2 inline-flex items-center gap-1.5 text-eyebrow-uppercase">
            <Sparkles size={12} className="text-scribble-orange" aria-hidden="true" />
            Sign next
          </p>

          {queue.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed border-[color:var(--line-soft)] bg-paper-50/60 p-5 text-center text-sm text-ink-500"
              style={{ borderRadius: '14px 16px 13px 15px' }}
            >
              No batchmates found yet.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {queue.map(u => {
                const isOnline = u.last_seen && new Date(u.last_seen) > new Date(cutoff)
                const uBatch = u.batches as unknown as { label: string | null; graduation_year: number; programs: { name: string } } | null

                return (
                  <Link
                    key={u.id}
                    href={ROUTES.profile(u.id)}
                    className="group flex items-center gap-3 rounded-2xl border border-[color:var(--line-soft)] bg-white/85 p-3 backdrop-blur-sm transition hover:border-brand/30 hover:bg-white"
                    style={{ borderRadius: '14px 16px 13px 15px' }}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        row={u}
                        displayName={u.display_name}
                        scribbleCount={queueCountMap[u.id] ?? 0}
                        size="sm"
                      />
                      {isOnline && (
                        <div
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-scribble-green"
                          aria-label="Online now"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{u.display_name}</p>
                      {uBatch && (
                        <p className="truncate text-xs text-ink-500">
                          {uBatch.programs.name} · {uBatch.label ?? uBatch.graduation_year}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl border border-brand/40 px-3 py-2 text-xs font-semibold text-brand">
                      <PenLine size={13} aria-hidden="true" />
                      Sign
                    </span>
                  </Link>
                )
              })}
            </div>
          )}

          <Link
            href={ROUTES.explore}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition hover:text-brand-hover"
          >
            See all classmates
            <ExternalLink size={13} aria-hidden="true" />
          </Link>
        </section>

        <AsteriskDivider />

        {/* ───────── RECENT ACTIVITY ────────────────────────────────
            The ActivityLog renders its own eyebrow + items; we drop the
            previous `sketch-panel p-5` className so the section reads on
            substrate, matching the rest of the page. */}
        <section className="mb-12" aria-labelledby="dash-activity">
          <h2 id="dash-activity" className="sr-only">Recent activity</h2>
          <ActivityLog
            items={activityItems}
            viewerId={user.id}
            title="On your shirt"
            eyebrow="Sign-back loop"
            emptyText="Your shirt has no marks yet. Share it or start signing friends first."
          />
        </section>

        <AsteriskDivider />

        <p className="text-nostalgia text-center text-ink-500">
          <span className="inline-flex items-center gap-2">
            {/* Hand-drawn heart sticker — replaces the lucide icon so the
                line reads in the school-element vocabulary (doc 18 § 15:
                no lucide icons in handwritten moments). */}
            <Image
              src="/scribbl/stickers/heart.svg"
              width={16}
              height={16}
              alt=""
              aria-hidden="true"
              className="inline-block -translate-y-0.5"
            />
            <span>One shirt. A hundred memories.</span>
          </span>
        </p>
      </main>
      <BottomNav currentUserId={user.id} />
    </div>
  )
}
