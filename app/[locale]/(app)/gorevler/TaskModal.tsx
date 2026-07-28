'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createTask, type ActionState } from '@/app/actions/agencyTasks'

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

export function TaskModal({
  talents,
  defaultTalentId,
  onClose,
}: {
  talents: { id: string; full_name: string }[]
  defaultTalentId?: string
  onClose: () => void
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createTask, null)
  const t = useTranslations('tasks')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('titleField')} <span className="text-red-400">*</span></label>
            <input name="title" required placeholder={t('titlePlaceholder')} className="sb-input" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('dueDate')}</label>
            <input type="date" name="due_date" className="sb-input" />
          </div>

          {talents.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('linkedTalent')}</label>
              <select name="talent_id" defaultValue={defaultTalentId ?? ''} className="sb-input">
                <option value="">{t('noTalent')}</option>
                {talents.map(tal => <option key={tal.id} value={tal.id}>{tal.full_name}</option>)}
              </select>
            </div>
          )}

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
