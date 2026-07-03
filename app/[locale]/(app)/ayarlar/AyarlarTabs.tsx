'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function AyarlarTabs() {
  const t = useTranslations('settings')
  const pathname = usePathname()

  const TABS = [
    { href: '/ayarlar',      label: t('tabGeneral'), exact: true },
    { href: '/ayarlar/ekip', label: t('tabTeam'),    exact: false },
  ]

  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6">
      {TABS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
