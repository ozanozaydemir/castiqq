import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { getTranslations } from 'next-intl/server'
import { ClientsListClient, type ClientWithStats } from './ClientsListClient'
import type { Client, Booking, ClientContact } from '@/types/database'

export default async function MusterilerPage() {
  const supabase = await createClient()
  const t = await getTranslations('clients')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: clients }, { data: bookings }, { data: contacts }, { data: members }] = await Promise.all([
    supabase.from('clients').select('*').order('name') as Promise<{ data: Client[] | null }>,
    supabase.from('bookings')
      .select('client_id, net_amount, amount_paid, currency, work_date, payment_status, payment_due_date') as Promise<{
        data: Pick<Booking, 'client_id' | 'net_amount' | 'amount_paid' | 'currency' | 'work_date' | 'payment_status' | 'payment_due_date'>[] | null
      }>,
    supabase.from('client_contacts').select('client_id, full_name, is_primary') as Promise<{
      data: Pick<ClientContact, 'client_id' | 'full_name' | 'is_primary'>[] | null
    }>,
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ])

  type Agg = {
    count: number
    totalNet: Record<string, number>
    lastWorkDate: string | null
    outstanding: number
    overdueCount: number
  }
  const byClient = new Map<string, Agg>()

  for (const b of bookings ?? []) {
    if (!b.client_id) continue
    const e = byClient.get(b.client_id)
      ?? { count: 0, totalNet: {}, lastWorkDate: null, outstanding: 0, overdueCount: 0 }
    e.count += 1
    e.totalNet[b.currency] = (e.totalNet[b.currency] ?? 0) + Number(b.net_amount)
    if (!e.lastWorkDate || b.work_date > e.lastWorkDate) e.lastWorkDate = b.work_date

    // Açık alacak = net tutar − tahsil edilen; listede TRY bazında özetliyoruz.
    if (b.payment_status !== 'paid') {
      const remaining = Number(b.net_amount) - Number(b.amount_paid)
      if (remaining > 0 && b.currency === 'TRY') e.outstanding += remaining
      if (b.payment_due_date !== null && b.payment_due_date < today) e.overdueCount += 1
    }
    byClient.set(b.client_id, e)
  }

  const primaryByClient = new Map<string, string>()
  for (const c of contacts ?? []) {
    if (c.is_primary) primaryByClient.set(c.client_id, c.full_name)
    else if (!primaryByClient.has(c.client_id)) primaryByClient.set(c.client_id, c.full_name)
  }

  const clientsWithStats: ClientWithStats[] = (clients ?? []).map(c => {
    const s = byClient.get(c.id)
    return {
      ...c,
      bookingCount: s?.count ?? 0,
      totalNet: s?.totalNet ?? {},
      lastWorkDate: s?.lastWorkDate ?? null,
      outstanding: s?.outstanding ?? 0,
      overdueCount: s?.overdueCount ?? 0,
      primaryContact: primaryByClient.get(c.id) ?? c.contact_name ?? null,
    }
  })

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="p-6">
        <ClientsListClient
          clients={clientsWithStats}
          teamMembers={(members ?? []) as { id: string; full_name: string }[]}
        />
      </div>
    </div>
  )
}
