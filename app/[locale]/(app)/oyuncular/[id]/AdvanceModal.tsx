'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/advances'
import type { TalentAdvance } from '@/types/database'

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

export function AdvanceModal({
  action,
  editingAdvance,
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingAdvance?: TalentAdvance | null
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const t = useTranslations('talent.advances')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingAdvance ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('type')}</label>
            <select name="type" defaultValue={editingAdvance?.type ?? 'avans'} className="sb-input">
              <option value="avans">{t('types.avans')}</option>
              <option value="masraf">{t('types.masraf')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('amount')} <span className="text-red-400">*</span></label>
              <input type="number" name="amount" required min={0} step="0.01" defaultValue={editingAdvance?.amount ?? ''} placeholder="0" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('currency')}</label>
              <select name="currency" defaultValue={editingAdvance?.currency ?? 'TRY'} className="sb-input">
                <option value="TRY">TRY — Türk Lirası</option>
                <option value="USD">USD — Dolar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('date')} <span className="text-red-400">*</span></label>
            <input type="date" name="date" required defaultValue={editingAdvance?.date ?? ''} className="sb-input" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
            <textarea name="description" defaultValue={editingAdvance?.description ?? ''} rows={2} placeholder={t('descriptionPlaceholder')} className="sb-input resize-none w-full" />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer w-fit">
            <input
              type="checkbox"
              name="is_settled"
              defaultChecked={editingAdvance?.is_settled ?? false}
              className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
            />
            {t('isSettled')}
          </label>

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={editingAdvance ? t('update') : t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
