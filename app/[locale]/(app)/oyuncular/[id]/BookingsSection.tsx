'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, Briefcase, CalendarCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BookingModal } from './BookingModal'
import { createBooking, updateBooking, deleteBooking, updateBookingPaymentStatus } from '@/app/actions/bookings'
import type { Booking } from '@/types/database'

const PAYMENT_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('tr-TR')
}

export function BookingsSection({ talentId, bookings, clients = [], birthYear, talentEmail }: { talentId: string; bookings: Booking[]; clients?: { id: string; name: string }[]; birthYear?: number | null; talentEmail?: string | null }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Booking | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('talent.bookings')

  const JOB_TYPE_LABELS: Record<string, string> = {
    dizi: t('jobTypes.dizi'), reklam: t('jobTypes.reklam'), film: t('jobTypes.film'),
    sunuculuk: t('jobTypes.sunuculuk'), seslendirme: t('jobTypes.seslendirme'),
    etkinlik: t('jobTypes.etkinlik'), diger: t('jobTypes.diger'),
  }
  const today = new Date().toISOString().split('T')[0]

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(b: Booking) { setEditing(b); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteBooking(id, talentId); router.refresh() })
  }

  function handlePaymentChange(id: string, status: string) {
    startTransition(async () => { await updateBookingPaymentStatus(id, talentId, status); router.refresh() })
  }

  const boundCreate = createBooking.bind(null, talentId)
  const boundUpdate = editing ? updateBooking.bind(null, editing.id, talentId) : null

  return (
    <>
      <div className="sb-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('addBooking')}
          </button>
        </div>

        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t('empty')}</p>
        ) : (
          <div className="space-y-2">
            {bookings.map(b => {
              const overdue = b.payment_status !== 'paid' && b.payment_due_date !== null && b.payment_due_date < today
              return (
                <div key={b.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{b.client_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {JOB_TYPE_LABELS[b.job_type] ?? b.job_type}
                        {b.title && ` · ${b.title}`}
                        {' · '}{formatDate(b.work_date)}
                        {b.is_ongoing && (
                          <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">{t('ongoingBadge')}</span>
                        )}
                        {b.google_event_id && (
                          <CalendarCheck className="w-3 h-3 text-indigo-400 inline-block ml-1.5 align-text-bottom" aria-label={t('syncedToGoogle')} />
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(b)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5">
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">{b.gross_amount.toLocaleString('tr-TR')} {b.currency}</span>
                      {b.withholding_amount > 0 && (
                        <span className="text-gray-400"> · {t('netAmount')}: {b.net_amount.toLocaleString('tr-TR')} {b.currency}</span>
                      )}
                      {b.commission_amount !== null && (
                        <span className="text-gray-400"> · {t('commission')}: {b.commission_amount.toLocaleString('tr-TR')} {b.currency}</span>
                      )}
                      {b.payment_status !== 'pending' && (
                        <span className="text-gray-400"> · {t('amountPaid')}: {b.amount_paid.toLocaleString('tr-TR')} {b.currency}</span>
                      )}
                    </div>
                    <select
                      value={b.payment_status}
                      disabled={isPending}
                      onChange={e => handlePaymentChange(b.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg cursor-pointer appearance-none border disabled:opacity-60 ${PAYMENT_STYLES[b.payment_status]}`}
                    >
                      <option value="pending">{t('paymentStatuses.pending')}</option>
                      <option value="partial">{t('paymentStatuses.partial')}</option>
                      <option value="paid">{t('paymentStatuses.paid')}</option>
                    </select>
                  </div>
                  {overdue && (
                    <p className="text-xs text-red-500 font-medium mt-1.5">{t('overdue', { date: formatDate(b.payment_due_date) ?? '' })}</p>
                  )}
                  {!overdue && b.payment_due_date && b.payment_status !== 'paid' && (
                    <p className="text-xs text-gray-400 mt-1.5">{t('dueOn', { date: formatDate(b.payment_due_date) ?? '' })}</p>
                  )}
                  {b.exclusivity_end_date && b.exclusivity_end_date >= today && (
                    <p className="text-xs text-red-500 font-medium mt-1.5">{t('exclusivityUntil', { date: formatDate(b.exclusivity_end_date) ?? '' })}</p>
                  )}
                  {b.payment_flow === 'client_to_talent' && !b.commission_collected && (
                    <p className="text-xs text-amber-600 font-medium mt-1.5">{t('commissionNotCollected')}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <BookingModal
          action={editing && boundUpdate ? boundUpdate : boundCreate}
          editingBooking={editing}
          talentId={talentId}
          clients={clients}
          birthYear={birthYear}
          talentEmail={talentEmail}
          onClose={closeModal}
        />
      )}
    </>
  )
}
