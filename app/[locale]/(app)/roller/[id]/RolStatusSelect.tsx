'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Badge } from '@/components/ui/Badge'
import { ChevronDown } from 'lucide-react'
import { updateRolStatus } from '@/app/actions/projects'
import { useTranslations } from 'next-intl'

export function RolStatusSelect({ roleId, projectId, currentStatus }: {
  roleId: string
  projectId: string | null
  currentStatus: string
}) {
  const t = useTranslations('roles')
  const [status, setStatus] = useState(currentStatus)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const OPTIONS = [
    { value: 'open',      label: t('status.open'),      variant: 'green'   as const },
    { value: 'casting',   label: t('status.casting'),   variant: 'yellow'  as const },
    { value: 'filled',    label: t('status.filled'),    variant: 'indigo'  as const },
    { value: 'cancelled', label: t('status.cancelled'), variant: 'default' as const },
  ]

  const current = OPTIONS.find(o => o.value === status)

  return (
    <div className="relative inline-flex items-center gap-1 cursor-pointer select-none">
      <Badge variant={current?.variant ?? 'default'}>{current?.label ?? status}</Badge>
      <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none" />
      <select
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
        value={status}
        onChange={e => {
          const next = e.target.value
          setStatus(next)
          startTransition(async () => {
            await updateRolStatus(roleId, projectId, next)
            router.refresh()
          })
        }}
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
