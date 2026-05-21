'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'
import type ShirtView from '@/components/shirt/ShirtView'

const DynamicShirtView = dynamic(() => import('@/components/shirt/ShirtView'), {
  ssr: false,
  loading: () => <Skeleton className="aspect-[4/5] w-full max-w-[640px] rounded-[28px]" />,
})

export default function ShirtViewLoader(props: React.ComponentProps<typeof ShirtView>) {
  return <DynamicShirtView {...props} />
}
