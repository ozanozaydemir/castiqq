'use client'

import { useState, useTransition } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { exportTalentToSheets } from '@/app/actions/googleSheets'

export function ExportToSheetsButton() {
  const t = useTranslations('talent')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await exportTalentToSheets()
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <div className="relative">
      <button type="button" onClick={handleClick} disabled={pending} className="sb-btn-secondary">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        {t('exportToSheets')}
      </button>
      {error && (
        <p className="absolute top-full mt-1 right-0 text-xs text-red-500 whitespace-nowrap bg-red-50 px-2 py-1 rounded-lg shadow-sm z-10">
          {error === 'not_connected' ? t('exportNotConnected') : t('exportFailed')}
        </p>
      )}
    </div>
  )
}
