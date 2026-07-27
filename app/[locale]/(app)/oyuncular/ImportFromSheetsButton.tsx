'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Upload, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { importTalentFromSheets } from '@/app/actions/googleSheets'

const ERROR_KEYS: Record<string, string> = {
  not_connected: 'importErrorNotConnected',
  invalid_url: 'importErrorInvalidUrl',
  empty_sheet: 'importErrorEmptySheet',
  missing_name_column: 'importErrorMissingNameColumn',
  insert_failed: 'importErrorFailed',
  import_failed: 'importErrorFailed',
}

export function ImportFromSheetsButton() {
  const t = useTranslations('talent')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ imported: number; skipped: number } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await importTalentFromSheets(url)
      if (result.error) {
        setError(ERROR_KEYS[result.error] ?? 'importErrorFailed')
        return
      }
      setSuccess({ imported: result.imported ?? 0, skipped: result.skipped ?? 0 })
      router.refresh()
    })
  }

  function close() {
    setOpen(false)
    setUrl('')
    setError(null)
    setSuccess(null)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="sb-btn-secondary">
        <Upload className="w-4 h-4" /> {t('importFromSheets')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">{t('importDialogTitle')}</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">{t('importDialogHint')}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={t('importDialogPlaceholder')}
                className="sb-input"
              />

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-2.5 rounded-xl text-sm">
                  {t(error as Parameters<typeof t>[0])}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-100 text-green-700 px-3.5 py-2.5 rounded-xl text-sm">
                  {t('importSuccess', { imported: success.imported, skipped: success.skipped })}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors"
              >
                {pending ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t('importing')}</>) : t('importDialogCta')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
