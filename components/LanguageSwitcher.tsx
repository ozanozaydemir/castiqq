'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchTo(newLocale: 'tr' | 'en') {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`}>
      <button
        onClick={() => switchTo('tr')}
        className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
          locale === 'tr'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        TR
      </button>
      <span className="text-gray-200 text-xs">|</span>
      <button
        onClick={() => switchTo('en')}
        className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
          locale === 'en'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        EN
      </button>
    </div>
  )
}
