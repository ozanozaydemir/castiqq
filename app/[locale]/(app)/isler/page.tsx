import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Link } from '@/i18n/navigation'
import { Briefcase } from 'lucide-react'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { IslerFilters } from './IslerFilters'
import { IslerRowActions } from './IslerRowActions'
import type { Booking } from '@/types/database'

const PAGE_SIZE = 25

type SearchParams = { q?: string; status?: string; page?: string }
type BookingRow = Booking & { talent: { full_name: string } | null }

const JOB_TYPE_KEYS: Record<string, string> = {
  dizi: 'jobTypes.dizi', reklam: 'jobTypes.reklam', film: 'jobTypes.film',
  sunuculuk: 'jobTypes.sunuculuk', seslendirme: 'jobTypes.seslendirme',
  etkinlik: 'jobTypes.etkinlik', diger: 'jobTypes.diger',
}

async function IslerTable({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const t = await getTranslations('talent.bookings')
  const jt = await getTranslations('jobs')

  let query = supabase
    .from('bookings')
    .select('*, talent(full_name)')
    .order('work_date', { ascending: false })

  if (searchParams.status) query = query.eq('payment_status', searchParams.status)

  const { data } = await query as { data: BookingRow[] | null }
  let list = data ?? []

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    list = list.filter(b =>
      b.client_name.toLowerCase().includes(q) ||
      (b.talent?.full_name ?? '').toLowerCase().includes(q) ||
      (b.title ?? '').toLowerCase().includes(q)
    )
  }

  const page = Math.max(1, Number(searchParams.page) || 1)
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const pageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (list.length === 0) {
    return (
      <div className="sb-card flex flex-col items-center justify-center py-16 text-center">
        <Briefcase className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">{t('empty')}</p>
      </div>
    )
  }

  return (
    <div className="sb-card overflow-hidden">
      <table className="sb-table">
        <thead>
          <tr>
            <th>{t('colTalent')}</th>
            <th>{t('clientName')}</th>
            <th>{t('jobType')}</th>
            <th>{t('workDate')}</th>
            <th>{t('grossAmount')}</th>
            <th>{t('commission')}</th>
            <th className="text-right">{t('paymentStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {pageList.map(b => {
            const today = new Date().toISOString().split('T')[0]
            const overdue = b.payment_status !== 'paid' && b.payment_due_date !== null && b.payment_due_date < today
            return (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="relative">
                  <Link href={`/oyuncular/${b.talent_id}`} className="font-medium text-gray-900 hover:text-indigo-600 after:absolute after:inset-0">
                    {b.talent?.full_name ?? '—'}
                  </Link>
                </td>
                <td className="text-gray-600">{b.client_name}{b.title && <span className="text-gray-400"> · {b.title}</span>}</td>
                <td className="text-gray-500">{t(JOB_TYPE_KEYS[b.job_type] ?? 'jobTypes.diger')}</td>
                <td className="text-gray-500">
                  {new Date(b.work_date).toLocaleDateString('tr-TR')}
                  {overdue && <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">{jt('overdueBadge')}</span>}
                </td>
                <td className="text-gray-700 font-medium">{b.gross_amount.toLocaleString('tr-TR')} {b.currency}</td>
                <td className="text-gray-500">{b.commission_amount !== null ? `${b.commission_amount.toLocaleString('tr-TR')} ${b.currency}` : '—'}</td>
                <td>
                  <IslerRowActions bookingId={b.id} talentId={b.talent_id} paymentStatus={b.payment_status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  )
}

export default async function IslerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const t = await getTranslations('jobs')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="p-6">
        <IslerFilters />
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <IslerTable searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}
