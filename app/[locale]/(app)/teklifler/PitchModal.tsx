'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BRAND_CATEGORIES, PITCH_STAGES } from '@/lib/crm'
import type { ActionState } from '@/app/actions/pitches'
import type { Pitch, PitchProjectType, PitchStage } from '@/types/database'

const PROJECT_TYPES = [
  'dizi', 'reklam', 'film', 'dijital', 'tiyatro', 'sunuculuk', 'seslendirme', 'etkinlik', 'diger',
] as const

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

export function PitchModal({
  action,
  editingPitch,
  clients,
  teamMembers = [],
  defaultClientId,
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingPitch?: Pitch | null
  clients: { id: string; name: string }[]
  teamMembers?: { id: string; full_name: string }[]
  defaultClientId?: string
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  // Marka kategorisi ve kaybetme nedeni koşullu alanlar — seçime göre açılıyor.
  const [projectType, setProjectType] = useState<PitchProjectType>(editingPitch?.project_type ?? 'diger')
  const [stage, setStage] = useState<PitchStage>(editingPitch?.stage ?? 'brief')
  const t = useTranslations('pitches')
  const tc = useTranslations('common')
  // Marka kategorisi sözlüğü müşteri tarafında yaşıyor — tek kaynak.
  const tcl = useTranslations('clients')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingPitch ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('pitchTitle')} <span className="text-red-400">*</span></label>
            <input name="title" required defaultValue={editingPitch?.title ?? ''} placeholder={t('titlePlaceholder')} className="sb-input" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('client')} <span className="text-red-400">*</span></label>
            <select name="client_id" required defaultValue={editingPitch?.client_id ?? defaultClientId ?? ''} className="sb-input">
              <option value="">{t('selectClient')}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('projectType')}</label>
              <select name="project_type" value={projectType} onChange={e => setProjectType(e.target.value as PitchProjectType)} className="sb-input">
                {PROJECT_TYPES.map(k => <option key={k} value={k}>{t(`projectTypes.${k}`)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('stage')}</label>
              <select name="stage" value={stage} onChange={e => setStage(e.target.value as PitchStage)} className="sb-input">
                {PITCH_STAGES.map(k => <option key={k} value={k}>{t(`stages.${k}`)}</option>)}
              </select>
            </div>
          </div>

          {projectType === 'reklam' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('brandCategory')}</label>
              <select name="brand_category" defaultValue={editingPitch?.brand_category ?? ''} className="sb-input">
                <option value="">{t('noBrandCategory')}</option>
                {BRAND_CATEGORIES.map(k => <option key={k} value={k}>{tcl(`brandCategories.${k}`)}</option>)}
              </select>
              <p className="text-xs text-gray-400">{t('brandCategoryHint')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('expectedStart')}</label>
              <input type="date" name="expected_start_date" defaultValue={editingPitch?.expected_start_date ?? ''} className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('decisionDue')}</label>
              <input type="date" name="decision_due_date" defaultValue={editingPitch?.decision_due_date ?? ''} className="sb-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('estimatedValue')}</label>
              <input type="number" step="0.01" name="estimated_value" defaultValue={editingPitch?.estimated_value ?? ''} placeholder="0" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('owner')}</label>
              <select name="owner_id" defaultValue={editingPitch?.owner_id ?? ''} className="sb-input">
                <option value="">—</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          </div>

          <input type="hidden" name="currency" value={editingPitch?.currency ?? 'TRY'} />

          {stage === 'kaybedildi' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('lostReason')}</label>
              <input name="lost_reason" defaultValue={editingPitch?.lost_reason ?? ''} placeholder={t('lostReasonPlaceholder')} className="sb-input" />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea name="notes" defaultValue={editingPitch?.notes ?? ''} rows={3} placeholder={t('notesPlaceholder')} className="sb-input resize-none w-full" />
          </div>

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={editingPitch ? t('update') : t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
