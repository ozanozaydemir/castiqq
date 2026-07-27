import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, format, isSameMonth, isToday, parseISO,
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import type { Booking } from '@/types/database'

type SearchParams = { month?: string }
type BookingRow = Booking & { talent: { full_name: string } | null }

const PAYMENT_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  partial: 'bg-blue-400',
  paid: 'bg-green-400',
}

export default async function TakvimPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const t = await getTranslations('calendar')
  const locale = await getLocale()
  const dfLocale = locale === 'en' ? enUS : tr

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const currentMonth = params.month ? parseISO(`${params.month}-01`) : new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const prevMonth = format(subMonths(currentMonth, 1), 'yyyy-MM')
  const nextMonth = format(addMonths(currentMonth, 1), 'yyyy-MM')

  const gridStartStr = format(gridStart, 'yyyy-MM-dd')
  const gridEndStr = format(gridEnd, 'yyyy-MM-dd')

  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select('*, talent(full_name)')
    .lte('work_date', gridEndStr)
    .order('work_date') as { data: BookingRow[] | null }

  // work_date_end null ise tek günlük iş sayılır (is_ongoing hariç — o süresiz devam eder);
  // aralık gridEnd'den önce başlamış olmalı
  const bookings = (bookingsRaw ?? []).filter(b => b.is_ongoing || (b.work_date_end ?? b.work_date) >= gridStartStr)

  const bookingsByDay = new Map<string, BookingRow[]>()
  for (const day of days) {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayBookings = bookings.filter(b =>
      b.is_ongoing ? b.work_date <= dayStr : (b.work_date <= dayStr && (b.work_date_end ?? b.work_date) >= dayStr)
    )
    bookingsByDay.set(dayStr, dayBookings)
  }

  const weekDayLabels = eachDayOfInterval({ start: gridStart, end: endOfWeek(gridStart, { weekStartsOn: 1 }) })
    .map(d => format(d, 'EEEEEE', { locale: dfLocale }))

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: dfLocale })}
          </h2>
          <div className="flex items-center gap-2">
            <Link href={`/takvim?month=${prevMonth}`} className="w-8 h-8 rounded-lg border border-gray-200 hover:border-indigo-300 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link href="/takvim" className="px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-600 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
              {t('today')}
            </Link>
            <Link href={`/takvim?month=${nextMonth}`} className="w-8 h-8 rounded-lg border border-gray-200 hover:border-indigo-300 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="sb-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDayLabels.map((label, i) => (
              <div key={i} className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const dayBookings = bookingsByDay.get(dayStr) ?? []
              const inMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)
              return (
                <div key={dayStr} className={`min-h-[100px] border-b border-r border-gray-50 p-1.5 ${inMonth ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <span className={`text-xs font-medium inline-flex items-center justify-center w-5 h-5 rounded-full ${
                    today ? 'bg-indigo-500 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayBookings.slice(0, 3).map(b => (
                      <Link
                        key={b.id}
                        href={`/oyuncular/${b.talent_id}`}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50 hover:bg-indigo-50 text-[10px] text-gray-600 hover:text-indigo-700 truncate transition-colors"
                        title={`${b.talent?.full_name ?? ''} — ${b.client_name}${b.is_ongoing ? ` (${t('legendOngoing')})` : ''}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.is_ongoing ? 'bg-purple-400' : PAYMENT_DOT[b.payment_status]}`} />
                        <span className="truncate">{b.talent?.full_name ?? '—'}</span>
                      </Link>
                    ))}
                    {dayBookings.length > 3 && (
                      <p className="text-[10px] text-gray-400 px-1.5">{t('more', { count: dayBookings.length - 3 })}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />{t('legendPending')}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />{t('legendPartial')}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />{t('legendPaid')}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" />{t('legendOngoing')}</span>
        </div>
      </div>
    </div>
  )
}
