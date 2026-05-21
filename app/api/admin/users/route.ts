import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIsAdmin, requireApiUser } from '@/lib/auth/server'
import { writeAdminAuditLog, type AdminAction } from '@/lib/utils/audit'

const ACTION_TO_AUDIT: Record<string, AdminAction> = {
  suspend:      'user_suspended',
  unsuspend:    'user_unsuspended',
  make_admin:   'user_admin_granted',
  remove_admin: 'user_admin_revoked',
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = auth

  if (!(await getUserIsAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, action } = await req.json()
  if (!user_id || !action) {
    return NextResponse.json({ error: 'user_id and action required' }, { status: 400 })
  }

  // Prevent self-modification
  if (user_id === user.id) {
    return NextResponse.json({ error: 'Cannot modify your own admin/suspension status' }, { status: 400 })
  }

  const db = await createServiceClient()

  let writeErr: { message: string } | null = null
  switch (action) {
    case 'suspend':
      ({ error: writeErr } = await db.from('users').update({ is_suspended: true }).eq('id', user_id))
      break
    case 'unsuspend':
      ({ error: writeErr } = await db.from('users').update({ is_suspended: false }).eq('id', user_id))
      break
    case 'make_admin':
      ({ error: writeErr } = await db.from('users').update({ is_admin: true }).eq('id', user_id))
      break
    case 'remove_admin':
      ({ error: writeErr } = await db.from('users').update({ is_admin: false }).eq('id', user_id))
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  if (writeErr) {
    return NextResponse.json({ error: 'Could not apply action' }, { status: 500 })
  }

  const auditAction = ACTION_TO_AUDIT[action]
  if (auditAction) {
    await writeAdminAuditLog(db, {
      actor_user_id: user.id,
      action: auditAction,
      target_kind: 'user',
      target_id: user_id,
      details: { action },
    })
  }

  return NextResponse.json({ success: true })
}
