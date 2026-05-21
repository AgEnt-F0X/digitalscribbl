import { Clock, Lock, PenLine } from 'lucide-react'

interface ScribblePermissionStatusProps {
  state: 'can' | 'request' | 'locked' | 'own'
}

export default function ScribblePermissionStatus({ state }: ScribblePermissionStatusProps) {
  const config = {
    can: { icon: PenLine, text: 'You can scribble', className: 'bg-green-50 text-green-700 border-green-200' },
    request: { icon: Clock, text: 'Waiting for approval', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    locked: { icon: Lock, text: 'Ask to scribble', className: 'bg-gray-50 text-gray-600 border-gray-200' },
    own: { icon: Lock, text: 'Your own shirt', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  }[state]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${config.className}`}>
      <Icon size={14} />
      {config.text}
    </span>
  )
}
