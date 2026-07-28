import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import {
  ArrowLeft, Phone, Mail, Briefcase, Globe, MapPin, Building2,
  Banknote, AlertTriangle, TrendingUp, Target, User,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { InteractionsSection, type InteractionRow } from './InteractionsSection'
import { ContactsSection } from './ContactsSection'
import { ClientEditButton } from './ClientEditButton'
import { assessClientRisk, TIER_STYLES, PAYMENT_RATING_STYLES, WORKING_STATUS_STYLES, PITCH_STAGE_STYLES } from '@/lib/crm'
import type { Booking, Client, ClientContact, Pitch } from '@/types/database'

function Section({ title, icon, action, children }: {
  title: string
  icon: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="sb-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 min-w-0">{value}</span>
    </div>
  )
}

function money(n: number, currency = 'TRY') {
  return `${n.toLocaleString('tr-TR')} ${currency}`
}

export default async function MusteriDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('clients')
  const tp = await getTranslations('pitches')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const { data: clientRaw } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!clientRaw) notFound()
  const client = clientRaw as Client

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: bookings }, { data: interactionsRaw }, { data: talents },
    { data: contacts }, { data: pitches }, { data: manager }, { data: parent },
  ] = await Promise.all([
    supabase.from('bookings').select('*, talent(full_name)').eq('client_id', id).order('work_date', { ascending: false }) as Promise<{
      data: (Booking & { talent: { full_name: string } | null })[] | null
    }>,
    supabase.from('client_interactions').select('*, talent(full_name)').eq('client_id', id).order('interaction_date', { ascending: false }) as Promise<{ data: InteractionRow[] | null }>,
    supabase.from('talent').select('id, full_name').order('full_name') as Promise<{ data: { id: string; full_name: string }[] | null }>,
    supabase.from('client_contacts').select('*').eq('client_id', id)
      .order('is_primary', { ascending: false }).order('full_name') as Promise<{ data: ClientContact[] | null }>,
    supabase.from('pitches').select('*').eq('client_id', id).order('created_at', { ascending: false }) as Promise<{ data: Pitch[] | null }>,
    client.account_manager_id
      ? supabase.from('profiles').select('full_name').eq('id', client.account_manager_id).single()
      : Promise.resolve({ data: null }),
    client.parent_client_id
      ? supabase.from('clients').select('id, name').eq('id', client.parent_client_id).single()
      : Promise.resolve({ data: null }),
  ])

  const bookingList = bookings ?? []
  const interactions = interactionsRaw ?? []
  const contactList = contacts ?? []
  const pitchList = pitches ?? []

  const risk = assessClientRisk(client, bookingList, today)

  // ── Kaşe geçmişi: bu müşterinin oyuncu başına ödediği tutarlar ──
  // "Bu yapımevi X oyuncumuza daha önce ne ödedi?" sorusunun cevabı.
  const feeByTalent = new Map<string, { name: string; count: number; total: number; max: number; currency: string }>()
  for (const b of bookingList) {
    const key = b.talent_id
    const e = feeByTalent.get(key) ?? {
      name: b.talent?.full_name ?? '—', count: 0, total: 0, max: 0, currency: b.currency,
    }
    const gross = Number(b.gross_amount)
    e.count += 1
    e.total += gross
    if (gross > e.max) e.max = gross
    feeByTalent.set(key, e)
  }
  const feeHistory = [...feeByTalent.entries()]
    .map(([talentId, v]) => ({ talentId, ...v, avg: Math.round(v.total / v.count) }))
    .sort((a, b) => b.max - a.max)

  const openPitches = pitchList.filter(p => p.stage !== 'kazanildi' && p.stage !== 'kaybedildi')

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <Link href="/musteriler" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('title')}
        </Link>
        <ClientEditButton client={client} />
      </div>

      {/* Hero */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TIER_STYLES[client.tier]}`}>
              {t(`tiers.${client.tier}`)}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${WORKING_STATUS_STYLES[client.working_status]}`}>
              {t(`workingStatuses.${client.working_status}`)}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {t(`types.${client.client_type}`)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-gray-500">
          {parent && (
            <Link href={`/musteriler/${parent.id}`} className="flex items-center gap-1 hover:text-indigo-600">
              <Building2 className="w-3.5 h-3.5" />{parent.name}
            </Link>
          )}
          {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-gray-700"><Phone className="w-3.5 h-3.5" />{client.phone}</a>}
          {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-gray-700"><Mail className="w-3.5 h-3.5" />{client.email}</a>}
          {client.website && (
            <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600">
              <Globe className="w-3.5 h-3.5" />{client.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {client.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{client.address}</span>}
          {manager && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{manager.full_name}</span>}
        </div>

        {client.industry_segments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {client.industry_segments.map(s => (
              <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium">
                {t(`segments.${s}`)}
              </span>
            ))}
          </div>
        )}

        {client.notes && <p className="text-sm text-gray-500 mt-3 whitespace-pre-line">{client.notes}</p>}
      </div>

      {/* Teklif vermeden önce uyarı — riskin görülmediği yerde işe yaramaz,
          bu yüzden sayfanın en üstünde. */}
      {risk.shouldWarn && (
        <div className="px-6 mb-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-700">{t('risk.warnTitle')}</p>
              <ul className="mt-1 space-y-0.5 text-red-600">
                {client.working_status === 'kara_liste' && <li>{t('risk.warnBlacklisted')}</li>}
                {client.payment_rating === 'riskli' && <li>{t('risk.warnHighRisk')}</li>}
                {risk.overdueCount > 0 && <li>{t('risk.warnOverdue', { count: risk.overdueCount })}</li>}
                {risk.overCreditLimit && <li>{t('risk.warnOverLimit')}</li>}
              </ul>
              <p className="mt-1.5 text-red-500 font-medium">{t('risk.warnAction')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-8 columns-1 md:columns-2 xl:columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">

        {/* Finansal durum */}
        <Section title={t('risk.sectionTitle')} icon={<Banknote className="w-4 h-4" />}>
          <div>
            <MetaRow label={t('paymentTerms')} value={t(`paymentTermsOptions.${client.payment_terms}`)} />
            <MetaRow
              label={t('paymentRating')}
              value={
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PAYMENT_RATING_STYLES[client.payment_rating]}`}>
                  {t(`paymentRatings.${client.payment_rating}`)}
                </span>
              }
            />
            <MetaRow
              label={t('risk.outstanding')}
              value={
                Object.keys(risk.outstandingByCurrency).length === 0
                  ? <span className="text-gray-400">{t('risk.clean')}</span>
                  : Object.entries(risk.outstandingByCurrency)
                      .map(([cur, amt]) => money(amt, cur)).join(' · ')
              }
            />
            {risk.overdueCount > 0 && (
              <MetaRow
                label={t('risk.overdueCount')}
                value={<span className="text-red-600 font-medium">{risk.overdueCount} {t('risk.overdueUnit')}</span>}
              />
            )}
            <MetaRow label={t('creditLimit')} value={client.credit_limit !== null ? money(Number(client.credit_limit)) : null} />
            <MetaRow label={t('billingEmail')} value={client.billing_email} />
            <MetaRow label={t('taxOffice')} value={client.tax_office} />
            <MetaRow label={t('taxNumber')} value={client.tax_number} />
          </div>
        </Section>

        {/* İlişki & tercihler */}
        {(client.budget_range || client.preferred_pitch_styles || client.exclusivity_categories.length > 0) && (
          <Section title={t('relationshipInfo')} icon={<Target className="w-4 h-4" />}>
            <div>
              <MetaRow label={t('budgetRange')} value={client.budget_range ? t(`budgetRanges.${client.budget_range}`) : null} />
              <MetaRow label={t('preferredPitchStyles')} value={client.preferred_pitch_styles} />
            </div>
            {client.exclusivity_categories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1.5">{t('exclusivityCategories')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.exclusivity_categories.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                      {t(`brandCategories.${c}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Kişiler */}
        <ContactsSection clientId={client.id} contacts={contactList} />

        {/* Teklifler */}
        <Section
          title={tp('title')}
          icon={<Target className="w-4 h-4" />}
          action={
            <Link href="/teklifler" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              {tp('backToList')}
            </Link>
          }
        >
          {pitchList.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{tp('empty')}</p>
          ) : (
            <div className="space-y-2">
              {pitchList.slice(0, 8).map(p => (
                <Link
                  key={p.id}
                  href={`/teklifler/${p.id}`}
                  className="block p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 min-w-0 truncate">{p.title}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${PITCH_STAGE_STYLES[p.stage]}`}>
                      {tp(`stages.${p.stage}`)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tp(`projectTypes.${p.project_type}`)}
                    {p.estimated_value !== null && ` · ${money(Number(p.estimated_value), p.currency)}`}
                  </p>
                </Link>
              ))}
              {openPitches.length > 0 && (
                <p className="text-xs text-gray-400 pt-1">
                  {openPitches.length} {tp('openPitches').toLocaleLowerCase('tr')}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Kaşe geçmişi */}
        <Section title={t('feeHistory.sectionTitle')} icon={<TrendingUp className="w-4 h-4" />}>
          <p className="text-xs text-gray-400 -mt-2 mb-3">{t('feeHistory.hint')}</p>
          {feeHistory.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('feeHistory.empty')}</p>
          ) : (
            <div className="space-y-2">
              {feeHistory.map(f => (
                <div key={f.talentId} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <Link href={`/oyuncular/${f.talentId}`} className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate block">
                      {f.name}
                    </Link>
                    <p className="text-xs text-gray-400">{f.count} {t('feeHistory.jobs')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{money(f.max, f.currency)}</p>
                    <p className="text-xs text-gray-400">{t('feeHistory.avg')}: {money(f.avg, f.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* İş geçmişi */}
        <Section title={t('bookingHistory')} icon={<Briefcase className="w-4 h-4" />}>
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
                    {new Date(b.work_date).toLocaleDateString('tr-TR')} · {money(Number(b.gross_amount), b.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Etkileşim geçmişi */}
        <InteractionsSection
          clientId={client.id}
          interactions={interactions}
          talents={talents ?? []}
          contacts={contactList}
        />
      </div>
    </div>
  )
}
