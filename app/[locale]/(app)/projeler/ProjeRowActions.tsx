'use client'

import { useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { updateProjeStatus } from '@/app/actions/projects'

export function ProjeRowActions({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const t = useTranslations('projects')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(status: string) {
    startTransition(async () => {
      await updateProjeStatus(projectId, status)
      router.refresh()
    })
  }

  return (
    <div className="relative inline-flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1 bg-white hover:border-gray-300">
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none" />}
      <select
        value={currentStatus}
        disabled={isPending}
        onChange={e => handleChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        <option value="active">{t('statusActive')}</option>
        <option value="completed">{t('statusCompleted')}</option>
        <option value="archived">{t('statusArchived')}</option>
      </select>
      <span className="pointer-events-none">{t('quickStatusChange')}</span>
    </div>
  )
}
