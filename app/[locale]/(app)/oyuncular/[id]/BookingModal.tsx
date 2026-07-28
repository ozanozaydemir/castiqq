'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, TriangleAlert } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/bookings'
import type { Booking, BrandCategory } from '@/types/database'
import { BRAND_CATEGORIES } from '@/lib/crm'

type ExistingBookingRow = {
  id: string; client_name: string; work_date: string; work_date_end: string | null
  job_type: string; is_ongoing: boolean; exclusivity_end_date: string | null; exclusivity_notes: string | null
  exclusivity_category: BrandCategory | null
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && aEnd >= bStart
}

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

export function BookingModal({
  action,
  editingBooking,
  talentId,
  clients = [],
  birthYear,
  talentEmail,
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingBooking?: Booking | null
  talentId: string
  clients?: { id: string; name: string }[]
  birthYear?: number | null
  talentEmail?: string | null
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const t = useTranslations('talent.bookings')
  const tc = useTranslations('common')
  // Marka kategorisi sözlükleri teklif/müşteri taraflarıyla ortak.
  const tp = useTranslations('pitches')
  const tcl = useTranslations('clients')

  const isMinor = !!birthYear && (new Date().getFullYear() - birthYear) < 18
  const [hasValidWorkPermit, setHasValidWorkPermit] = useState<boolean | null>(null)

  const [jobType, setJobType] = useState<string>(editingBooking?.job_type ?? 'dizi')
  const [workDate, setWorkDate] = useState(editingBooking?.work_date ?? '')
  const [workDateEnd, setWorkDateEnd] = useState(editingBooking?.work_date_end ?? '')
  const [isOngoing, setIsOngoing] = useState(editingBooking?.is_ongoing ?? false)
  const [grossAmount, setGrossAmount] = useState(editingBooking?.gross_amount?.toString() ?? '')
  const [withholdingRate, setWithholdingRate] = useState(editingBooking?.withholding_rate?.toString() ?? '')
  const [paymentStatus, setPaymentStatus] = useState<string>(editingBooking?.payment_status ?? 'pending')
  const [amountPaid, setAmountPaid] = useState(editingBooking?.amount_paid?.toString() ?? '')
  const [paymentFlow, setPaymentFlow] = useState<string>(editingBooking?.payment_flow ?? 'client_to_agency')

  const [brandCategory, setBrandCategory] = useState<string>(editingBooking?.exclusivity_category ?? '')

  const [dateConflicts, setDateConflicts] = useState<ExistingBookingRow[]>([])
  const [exclusivityConflicts, setExclusivityConflicts] = useState<ExistingBookingRow[]>([])
  const [ongoingEngagements, setOngoingEngagements] = useState<ExistingBookingRow[]>([])

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  useEffect(() => {
    let cancelled = false

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    supabase
      .from('bookings')
      .select('id, client_name, work_date, work_date_end, job_type, is_ongoing, exclusivity_end_date, exclusivity_notes, exclusivity_category')
      .eq('talent_id', talentId)
      .then(({ data }) => {
        if (cancelled || !data) return
        const rows = (data as ExistingBookingRow[]).filter(b => b.id !== editingBooking?.id)

        setOngoingEngagements(rows.filter(b => b.is_ongoing))

        if (!workDate) { setDateConflicts([]); setExclusivityConflicts([]); return }
        const end = workDateEnd || workDate

        setDateConflicts(rows.filter(b => !b.is_ongoing && rangesOverlap(workDate, end, b.work_date, b.work_date_end || b.work_date)))
        // Yasak yalnızca aynı marka kategorisinde anlamlı: bir banka reklamı
        // başka bir banka reklamını engeller, otomotivi engellemez. Kategori
        // seçilmemiş eski kayıtlar için eski davranış (tarih bazlı) korunuyor.
        setExclusivityConflicts(rows.filter(b => {
          if (!b.exclusivity_end_date) return false
          if (!(b.work_date <= workDate && workDate <= b.exclusivity_end_date)) return false
          if (brandCategory && b.exclusivity_category) return b.exclusivity_category === brandCategory
          return true
        }))
      })

    return () => { cancelled = true }
  }, [workDate, workDateEnd, talentId, editingBooking?.id, brandCategory])

  useEffect(() => {
    if (!isMinor) return
    let cancelled = false
    const today = new Date().toISOString().split('T')[0]

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    supabase
      .from('talent_documents')
      .select('expiry_date')
      .eq('talent_id', talentId)
      .eq('document_type', 'calisma_izni')
      .then(({ data }) => {
        if (cancelled || !data) return
        setHasValidWorkPermit(data.some(d => !d.expiry_date || d.expiry_date >= today))
      })

    return () => { cancelled = true }
  }, [isMinor, talentId])

  const gross = Number(grossAmount) || 0
  const rate = Number(withholdingRate) || 0
  const netAmount = Math.round((gross - gross * (rate / 100)) * 100) / 100

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingBooking ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          {isMinor && (
            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs ${
              hasValidWorkPermit === false ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-blue-50 border border-blue-100 text-blue-700'
            }`}>
              <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <p>{hasValidWorkPermit === false ? t('minorNoPermitWarning') : t('minorReminder')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('clientName')} <span className="text-red-400">*</span></label>
              <input name="client_name" required defaultValue={editingBooking?.client_name ?? ''} placeholder={t('clientNamePlaceholder')} className="sb-input" autoFocus list="client-name-options" />
              <datalist id="client-name-options">
                {clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('jobType')}</label>
              <select name="job_type" value={jobType} onChange={e => setJobType(e.target.value)} className="sb-input">
                <option value="dizi">{t('jobTypes.dizi')}</option>
                <option value="reklam">{t('jobTypes.reklam')}</option>
                <option value="film">{t('jobTypes.film')}</option>
                <option value="sunuculuk">{t('jobTypes.sunuculuk')}</option>
                <option value="seslendirme">{t('jobTypes.seslendirme')}</option>
                <option value="etkinlik">{t('jobTypes.etkinlik')}</option>
                <option value="diger">{t('jobTypes.diger')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('title')}</label>
              <input name="title" defaultValue={editingBooking?.title ?? ''} placeholder={t('titlePlaceholder')} className="sb-input" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('workDate')} <span className="text-red-400">*</span></label>
              <input type="date" name="work_date" required value={workDate} onChange={e => setWorkDate(e.target.value)} className="sb-input" />
            </div>
            {isOngoing ? (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">{t('workDateEnd')}</label>
                <div className="sb-input bg-gray-50 text-gray-400 flex items-center">{t('ongoingNoEndDate')}</div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">{t('workDateEnd')}</label>
                <input type="date" name="work_date_end" value={workDateEnd} onChange={e => setWorkDateEnd(e.target.value)} className="sb-input" />
              </div>
            )}

            {jobType === 'dizi' && (
              <label className="sm:col-span-2 flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  name="is_ongoing"
                  checked={isOngoing}
                  onChange={e => setIsOngoing(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                />
                {t('isOngoing')}
              </label>
            )}

            {ongoingEngagements.length > 0 && (
              <div className="sm:col-span-2 flex items-start gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2.5 rounded-xl text-xs">
                <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t('ongoingEngagementsTitle')}</p>
                  {ongoingEngagements.map((c, i) => (
                    <p key={i}>{c.client_name} — {t('ongoingSince', { date: new Date(c.work_date).toLocaleDateString('tr-TR') })}</p>
                  ))}
                </div>
              </div>
            )}

            {dateConflicts.length > 0 && (
              <div className="sm:col-span-2 flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-2.5 rounded-xl text-xs">
                <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t('conflictWarning')}</p>
                  {dateConflicts.map((c, i) => (
                    <p key={i}>{c.client_name} — {new Date(c.work_date).toLocaleDateString('tr-TR')}{c.work_date_end ? `–${new Date(c.work_date_end).toLocaleDateString('tr-TR')}` : ''}</p>
                  ))}
                </div>
              </div>
            )}

            {exclusivityConflicts.length > 0 && (
              <div className="sm:col-span-2 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2.5 rounded-xl text-xs">
                <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t('exclusivityConflictWarning')}</p>
                  {exclusivityConflicts.map((c, i) => (
                    <p key={i}>{c.client_name} — {t('exclusivityUntil', { date: new Date(c.exclusivity_end_date!).toLocaleDateString('tr-TR') })}{c.exclusivity_notes ? ` (${c.exclusivity_notes})` : ''}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('grossAmount')} <span className="text-red-400">*</span></label>
              <input type="number" name="gross_amount" required min={0} step="0.01" value={grossAmount} onChange={e => setGrossAmount(e.target.value)} placeholder="0" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('currency')}</label>
              <select name="currency" defaultValue={editingBooking?.currency ?? 'TRY'} className="sb-input">
                <option value="TRY">TRY — Türk Lirası</option>
                <option value="USD">USD — Dolar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('withholdingRate')}</label>
              <input type="number" name="withholding_rate" min={0} max={100} step="0.1" value={withholdingRate} onChange={e => setWithholdingRate(e.target.value)} placeholder="0" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('netAmount')}</label>
              <div className="sb-input bg-gray-50 text-gray-600 flex items-center">{netAmount.toLocaleString('tr-TR')}</div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('paymentFlow')}</label>
              <select name="payment_flow" value={paymentFlow} onChange={e => setPaymentFlow(e.target.value)} className="sb-input">
                <option value="client_to_agency">{t('paymentFlows.clientToAgency')}</option>
                <option value="client_to_talent">{t('paymentFlows.clientToTalent')}</option>
              </select>
              <p className="text-xs text-gray-400">{paymentFlow === 'client_to_agency' ? t('paymentFlowHintAgency') : t('paymentFlowHintTalent')}</p>
            </div>

            {paymentFlow === 'client_to_talent' && (
              <label className="sm:col-span-2 flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  name="commission_collected"
                  defaultChecked={editingBooking?.commission_collected ?? false}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                />
                {t('commissionCollected')}
              </label>
            )}

            {jobType === 'reklam' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">{tp('brandCategory')}</label>
                  <select name="exclusivity_category" value={brandCategory} onChange={e => setBrandCategory(e.target.value)} className="sb-input">
                    <option value="">{tp('noBrandCategory')}</option>
                    {BRAND_CATEGORIES.map(k => <option key={k} value={k}>{tcl(`brandCategories.${k}`)}</option>)}
                  </select>
                  <p className="text-xs text-gray-400">{tp('brandCategoryHint')}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">{t('exclusivityEndDate')}</label>
                  <input type="date" name="exclusivity_end_date" defaultValue={editingBooking?.exclusivity_end_date ?? ''} className="sb-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">{t('exclusivityNotes')}</label>
                  <input name="exclusivity_notes" defaultValue={editingBooking?.exclusivity_notes ?? ''} placeholder={t('exclusivityNotesPlaceholder')} className="sb-input" />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('paymentDueDate')}</label>
              <input type="date" name="payment_due_date" defaultValue={editingBooking?.payment_due_date ?? ''} className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('paymentStatus')}</label>
              <select name="payment_status" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="sb-input">
                <option value="pending">{t('paymentStatuses.pending')}</option>
                <option value="partial">{t('paymentStatuses.partial')}</option>
                <option value="paid">{t('paymentStatuses.paid')}</option>
              </select>
            </div>

            {paymentStatus !== 'pending' && (
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">{t('amountPaid')}</label>
                <input type="number" name="amount_paid" min={0} step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                  placeholder={paymentStatus === 'paid' ? netAmount.toString() : '0'} className="sb-input" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea name="notes" defaultValue={editingBooking?.notes ?? ''} rows={2} placeholder={t('notesPlaceholder')} className="sb-input resize-none w-full" />
          </div>

          {!isOngoing && (
            <p className="text-xs text-gray-400">
              {talentEmail ? t('calendarInviteHint', { email: talentEmail }) : t('calendarInviteMissingEmail')}
            </p>
          )}

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={editingBooking ? t('update') : t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
