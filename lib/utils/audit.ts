/**
 * Admin audit log writer (doc 09 + doc 15-dev-review section 4).
 *
 * Every privileged admin action — suspend, hide, setting change, role
 * promotion — should call this helper. Schema lives in migration 010
 * (`admin_audit_logs`). Reads are admin-gated by RLS; writes go through
 * the service-role client.
 *
 * Designed to fail soft: a failure to write the log SHOULD NOT block the
 * underlying action. We `console.error` and move on. The product surface
 * stays correct; the missing log row is the operator's problem.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'

export type AdminAction =
  | 'setting_changed'
  | 'user_suspended'
  | 'user_unsuspended'
  | 'user_admin_granted'
  | 'user_admin_revoked'
  | 'user_deleted'
  | 'scribble_hidden'
  | 'scribble_unhidden'
  | 'scribble_removed'
  | 'report_dismissed'
  | 'report_actioned'

export type AdminTargetType =
  | 'platform_setting'
  | 'user'
  | 'scribble'
  | 'shirt'
  | 'report'
  | 'group'

export interface AuditLogInput {
  /** Admin user performing the action. */
  actor_user_id: string
  action: AdminAction
  target_kind: AdminTargetType
  /** UUID of the target row, or null for actions that don't have one (e.g. settings). */
  target_id: string | null
  /** Free-form context. Use plain objects; will be JSON-serialised by Supabase. */
  details: Record<string, unknown>
}

/**
 * Best-effort audit insert. Never throws. Maps the friendlier input shape to
 * the underlying `admin_audit_logs` schema (`admin_id`, `target_type`,
 * `metadata`).
 */
export async function writeAdminAuditLog(
  db: SupabaseClient<Database>,
  input: AuditLogInput,
): Promise<void> {
  try {
    const { error } = await db.from('admin_audit_logs').insert({
      admin_id:    input.actor_user_id,
      action:      input.action,
      target_type: input.target_kind,
      target_id:   input.target_id,
      metadata:    input.details as unknown as Json,
    })
    if (error) {
      console.error('[audit] insert failed:', input.action, error.message)
    }
  } catch (err) {
    console.error('[audit] unexpected failure:', input.action, err)
  }
}
