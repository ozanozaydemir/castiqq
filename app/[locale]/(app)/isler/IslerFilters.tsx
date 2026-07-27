'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from '@/i18n/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function IslerFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const t = useTranslations('jobs')

  const get = (key: string) => searchParams.get(key) ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  const hasFilters = ['q', 'status'].some(k => searchParams.has(k))

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={get('q')}
          onChange={e => update('q', e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="sb-input pl-8 pr-3 py-2 text-sm w-full"
        />
      </div>

      <select value={get('status')} onChange={e => update('status', e.target.value)} className="sb-input text-sm w-auto">
        <option value="">{t('allStatuses')}</option>
        <option value="pending">{t('paymentStatuses.pending')}</option>
        <option value="partial">{t('paymentStatuses.partial')}</option>
        <option value="paid">{t('paymentStatuses.paid')}</option>
      </select>

      {hasFilters && (
        <button onClick={() => startTransition(() => router.push(pathname))} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
          <X className="w-3 h-3" /> {t('clearFilters')}
        </button>
      )}
    </div>
  )
}
