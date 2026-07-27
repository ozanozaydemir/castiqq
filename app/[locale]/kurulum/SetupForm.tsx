'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Clapperboard, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { completeOrgSetup } from '@/app/actions/onboarding'

function SubmitBtn() {
  const { pending } = useFormStatus()
  const t = useTranslations('auth.setup')
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
    >
      {pending ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>) : t('cta')}
    </button>
  )
}

export function SetupForm() {
  const t = useTranslations('auth.setup')
  const ta = useTranslations('auth')
  const [state, action] = useActionState(completeOrgSetup, null)
  const [orgType, setOrgType] = useState<'production' | 'agency'>('production')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl tracking-tight">Castiqq</span>
      </div>

      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="org_type" value={orgType} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{ta('orgTypeLabel')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrgType('production')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  orgType === 'production'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {ta('orgTypeProduction')}
              </button>
              <button
                type="button"
                onClick={() => setOrgType('agency')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  orgType === 'agency'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {ta('orgTypeAgency')}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('orgNameLabel')}</label>
            <input
              required
              name="org_name"
              placeholder={t('orgNamePlaceholder')}
              autoFocus
              className="sb-input"
            />
          </div>

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <SubmitBtn />
        </form>
      </div>
    </div>
  )
}
