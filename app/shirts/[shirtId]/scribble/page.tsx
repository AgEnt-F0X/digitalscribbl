import { notFound } from 'next/navigation'
import { requirePageUser } from '@/lib/auth/server'
import { canAttemptScribble } from '@/lib/utils/safetyAccess'
import { normalizeAvatarConfig } from '@/src/features/avatar/data/avatarPresets'
import ScribbleStudio from '@/src/features/scribble/components/ScribbleStudio'
import type { ScribbleRow } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ shirtId: string }>
  searchParams: Promise<{ side?: string }>
}

export const dynamic = 'force-dynamic'

type PermissionState = 'can' | 'request' | 'locked' | 'own'

export default async function ShirtScribblePage({ params, searchParams }: Props) {
  const { supabase, user } = await requirePageUser()
  const { shirtId } = await params
  const { side } = await searchParams
  const initialSide = side === 'back' ? 'back' : 'front'

  const { data: shirt } = await supabase
    .from('shirts')
    .select('id, owner_id, shirt_number, is_locked')
    .eq('id', shirtId)
    .single()

  if (!shirt) notFound()

  const { data: owner } = await supabase
    .from('users')
    .select('id, display_name, shirt_permission, batch_id, is_suspended, avatar_config, head_front_url, head_back_url')
    .eq('id', shirt.owner_id)
    .single()

  if (!owner || owner.is_suspended) notFound()

  const { data: viewerProfile } = await supabase
    .from('users')
    .select('display_name, batch_id, is_suspended')
    .eq('id', user.id)
    .single()

  if (viewerProfile?.is_suspended) notFound()

  const { data: scribbles } = await supabase
    .from('scribbles')
    .select('id, panel, x, y, w, h, canvas_svg')
    .eq('shirt_id', shirt.id)
    .eq('is_hidden', false)

  let permissionState: PermissionState = 'locked'
  const isOwner = user.id === owner.id

  if (isOwner) {
    permissionState = 'own'
  } else if (!shirt.is_locked && owner.shirt_permission !== 'locked') {
    const { data: requestRecord } = await supabase
      .from('scribble_requests')
      .select('status')
      .eq('requester_id', user.id)
      .eq('owner_id', owner.id)
      .maybeSingle()

    const sameBatch = Boolean(owner.batch_id && viewerProfile?.batch_id && owner.batch_id === viewerProfile.batch_id)
    const approvedRequest = requestRecord?.status === 'approved'
    permissionState = canAttemptScribble({
      isOwner: false,
      permission: owner.shirt_permission,
      sameBatch,
      approvedRequest,
    }) ? 'can' : 'request'
  }

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
      existingScribbles={(scribbles ?? []) as Pick<ScribbleRow, 'id' | 'x' | 'y' | 'w' | 'h' | 'canvas_svg' | 'panel'>[]}
    />
  )
}
