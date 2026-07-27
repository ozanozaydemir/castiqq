import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Link } from '@/i18n/navigation'
import { Users, UserPlus, TriangleAlert, FileSignature, Banknote } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Booking } from '@/types/database'

export default async function GenelBakisPage() {
  const supabase = await createClient()
  const t = await getTranslations('agencyOverview')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase.from('profiles').select('full_name, organization_id').eq('id', user.id).single()
  const orgId = profile?.organization_id
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', orgId ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { count: talentCount },
    { count: availableCount },
    { count: busyCount },
    { data: recentTalents },
    { data: expiringContracts },
    { data: unpaidBookings },
    { data: expiringDocuments },
  ] = await Promise.all([
    supabase.from('talent').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!),
    supabase.from('talent').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('availability', 'available'),
    supabase.from('talent').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('availability', 'busy'),
    supabase.from('talent').select('id, full_name, city, availability, created_at').eq('organization_id', orgId!).order('created_at', { ascending: false }).limit(6) as Promise<{ data: { id: string; full_name: string; city: string | null; availability: string; created_at: string }[] | null }>,
    supabase.from('talent').select('id, full_name, representation_end_date').eq('organization_id', orgId!).not('representation_end_date', 'is', null).gte('representation_end_date', today).lte('representation_end_date', thirtyDaysLater).order('representation_end_date') as Promise<{ data: { id: string; full_name: string; representation_end_date: string }[] | null }>,
    supabase.from('bookings').select('*, talent(full_name)').neq('payment_status', 'paid').order('payment_due_date') as Promise<{ data: (Booking & { talent: { full_name: string } | null })[] | null }>,
    supabase.from('talent_documents').select('id, talent_id, document_type, expiry_date, talent(full_name)').eq('organization_id', orgId!).not('expiry_date', 'is', null).lte('expiry_date', thirtyDaysLater).order('expiry_date') as Promise<{ data: { id: string; talent_id: string; document_type: string; expiry_date: string; talent: { full_name: string } | null }[] | null }>,
  ])

  const AVAIL: Record<string, string> = { available: 'bg-green-400', busy: 'bg-amber-400', unavailable: 'bg-gray-300' }

  const unpaid = unpaidBookings ?? []
  const totalsByCurrency: Record<string, number> = {}
  let overdueCount = 0
  for (const b of unpaid) {
    totalsByCurrency[b.currency] = (totalsByCurrency[b.currency] ?? 0) + Number(b.gross_amount)
    if (b.payment_due_date && b.payment_due_date < today) overdueCount++
  }
  const overdueBookings = unpaid.filter(b => b.payment_due_date && b.payment_due_date < today).slice(0, 5)

  const contracts = expiringContracts ?? []
  const documents = expiringDocuments ?? []
  const td = await getTranslations('talent.documents')
  const DOC_TYPE_LABELS: Record<string, string> = {
    kimlik: td('types.kimlik'), saglik_raporu: td('types.saglik_raporu'), calisma_izni: td('types.calisma_izni'),
    pasaport: td('types.pasaport'), vize: td('types.vize'), veli_izni: td('types.veli_izni'), diger: td('types.diger'),
  }

  return (
    <div>
      <PageHeader
        title={profile?.full_name ? t('welcomeGreeting', { name: profile.full_name.split(' ')[0] }) : t('welcome')}
        description={t('subtitle')}
      />

      <div className="p-6 space-y-6">
        {/* Gecikmiş ödeme uyarısı */}
        {overdueCount > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <TriangleAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800 mb-1">{t('overdueTitle', { count: overdueCount })}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {overdueBookings.map(b => (
                  <Link key={b.id} href={`/oyuncular/${b.talent_id}`} className="text-xs text-red-700 hover:text-red-900 hover:underline">
                    {b.talent?.full_name ?? '—'} — {b.gross_amount.toLocaleString('tr-TR')} {b.currency}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sözleşme bitiş uyarısı */}
        {contracts.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <FileSignature className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-1">{t('contractsExpiringTitle', { count: contracts.length })}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {contracts.map(c => (
                  <Link key={c.id} href={`/oyuncular/${c.id}`} className="text-xs text-amber-700 hover:text-amber-900 hover:underline">
                    {c.full_name} — {new Date(c.representation_end_date).toLocaleDateString('tr-TR')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Belge süresi uyarısı */}
        {documents.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <FileSignature className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-1">{t('documentsExpiringTitle', { count: documents.length })}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {documents.map(d => (
                  <Link key={d.id} href={`/oyuncular/${d.talent_id}`} className="text-xs text-amber-700 hover:text-amber-900 hover:underline">
                    {d.talent?.full_name ?? '—'} — {DOC_TYPE_LABELS[d.document_type] ?? d.document_type} ({new Date(d.expiry_date).toLocaleDateString('tr-TR')})
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/oyuncular" className="sb-card p-5 hover:border-indigo-200 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{talentCount ?? 0}</div>
            <div className="text-sm text-gray-500 mt-0.5">{t('stats.totalRoster')}</div>
          </Link>
          <Link href="/oyuncular?availability=available" className="sb-card p-5 hover:border-indigo-200 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{availableCount ?? 0}</div>
            <div className="text-sm text-gray-500 mt-0.5">{t('stats.available')}</div>
          </Link>
          <Link href="/oyuncular?availability=busy" className="sb-card p-5 hover:border-indigo-200 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{busyCount ?? 0}</div>
            <div className="text-sm text-gray-500 mt-0.5">{t('stats.busy')}</div>
          </Link>
          <div className="sb-card p-5">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-3">
              <Banknote className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              {Object.keys(totalsByCurrency).length === 0
                ? '—'
                : Object.entries(totalsByCurrency).map(([cur, amt]) => `${amt.toLocaleString('tr-TR')} ${cur}`).join(' · ')}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{t('stats.pendingPayments')}</div>
          </div>
        </div>

        {/* Son eklenen oyuncular + hızlı erişim */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="sb-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{t('recentTalent')}</h2>
              <Link href="/oyuncular" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">{t('seeAll')}</Link>
            </div>
            {(recentTalents ?? []).length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-300">
                <Users className="w-6 h-6 mr-2" />
                <span className="text-sm">{t('noTalentYet')}</span>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {(recentTalents ?? []).map(tal => (
                  <li key={tal.id}>
                    <Link href={`/oyuncular/${tal.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${AVAIL[tal.availability] ?? 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 flex-1 truncate">{tal.full_name}</span>
                      {tal.city && <span className="text-xs text-gray-400 truncate max-w-[100px]">{tal.city}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sb-card p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('quickAccess')}</h2>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/oyuncular/yeni" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group">
                <UserPlus className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{t('addTalent')}</span>
              </Link>
              <Link href="/listeler" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group">
                <Users className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{t('viewLists')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
