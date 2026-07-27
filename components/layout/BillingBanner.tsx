'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function BillingBanner() {
  const t = useTranslations('settings.plan.billingBanner')

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2.5">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 min-w-[200px]">{t('pastDue')}</span>
      <a
        href="/api/portal"
        className="font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-2 whitespace-nowrap"
      >
        {t('updateCard')}
      </a>
    </div>
  )
}
