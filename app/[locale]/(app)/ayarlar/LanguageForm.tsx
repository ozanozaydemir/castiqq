'use client'

import { setLanguage } from '@/app/actions/language'
import { useTranslations } from 'next-intl'

const setTR = setLanguage.bind(null, 'tr')
const setEN = setLanguage.bind(null, 'en')

export function LanguageForm({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations('settings.language')

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">{t('description')}</p>
      <div className="flex gap-2">
        <form action={setTR}>
          <button
            type="submit"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              currentLocale === 'tr'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            🇹🇷 Türkçe
          </button>
        </form>
        <form action={setEN}>
          <button
            type="submit"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              currentLocale === 'en'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            🇬🇧 English
          </button>
        </form>
      </div>
    </div>
  )
}
