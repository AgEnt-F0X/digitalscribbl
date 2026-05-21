import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { BUCKET_TEXTURES } from '@/lib/constants'
import { createFixedWindowRateLimiter, rateLimitResponseHeaders } from '@/lib/utils/rateLimit'
import { getPlatformFlags } from '@/lib/utils/platformFlags'

export const runtime = 'nodejs'

const MAX_VOICE_BYTES = 1.5 * 1024 * 1024
const MAX_VOICE_DURATION_MS = 12_000
const ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'video/webm',
])

// Storage is the most fragile free-tier resource (1 GB cap). One motivated
// user iterating uploads with MAX_VOICE_BYTES = 1.5 MB fills the bucket in
// an afternoon. 5/min keeps a friend group rolling without enabling abuse.
const voiceLimiter = createFixedWindowRateLimiter({ limit: 5, windowMs: 60_000 })

function extensionForMime(mime: string) {
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('wav')) return 'wav'
  return 'webm'
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rate = voiceLimiter.check(auth.user.id)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many voice uploads. Wait a minute and try again.', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitResponseHeaders(rate) },
    )
  }

  const db = await createServiceClient()
  const flags = await getPlatformFlags(db)
  if (flags.disable_voice_notes) {
    return NextResponse.json(
      { error: 'Voice notes are paused right now', code: 'VOICE_DISABLED' },
      { status: 503 },
    )
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  const rawDuration = Number(formData.get('duration_ms') ?? 0)
  const durationMs = Number.isFinite(rawDuration) ? Math.round(rawDuration) : 0

  if (!file) return NextResponse.json({ error: 'Voice file is required' }, { status: 400 })
  if (durationMs <= 0 || durationMs > MAX_VOICE_DURATION_MS) {
    return NextResponse.json({ error: 'Voice note must be 12 seconds or less' }, { status: 422 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.length > MAX_VOICE_BYTES) {
    return NextResponse.json({ error: 'Voice note is too large' }, { status: 413 })
  }

  const detected = await import('file-type').then(({ fileTypeFromBuffer }) => fileTypeFromBuffer(buffer))
  const mime = detected?.mime ?? file.type
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return NextResponse.json({ error: 'Unsupported voice format' }, { status: 415 })
  }

  const ext = extensionForMime(mime)
  const path = `voices/${auth.user.id}/${crypto.randomUUID()}.${ext}`
  const { error } = await db.storage
    .from(BUCKET_TEXTURES)
    .upload(path, buffer, { contentType: mime, upsert: false })

  if (error) {
    console.error('Voice upload failed:', error)
    return NextResponse.json({ error: 'Could not upload voice note' }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from(BUCKET_TEXTURES).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl, duration_ms: durationMs })
}
