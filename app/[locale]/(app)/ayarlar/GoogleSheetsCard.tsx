import { getTranslations } from 'next-intl/server'
import { disconnectGoogle } from '@/app/actions/google'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  connectedEmail: string | null
  message?: string
}

export async function GoogleSheetsCard({ connectedEmail, message }: Props) {
  const t = await getTranslations('settings.google')

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{t('description')}</p>

      {message && (
        <p className={`text-sm rounded-lg px-3 py-2 ${
          message === 'connectedSuccess'
            ? 'text-green-600 bg-green-50 flex items-center gap-2'
            : 'text-red-500 bg-red-50'
        }`}>
          {message === 'connectedSuccess' && <CheckCircle2 className="w-4 h-4" />}
          {t(message as Parameters<typeof t>[0])}
        </p>
      )}

      {connectedEmail ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">{t('connectedAs', { email: connectedEmail })}</p>
          <form action={disconnectGoogle}>
            <button type="submit" className="sb-btn-secondary text-sm">
              {t('disconnectCta')}
            </button>
          </form>
        </div>
      ) : (
        <a href="/api/google/connect" className="sb-btn-primary inline-flex text-sm">
          {t('connectCta')}
        </a>
      )}
    </div>
  )
}
