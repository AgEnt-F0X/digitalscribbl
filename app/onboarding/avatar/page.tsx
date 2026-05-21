import { redirect } from 'next/navigation'
import { requirePageUser } from '@/lib/auth/server'
import AvatarOnboardingFlow from '@/src/features/avatar/components/AvatarOnboardingFlow'

export const dynamic = 'force-dynamic'

export default async function AvatarOnboardingPage() {
  const { supabase, user } = await requirePageUser()

  const { data: profile } = await supabase
    .from('users')
    .select('avatar_config, head_front_url, head_back_url, is_university_verified')
    .eq('id', user.id)
    .single()

  if (!profile?.is_university_verified) redirect('/dashboard')

  return (
    <AvatarOnboardingFlow
      initialConfig={profile.avatar_config}
      initialFrontFaceUrl={profile.head_front_url}
      initialBackHairUrl={profile.head_back_url}
    />
  )
}
