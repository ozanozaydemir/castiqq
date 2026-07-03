'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { updateProfile } from '@/app/actions/settings'
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

export function ProfilForm({ initialName, email }: { initialName: string; email: string }) {
  const t = useTranslations('settings')
  const [state, action] = useActionState(updateProfile, null)

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-600">{t('form.fullName')}</label>
        <input name="full_name" defaultValue={initialName} className="sb-input" required />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-600">{t('form.email')}</label>
        <input value={email} disabled className="sb-input opacity-50 cursor-not-allowed" />
        <p className="text-xs text-gray-400">{t('form.emailNote')}</p>
      </div>
      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {t('form.saved')}
        </p>
      )}
      <SubmitBtn />
    </form>
  )
}
