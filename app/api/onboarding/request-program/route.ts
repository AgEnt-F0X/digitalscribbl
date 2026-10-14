import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const requestSchema = z.object({
  schoolName: z.string().min(2).max(100),
  programName: z.string().min(2).max(100),
  batchLabel: z.string().min(2).max(50),
})

export async function POST(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 422 })
  }

  const { schoolName, programName, batchLabel } = parsed.data
  const serviceDb = await createServiceClient()

  const { error } = await serviceDb
    .from('program_requests')
    .insert({
      user_id: auth.user.id,
      school_name: schoolName.trim(),
      program_name: programName.trim(),
      batch_label: batchLabel.trim(),
      status: 'pending',
    })

  if (error) {
    console.error('Program request insertion error:', error)
    return NextResponse.json({ error: 'Could not log request' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Program request submitted successfully!' })
}
