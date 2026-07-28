'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/clientInteractions'
import type { ClientInteraction, ClientContact } from '@/types/database'

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

const TYPES = [
  'tanisma', 'telefon_gorusmesi', 'toplanti', 'oyuncu_onerisi',
  'audition_talebi', 'okuma_provasi', 'kostum_provasi',
  'deneme_cekimi', 'sozlesme_gorusmesi', 'diger',
] as const

export function InteractionModal({
  action,
  editingInteraction,
  talents,
  contacts = [],
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingInteraction?: ClientInteraction | null
  talents: { id: string; full_name: string }[]
  contacts?: ClientContact[]
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const t = useTranslations('clients.interactions')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingInteraction ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('type')}</label>
            <select name="interaction_type" defaultValue={editingInteraction?.interaction_type ?? 'tanisma'} className="sb-input">
              {TYPES.map(type => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('date')} <span className="text-red-400">*</span></label>
            <input type="date" name="interaction_date" required defaultValue={editingInteraction?.interaction_date ?? ''} className="sb-input" />
          </div>

          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('relatedContact')}</label>
              <select name="contact_id" defaultValue={editingInteraction?.contact_id ?? ''} className="sb-input">
                <option value="">{t('noContact')}</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
          )}

          {talents.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('relatedTalent')}</label>
              <select name="talent_id" defaultValue={editingInteraction?.talent_id ?? ''} className="sb-input">
                <option value="">{t('noTalent')}</option>
                {talents.map(tal => <option key={tal.id} value={tal.id}>{tal.full_name}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea name="notes" defaultValue={editingInteraction?.notes ?? ''} rows={3} placeholder={t('notesPlaceholder')} className="sb-input resize-none w-full" />
          </div>

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={editingInteraction ? t('update') : t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
