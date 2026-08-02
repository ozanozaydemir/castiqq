'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { updateRetentionSettings } from '@/app/actions/settings'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

function SubmitBtn() {
  const { pending } = useFormStatus()
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-50">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('form.saving')}</> : tc('save')}
    </button>
  )
}

const PRESETS = [30, 90, 180, 365]

export function RetentionForm({ initialDays }: { initialDays: number | null }) {
  const t = useTranslations('settings')
  const [state, action] = useActionState(updateRetentionSettings, null)
  const [days, setDays] = useState(initialDays == null ? '' : String(initialDays))

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-gray-500 leading-relaxed">{t('retention.description')}</p>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setDays(String(p))}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              days === String(p)
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {t('retention.days', { count: p })}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDays('')}
          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            days === ''
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {t('retention.never')}
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-600">{t('retention.label')}</label>
        <input
          name="default_retention_days"
          type="number"
          min={1}
          max={3650}
          value={days}
          onChange={e => setDays(e.target.value)}
          placeholder={t('retention.placeholder')}
          className="sb-input"
        />
      </div>

      {/* Bu ayarın gizlilik beyanıyla tutarlı olması hukuki bir gereklilik —
          kullanıcıya ne vaat ettiğini açıkça gösteriyoruz. */}
      <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3">
        <ShieldCheck className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          {days ? t('retention.noticeSet', { count: Number(days) }) : t('retention.noticeNever')}
        </p>
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
