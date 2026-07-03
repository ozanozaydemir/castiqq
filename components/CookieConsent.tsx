'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

const STORAGE_KEY = 'castflow_cookie_consent'

export type ConsentState = 'accepted' | 'declined' | null

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(STORAGE_KEY) as ConsentState) ?? null
}

export function CookieConsent({ onConsent }: { onConsent: (v: ConsentState) => void }) {
  const [visible, setVisible] = useState(false)
  const t = useTranslations('cookie')
  const locale = useLocale()

  useEffect(() => {
    const saved = getConsent()
    if (!saved) setVisible(true)
    else onConsent(saved)
  }, [onConsent])

  function handle(value: 'accepted' | 'declined') {
    localStorage.setItem(STORAGE_KEY, value)
    setVisible(false)
    onConsent(value)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={t('ariaLabel')}
      className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto bg-white border border-gray-200 rounded-xl shadow-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">{t('title')}</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {t('description')}{' '}
            <a href={locale === 'en' ? '/en/gizlilik' : '/gizlilik'} className="text-indigo-600 hover:underline">
              {t('privacyLink')}
            </a>
          </p>
        </div>
        <button onClick={() => handle('declined')} className="text-gray-400 hover:text-gray-600 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handle('accepted')}
          className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          {t('accept')}
        </button>
        <button
          onClick={() => handle('declined')}
          className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {t('decline')}
        </button>
      </div>
    </div>
  )
}
