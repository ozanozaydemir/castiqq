'use client'

import { useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { updateBookingPaymentStatus, deleteBooking } from '@/app/actions/bookings'

const PAYMENT_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
}

export function IslerRowActions({ bookingId, talentId, paymentStatus }: { bookingId: string; talentId: string; paymentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('talent.bookings')

  function handlePaymentChange(status: string) {
    startTransition(async () => { await updateBookingPaymentStatus(bookingId, talentId, status); router.refresh() })
  }

  function handleDelete() {
    startTransition(async () => { await deleteBooking(bookingId, talentId); router.refresh() })
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <select
        value={paymentStatus}
        disabled={isPending}
        onChange={e => handlePaymentChange(e.target.value)}
        className={`text-xs font-medium px-2 py-1 rounded-lg cursor-pointer appearance-none border disabled:opacity-60 ${PAYMENT_STYLES[paymentStatus]}`}
      >
        <option value="pending">{t('paymentStatuses.pending')}</option>
        <option value="partial">{t('paymentStatuses.partial')}</option>
        <option value="paid">{t('paymentStatuses.paid')}</option>
      </select>
      <button onClick={handleDelete} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
