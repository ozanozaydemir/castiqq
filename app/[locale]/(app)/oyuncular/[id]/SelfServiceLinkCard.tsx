'use client'

import { useState } from 'react'
import { Link2, Copy, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function SelfServiceLinkCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('talent.selfService')
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/oyuncu-profil/${token}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="sb-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">{t('title')}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">{t('description')}</p>
      <div className="flex items-center gap-2">
        <input readOnly value={url} className="sb-input text-xs flex-1 text-gray-500" onClick={e => (e.target as HTMLInputElement).select()} />
        <button onClick={handleCopy} className="sb-btn-secondary flex-shrink-0">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
    </div>
  )
}
