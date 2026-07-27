'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/bookings'
import type { Booking } from '@/types/database'

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
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingBooking?: Booking | null
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const t = useTranslations('talent.bookings')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('clientName')} <span className="text-red-400">*</span></label>
              <input name="client_name" required defaultValue={editingBooking?.client_name ?? ''} placeholder={t('clientNamePlaceholder')} className="sb-input" autoFocus />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('jobType')}</label>
              <select name="job_type" defaultValue={editingBooking?.job_type ?? 'dizi'} className="sb-input">
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
              <input type="date" name="work_date" required defaultValue={editingBooking?.work_date ?? ''} className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('workDateEnd')}</label>
              <input type="date" name="work_date_end" defaultValue={editingBooking?.work_date_end ?? ''} className="sb-input" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('grossAmount')} <span className="text-red-400">*</span></label>
              <input type="number" name="gross_amount" required min={0} step="0.01" defaultValue={editingBooking?.gross_amount ?? ''} placeholder="0" className="sb-input" />
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
              <label className="block text-sm font-medium text-gray-700">{t('paymentDueDate')}</label>
              <input type="date" name="payment_due_date" defaultValue={editingBooking?.payment_due_date ?? ''} className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('paymentStatus')}</label>
              <select name="payment_status" defaultValue={editingBooking?.payment_status ?? 'pending'} className="sb-input">
                <option value="pending">{t('paymentStatuses.pending')}</option>
                <option value="partial">{t('paymentStatuses.partial')}</option>
                <option value="paid">{t('paymentStatuses.paid')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea name="notes" defaultValue={editingBooking?.notes ?? ''} rows={2} placeholder={t('notesPlaceholder')} className="sb-input resize-none w-full" />
          </div>

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
