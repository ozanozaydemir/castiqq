'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/pitches'
import type { PitchItem, BrandCategory } from '@/types/database'
import type { ExclusivityConflict } from '@/lib/crm'

const ITEM_STATUSES = ['onerildi', 'on_elemede', 'geri_cagrildi', 'secildi', 'elendi', 'geri_cekildi'] as const
const FEE_TYPES = ['daily', 'weekly', 'per_episode', 'monthly', 'per_project', 'hourly'] as const

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

export function PitchItemModal({
  action,
  editingItem,
  talents,
  brandCategory,
  conflictsByTalent,
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingItem?: PitchItem | null
  talents: { id: string; full_name: string }[]
  brandCategory: BrandCategory | null
  /** Oyuncu id → o oyuncunun bu kategorideki aktif reklam yasakları */
  conflictsByTalent: Record<string, ExclusivityConflict[]>
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const [talentId, setTalentId] = useState(editingItem?.talent_id ?? '')
  const t = useTranslations('pitches.items')
  const tcl = useTranslations('clients')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  // Seçilen oyuncu bu marka kategorisinde başka bir işten dolayı bloklu mu?
  const conflicts = talentId ? (conflictsByTalent[talentId] ?? []) : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingItem ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          {!editingItem && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('talent')} <span className="text-red-400">*</span></label>
              <select
                name="talent_id"
                required
                value={talentId}
                onChange={e => setTalentId(e.target.value)}
                className="sb-input"
                autoFocus
              >
                <option value="">{t('selectTalent')}</option>
                {talents.map(tal => <option key={tal.id} value={tal.id}>{tal.full_name}</option>)}
              </select>
            </div>
          )}

          {/* Yasak varken eklemeyi engellemiyoruz — istisnalar olabiliyor —
              ama menajer bilmeden öneremesin. */}
          {conflicts.length > 0 && brandCategory && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('exclusivityConflict')}</p>
                {conflicts.map(c => (
                  <p key={c.bookingId} className="mt-0.5">
                    {t('exclusivityConflictDetail', {
                      client: c.clientName,
                      category: tcl(`brandCategories.${c.category}`),
                      date: new Date(c.endDate).toLocaleDateString('tr-TR'),
                    })}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('roleName')}</label>
            <input name="role_name" defaultValue={editingItem?.role_name ?? ''} placeholder={t('roleNamePlaceholder')} className="sb-input" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
            <select name="status" defaultValue={editingItem?.status ?? 'onerildi'} className="sb-input">
              {ITEM_STATUSES.map(s => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('proposedFee')}</label>
              <input type="number" step="0.01" name="proposed_fee" defaultValue={editingItem?.proposed_fee ?? ''} placeholder="0" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('clientOffer')}</label>
              <input type="number" step="0.01" name="client_offer" defaultValue={editingItem?.client_offer ?? ''} placeholder="0" className="sb-input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('feeType')}</label>
            <select name="fee_type" defaultValue={editingItem?.fee_type ?? ''} className="sb-input">
              <option value="">—</option>
              {FEE_TYPES.map(f => <option key={f} value={f}>{t(`feeTypes.${f}`)}</option>)}
            </select>
          </div>

          <input type="hidden" name="currency" value={editingItem?.currency ?? 'TRY'} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('clientFeedback')}</label>
            <textarea name="client_feedback" defaultValue={editingItem?.client_feedback ?? ''} rows={2} placeholder={t('clientFeedbackPlaceholder')} className="sb-input resize-none w-full" />
          </div>

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={tc('save')} savingLabel={tc('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
