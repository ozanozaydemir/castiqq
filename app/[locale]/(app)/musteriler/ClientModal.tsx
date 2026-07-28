'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, Building2, Banknote, Handshake } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/clients'
import type { Client } from '@/types/database'
import { BRAND_CATEGORIES, INDUSTRY_SEGMENTS, PAYMENT_TERMS } from '@/lib/crm'

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

/** Çoklu seçim — aynı name ile birden fazla checkbox, action tarafında getAll ile diziye dönüyor. */
function CheckboxGroup({
  name, options, labels, defaultValue,
}: {
  name: string
  options: readonly string[]
  labels: (k: string) => string
  defaultValue: string[]
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue)
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const on = selected.includes(opt)
        return (
          <label
            key={opt}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
              on
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={opt}
              defaultChecked={on}
              onChange={e => setSelected(s => e.target.checked ? [...s, opt] : s.filter(x => x !== opt))}
              className="sr-only"
            />
            {labels(opt)}
          </label>
        )
      })}
    </div>
  )
}

const TABS = ['company', 'financial', 'relationship'] as const
type Tab = typeof TABS[number]

export function ClientModal({
  action,
  editingClient,
  teamMembers = [],
  allClients = [],
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingClient?: Client | null
  teamMembers?: { id: string; full_name: string }[]
  allClients?: { id: string; name: string }[]
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const [tab, setTab] = useState<Tab>('company')
  const t = useTranslations('clients')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  const TAB_META: Record<Tab, { label: string; icon: React.ReactNode }> = {
    company:      { label: t('companyInfo'),      icon: <Building2 className="w-3.5 h-3.5" /> },
    financial:    { label: t('financialInfo'),    icon: <Banknote className="w-3.5 h-3.5" /> },
    relationship: { label: t('relationshipInfo'), icon: <Handshake className="w-3.5 h-3.5" /> },
  }

  // Kendisini üst grup olarak seçemesin
  const parentOptions = allClients.filter(c => c.id !== editingClient?.id)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{editingClient ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form tek parça — sekmeler yalnızca görünürlüğü değiştiriyor ki
            gizli sekmedeki alanlar da submit edilsin. */}
        <form action={formAction} className="flex flex-col min-h-0 flex-1">
          <div className="flex gap-1 px-5 pt-4 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
            {TABS.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  tab === k
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {TAB_META[k].icon} {TAB_META[k].label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* ── Kurumsal ── */}
            <div className={tab === 'company' ? 'space-y-4' : 'hidden'}>
              <Field label={`${t('name')} *`}>
                <input name="name" required defaultValue={editingClient?.name ?? ''} placeholder={t('namePlaceholder')} className="sb-input" autoFocus />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('type')}>
                  <select name="client_type" defaultValue={editingClient?.client_type ?? 'diger'} className="sb-input">
                    {['yapim_sirketi', 'reklam_ajansi', 'marka', 'casting_ajansi', 'pr_ajansi', 'diger'].map(k => (
                      <option key={k} value={k}>{t(`types.${k}`)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('tier')}>
                  <select name="tier" defaultValue={editingClient?.tier ?? 'tier_3'} className="sb-input">
                    {['tier_1', 'tier_2', 'tier_3'].map(k => (
                      <option key={k} value={k}>{t(`tiers.${k}`)}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={t('industrySegments')}>
                <CheckboxGroup
                  name="industry_segments"
                  options={INDUSTRY_SEGMENTS}
                  labels={k => t(`segments.${k}`)}
                  defaultValue={editingClient?.industry_segments ?? []}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('parentClient')}>
                  <select name="parent_client_id" defaultValue={editingClient?.parent_client_id ?? ''} className="sb-input">
                    <option value="">{t('noParent')}</option>
                    {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label={t('website')}>
                  <input name="website" defaultValue={editingClient?.website ?? ''} placeholder="https://" className="sb-input" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('phone')}>
                  <input name="phone" defaultValue={editingClient?.phone ?? ''} placeholder="+90 532 000 00 00" className="sb-input" />
                </Field>
                <Field label={t('email')}>
                  <input type="email" name="email" defaultValue={editingClient?.email ?? ''} placeholder="iletisim@yapim.com" className="sb-input" />
                </Field>
              </div>

              <Field label={t('address')}>
                <input name="address" defaultValue={editingClient?.address ?? ''} placeholder="Levent, İstanbul" className="sb-input" />
              </Field>

              <Field label={t('notes')}>
                <textarea name="notes" defaultValue={editingClient?.notes ?? ''} rows={2} placeholder={t('notesPlaceholder')} className="sb-input resize-none w-full" />
              </Field>
            </div>

            {/* ── Finans ── */}
            <div className={tab === 'financial' ? 'space-y-4' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('taxOffice')}>
                  <input name="tax_office" defaultValue={editingClient?.tax_office ?? ''} placeholder="Beşiktaş V.D." className="sb-input" />
                </Field>
                <Field label={t('taxNumber')}>
                  <input name="tax_number" defaultValue={editingClient?.tax_number ?? ''} placeholder="1234567890" className="sb-input" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('paymentTerms')}>
                  <select name="payment_terms" defaultValue={editingClient?.payment_terms ?? 'net_30'} className="sb-input">
                    {PAYMENT_TERMS.map(k => (
                      <option key={k} value={k}>{t(`paymentTermsOptions.${k}`)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('paymentRating')}>
                  <select name="payment_rating" defaultValue={editingClient?.payment_rating ?? 'belirsiz'} className="sb-input">
                    {['belirsiz', 'guvenilir', 'gecikmeli', 'riskli'].map(k => (
                      <option key={k} value={k}>{t(`paymentRatings.${k}`)}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('creditLimit')} hint={t('creditLimitHint')}>
                  <input type="number" step="0.01" name="credit_limit" defaultValue={editingClient?.credit_limit ?? ''} placeholder="0" className="sb-input" />
                </Field>
                <Field label={t('billingEmail')}>
                  <input type="email" name="billing_email" defaultValue={editingClient?.billing_email ?? ''} placeholder="muhasebe@yapim.com" className="sb-input" />
                </Field>
              </div>
            </div>

            {/* ── İlişki ── */}
            <div className={tab === 'relationship' ? 'space-y-4' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('accountManager')}>
                  <select name="account_manager_id" defaultValue={editingClient?.account_manager_id ?? ''} className="sb-input">
                    <option value="">{t('unassigned')}</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </Field>
                <Field label={t('workingStatus')}>
                  <select name="working_status" defaultValue={editingClient?.working_status ?? 'aktif'} className="sb-input">
                    {['aktif', 'potansiyel', 'gecmis', 'kara_liste'].map(k => (
                      <option key={k} value={k}>{t(`workingStatuses.${k}`)}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={t('budgetRange')}>
                <select name="budget_range" defaultValue={editingClient?.budget_range ?? ''} className="sb-input">
                  <option value="">{t('notSet')}</option>
                  {['dusuk', 'orta', 'premium'].map(k => (
                    <option key={k} value={k}>{t(`budgetRanges.${k}`)}</option>
                  ))}
                </select>
              </Field>

              <Field label={t('exclusivityCategories')} hint={t('exclusivityHint')}>
                <CheckboxGroup
                  name="exclusivity_categories"
                  options={BRAND_CATEGORIES}
                  labels={k => t(`brandCategories.${k}`)}
                  defaultValue={editingClient?.exclusivity_categories ?? []}
                />
              </Field>

              <Field label={t('preferredPitchStyles')}>
                <textarea
                  name="preferred_pitch_styles"
                  defaultValue={editingClient?.preferred_pitch_styles ?? ''}
                  rows={2}
                  placeholder={t('preferredPitchStylesPlaceholder')}
                  className="sb-input resize-none w-full"
                />
              </Field>
            </div>

            {state?.error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                {state.error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 flex-shrink-0">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={editingClient ? t('update') : t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
