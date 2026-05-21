import { NextRequest, NextResponse } from 'next/server'
import { getUserIsAdmin, requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPublicSiteUrl } from '@/lib/utils/siteUrl'
import { getPlatformFlags } from '@/lib/utils/platformFlags'

export const runtime = 'nodejs'

const MAX_DIGEST_BATCH = 100

/**
 * Naive HTML escape for fields interpolated into transactional email.
 * A user with `<img onerror=...>` in their display name self-XSSes the
 * digest otherwise. Same six characters every HTML escaper uses.
 * See docs/15-dev-review.md §9.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Stagger users across the week so we don't blast the same ~100 every day
 * and starve users 101-N. Uses a stable bucket from the UUID — same user
 * always lands on the same weekday — so engagement signal stays clean.
 * Docs 04 §"hash-mod-7" + 15-dev-review §5.
 */
function userWeekdayBucket(userId: string): number {
  let h = 0
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 7
}

function todayWeekdayIst(): number {
  const istDow = new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  })
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[istDow] ?? 0
}

async function canRunDigest(req: NextRequest) {
  const configuredSecret = process.env.EMAIL_DIGEST_SECRET
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (configuredSecret && bearer === configuredSecret) return true

  const auth = await requireApiUser()
  if (!auth) return false
  return getUserIsAdmin(auth.user.id)
}

function todayIsoDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? 'Scribbl <onboarding@resend.dev>'

  if (!apiKey) return { skipped: true }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend failed ${res.status}: ${body.slice(0, 200)}`)
  }

  return { skipped: false }
}

/**
 * Round-3 decision (docs 07 / 16): the email digest is shelved until we
 * pick a non-Resend transactional provider. Until then this route returns
 * 503 unconditionally — even an admin Bearer call won't trigger Resend
 * billing — and the cron job that pinged it has been disabled.
 *
 * To re-enable: set `EMAIL_DIGEST_FORCE_ENABLE=true` (or the platform_settings
 * `disable_email_digest` flag back to false) AFTER confirming the provider
 * credentials in env. The route's body below is left intact so the wiring
 * survives the next migration.
 */
const EMAIL_DIGEST_SHIPPED = process.env.EMAIL_DIGEST_FORCE_ENABLE === 'true'

export async function POST(req: NextRequest) {
  if (!EMAIL_DIGEST_SHIPPED) {
    return NextResponse.json(
      {
        error: 'Email digest is not enabled in v1.',
        reason: 'no_paid_transactional_provider',
      },
      { status: 503 },
    )
  }

  if (!(await canRunDigest(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = await createServiceClient()
  const flags = await getPlatformFlags(db)
  if (flags.disable_email_digest) {
    return NextResponse.json(
      { skipped: true, reason: 'disable_email_digest' },
      { status: 200 },
    )
  }

  const today = todayIsoDate()
  const todayBucket = todayWeekdayIst()

  const { data: users, error } = await db
    .from('users')
    .select('id, email, display_name, last_digest_sent_on')
    .eq('onboarding_completed', true)
    .eq('is_suspended', false)
    .eq('is_guest', false)
    .eq('is_deleted', false)
    .or(`last_digest_sent_on.is.null,last_digest_sent_on.neq.${today}`)
    .limit(MAX_DIGEST_BATCH * 7)

  if (error) return NextResponse.json({ error: 'Could not load digest users' }, { status: 500 })

  // Filter to today's bucket only, then cap at MAX_DIGEST_BATCH. Pulling
  // 7× and filtering gives a near-uniform daily cohort even when the
  // population is small. See docs/15-dev-review §5.
  const todaysCohort = (users ?? [])
    .filter(u => userWeekdayBucket(u.id) === todayBucket)
    .slice(0, MAX_DIGEST_BATCH)

  const siteUrl = getPublicSiteUrl()
  let sent = 0
  let skipped = 0
  const failures: { user_id: string; message: string }[] = []

  for (const recipient of todaysCohort) {
    try {
      const { count: unreadCount } = await db
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', recipient.id)
        .eq('is_read', false)

      const { data: ownedShirts } = await db
        .from('shirts')
        .select('id')
        .eq('owner_id', recipient.id)

      const shirtIds = (ownedShirts ?? []).map(shirt => shirt.id)
      const { count: newScribbles } = shirtIds.length
        ? await db
            .from('scribbles')
            .select('id', { count: 'exact', head: true })
            .eq('is_hidden', false)
            .gte('created_at', `${today}T00:00:00+05:30`)
            .in('shirt_id', shirtIds)
        : { count: 0 }

      if ((unreadCount ?? 0) === 0 && (newScribbles ?? 0) === 0) {
        skipped += 1
        await db.from('users').update({ last_digest_sent_on: today }).eq('id', recipient.id)
        continue
      }

      const safeName = escapeHtml(recipient.display_name ?? 'there')
      const unread = unreadCount ?? 0
      const result = await sendEmail({
        to: recipient.email,
        subject: 'Your Scribbl shirt has new activity',
        html: `
          <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#2d2923">
            <h1 style="font-size:24px;margin:0 0 12px">Hey ${safeName},</h1>
            <p>Your Scribbl shirt has ${unread} unread update${unread === 1 ? '' : 's'} today.</p>
            <p><a href="${siteUrl}/dashboard" style="color:#6f54df;font-weight:700">Open your dashboard</a></p>
          </div>
        `,
      })

      if (result.skipped) skipped += 1
      else sent += 1

      await db.from('users').update({ last_digest_sent_on: today }).eq('id', recipient.id)
    } catch (err) {
      failures.push({
        user_id: recipient.id,
        message: err instanceof Error ? err.message : 'Unknown send failure',
      })
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    sent,
    skipped,
    failures,
    bucket: todayBucket,
    candidates: todaysCohort.length,
    configured: Boolean(process.env.RESEND_API_KEY),
  })
}
