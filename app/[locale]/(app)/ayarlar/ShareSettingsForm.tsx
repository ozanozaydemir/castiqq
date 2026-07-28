'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { updateShareSettings } from '@/app/actions/settings'
import { CheckCircle2, Loader2 } from 'lucide-react'

function SubmitBtn() {
  const { pending } = useFormStatus()
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('form.saving')}</> : tc('save')}
    </button>
  )
}

export function ShareSettingsForm({ initialSlug, initialAccepts, siteUrl }: {
  initialSlug: string | null; initialAccepts: boolean; siteUrl: string
}) {
  const t = useTranslations('settings.share')
  const [state, action] = useActionState(updateShareSettings, null)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-600">{t('slugLabel')}</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 whitespace-nowrap">{siteUrl}/p/</span>
          <input
            name="public_slug"
            defaultValue={initialSlug ?? ''}
            placeholder="benzersiz-slug"
            pattern="[a-z0-9-]{3,40}"
            className="sb-input"
          />
        </div>
        <p className="text-xs text-gray-400">{t('slugHint')}</p>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" name="accepts_external_shares" defaultChecked={initialAccepts} className="accent-indigo-500 w-4 h-4" />
        <span className="text-sm text-gray-700">{t('acceptsLabel')}</span>
      </label>

      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {t('saved')}
        </p>
      )}
      <SubmitBtn />
    </form>
  )
}
