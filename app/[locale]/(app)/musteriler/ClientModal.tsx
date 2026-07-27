'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/clients'
import type { Client } from '@/types/database'

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

export function ClientModal({
  action,
  editingClient,
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingClient?: Client | null
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const t = useTranslations('clients')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingClient ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('name')} <span className="text-red-400">*</span></label>
            <input name="name" required defaultValue={editingClient?.name ?? ''} placeholder={t('namePlaceholder')} className="sb-input" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('type')}</label>
            <select name="client_type" defaultValue={editingClient?.client_type ?? 'diger'} className="sb-input">
              <option value="yapim_sirketi">{t('types.yapim_sirketi')}</option>
              <option value="reklam_ajansi">{t('types.reklam_ajansi')}</option>
              <option value="marka">{t('types.marka')}</option>
              <option value="diger">{t('types.diger')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('contactName')}</label>
              <input name="contact_name" defaultValue={editingClient?.contact_name ?? ''} placeholder={t('contactNamePlaceholder')} className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
              <input name="phone" defaultValue={editingClient?.phone ?? ''} placeholder="+90 532 000 00 00" className="sb-input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
            <input type="email" name="email" defaultValue={editingClient?.email ?? ''} placeholder="iletisim@yapim.com" className="sb-input" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea name="notes" defaultValue={editingClient?.notes ?? ''} rows={2} placeholder={t('notesPlaceholder')} className="sb-input resize-none w-full" />
          </div>

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={editingClient ? t('update') : t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
