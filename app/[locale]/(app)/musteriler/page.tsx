import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { getTranslations } from 'next-intl/server'
import { ClientsListClient, type ClientWithStats } from './ClientsListClient'
import type { Client, Booking } from '@/types/database'

export default async function MusterilerPage() {
  const supabase = await createClient()
  const t = await getTranslations('clients')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const [{ data: clients }, { data: bookings }] = await Promise.all([
    supabase.from('clients').select('*').order('name') as Promise<{ data: Client[] | null }>,
    supabase.from('bookings').select('client_id, net_amount, currency, work_date') as Promise<{ data: Pick<Booking, 'client_id' | 'net_amount' | 'currency' | 'work_date'>[] | null }>,
  ])

  const bookingsByClient = new Map<string, { count: number; totalNet: Record<string, number>; lastWorkDate: string | null }>()
  for (const b of bookings ?? []) {
    if (!b.client_id) continue
    const entry = bookingsByClient.get(b.client_id) ?? { count: 0, totalNet: {}, lastWorkDate: null }
    entry.count += 1
    entry.totalNet[b.currency] = (entry.totalNet[b.currency] ?? 0) + Number(b.net_amount)
    if (!entry.lastWorkDate || b.work_date > entry.lastWorkDate) entry.lastWorkDate = b.work_date
    bookingsByClient.set(b.client_id, entry)
  }

  const clientsWithStats: ClientWithStats[] = (clients ?? []).map(c => {
    const stats = bookingsByClient.get(c.id)
    return {
      ...c,
      bookingCount: stats?.count ?? 0,
      totalNet: stats?.totalNet ?? {},
      lastWorkDate: stats?.lastWorkDate ?? null,
    }
  })

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="p-6">
        <ClientsListClient clients={clientsWithStats} />
      </div>
    </div>
  )
}
