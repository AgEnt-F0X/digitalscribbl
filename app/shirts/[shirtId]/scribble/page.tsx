import { notFound } from 'next/navigation'
import { requirePageUser } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/server'
import { canSignShirt } from '@/lib/identity/signing'
import { loadShirtAccess, normalizeVisibility } from '@/lib/identity/access'
import { normalizeAvatarConfig } from '@/src/features/avatar/data/avatarPresets'
import ScribbleStudio from '@/src/features/scribble/components/ScribbleStudio'
import type { ScribbleRow } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ shirtId: string }>
  searchParams: Promise<{ side?: string }>
}

export const dynamic = 'force-dynamic'

// `request` is gone: an approval shirt opens the studio and returns `pending`
// on publish, so nobody waits for permission before drawing.
type PermissionState = 'can' | 'locked' | 'own'

export default async function ShirtScribblePage({ params, searchParams }: Props) {
  const { supabase, user } = await requirePageUser()
  const { shirtId } = await params
  const { side } = await searchParams
  const initialSide = side === 'back' ? 'back' : 'front'

  const { data: shirt } = await supabase
    .from('shirts')
    .select('id, owner_id, shirt_number, is_locked, visibility')
    .eq('id', shirtId)
    .single()

  if (!shirt) notFound()

  const { data: owner } = await supabase
    .from('users')
    .select('id, display_name, is_suspended, avatar_config, head_front_url, head_back_url')
    .eq('id', shirt.owner_id)
    .single()

  if (!owner || owner.is_suspended) notFound()

  const { data: viewerProfile } = await supabase
    .from('users')
    .select('display_name, is_suspended')
    .eq('id', user.id)
    .single()

  if (viewerProfile?.is_suspended) notFound()

  const { data: scribbles } = await supabase
    .from('scribbles')
    .select('id, panel, x, y, w, h, canvas_svg, approval_status, scribbler_id')
    .eq('shirt_id', shirt.id)
    .eq('is_hidden', false)

  const isOwner = user.id === shirt.owner_id

  // One-door model (doc 07). The shirt's own mode decides, not a permission on
  // the owner's profile, and batch is never consulted.
  const access = await loadShirtAccess(await createServiceClient(), shirt.id, user.id)
  const visibility = access?.visibility ?? normalizeVisibility(shirt.visibility)

  let permissionState: PermissionState = 'locked'

  if (isOwner) {
    permissionState = 'own'
  } else if (access) {
    const decision = canSignShirt({
      shirt: { visibility },
      isOwner: false,
      isBlocked: access.isBlocked,
      isCircleMember: access.isCircleMember,
    })
    // An `approval` shirt still lets you draw — the studio opens and the
    // publish call comes back `pending`, so this must not read as `request`.
    permissionState = decision.allowed ? 'can' : 'locked'
  }

  // Only the author and the owner ever see a pending scribble. Everyone else
  // gets the approved set, which is what the RLS policy would have returned
  // had this been the user-scoped client.
  const visibleScribbles = (scribbles ?? []).filter(row =>
    isOwner || row.approval_status === 'approved' || row.scribbler_id === user.id,
  )

  const ownerAvatarConfig = {
    ...normalizeAvatarConfig(owner.avatar_config),
    frontFaceImageUrl: owner.head_front_url ?? normalizeAvatarConfig(owner.avatar_config).frontFaceImageUrl,
    backHairImageUrl: owner.head_back_url ?? normalizeAvatarConfig(owner.avatar_config).backHairImageUrl,
  }

  return (
    <ScribbleStudio
      shirtId={shirt.id}
      shirtNumber={shirt.shirt_number}
      ownerId={owner.id}
      ownerName={owner.display_name}
      currentUserId={user.id}
      currentUserName={viewerProfile?.display_name ?? 'You'}
      permissionState={permissionState}
      initialSide={initialSide}
      ownerAvatarConfig={ownerAvatarConfig}
      existingScribbles={visibleScribbles as Pick<ScribbleRow, 'id' | 'x' | 'y' | 'w' | 'h' | 'canvas_svg' | 'panel'>[]}
    />
  )
}
