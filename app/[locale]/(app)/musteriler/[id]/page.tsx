import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, Phone, Mail, User, Briefcase } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { InteractionsSection, type InteractionRow } from './InteractionsSection'
import { ClientEditButton } from './ClientEditButton'
import type { Booking } from '@/types/database'

export default async function MusteriDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('clients')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const TYPE_LABELS: Record<string, string> = {
    yapim_sirketi: t('types.yapim_sirketi'), reklam_ajansi: t('types.reklam_ajansi'),
    marka: t('types.marka'), diger: t('types.diger'),
  }

  const [{ data: bookings }, { data: interactionsRaw }, { data: talents }] = await Promise.all([
    supabase.from('bookings').select('*, talent(full_name)').eq('client_id', id).order('work_date', { ascending: false }) as Promise<{ data: (Booking & { talent: { full_name: string } | null })[] | null }>,
    supabase.from('client_interactions').select('*, talent(full_name)').eq('client_id', id).order('interaction_date', { ascending: false }) as Promise<{ data: InteractionRow[] | null }>,
    supabase.from('talent').select('id, full_name').order('full_name') as Promise<{ data: { id: string; full_name: string }[] | null }>,
  ])

  const bookingList = bookings ?? []
  const interactions = interactionsRaw ?? []

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <Link href="/musteriler" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('title')}
        </Link>
        <ClientEditButton client={client} />
      </div>

      <div className="px-6 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{TYPE_LABELS[client.client_type] ?? client.client_type}</span>
          {client.contact_name && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{client.contact_name}</span>}
          {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-gray-700"><Phone className="w-3.5 h-3.5" />{client.phone}</a>}
          {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-gray-700"><Mail className="w-3.5 h-3.5" />{client.email}</a>}
        </div>
        {client.notes && <p className="text-sm text-gray-500 mt-3 whitespace-pre-line">{client.notes}</p>}
      </div>

      <div className="px-6 pb-8 columns-1 lg:columns-2 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
        <div className="sb-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('bookingHistory')}</h3>
          </div>
          {bookingList.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('noBookings')}</p>
          ) : (
            <div className="space-y-2">
              {bookingList.map(b => (
                <div key={b.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <Link href={`/oyuncular/${b.talent_id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">
                    {b.talent?.full_name ?? '—'}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(b.work_date).toLocaleDateString('tr-TR')} · {b.gross_amount.toLocaleString('tr-TR')} {b.currency}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <InteractionsSection clientId={client.id} interactions={interactions} talents={talents ?? []} />
      </div>
    </div>
  )
}
