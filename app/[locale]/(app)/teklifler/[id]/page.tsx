import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, Building2, Calendar, Banknote, User, AlertTriangle, FileText } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PitchItemsSection, type PitchItemRow } from './PitchItemsSection'
import { PitchEditButton } from './PitchEditButton'
import { findExclusivityConflicts, PITCH_STAGE_STYLES, assessClientRisk, type ExclusivityConflict } from '@/lib/crm'
import type { Pitch, PitchItem, Client, Booking } from '@/types/database'

export default async function TeklifDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('pitches')
  const tcl = await getTranslations('clients')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const { data: pitchRaw } = await supabase.from('pitches').select('*').eq('id', id).single()
  if (!pitchRaw) notFound()
  const pitch = pitchRaw as Pitch

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: clientRaw }, { data: itemsRaw }, { data: talents },
    { data: allClients }, { data: members }, { data: owner },
    { data: clientBookings }, { data: exclusivityBookings },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', pitch.client_id).single(),
    supabase.from('pitch_items').select('*, talent(full_name)').eq('pitch_id', id).order('created_at') as Promise<{
      data: (PitchItem & { talent: { full_name: string } | null })[] | null
    }>,
    supabase.from('talent').select('id, full_name').order('full_name') as Promise<{ data: { id: string; full_name: string }[] | null }>,
    supabase.from('clients').select('id, name').order('name') as Promise<{ data: { id: string; name: string }[] | null }>,
    supabase.from('profiles').select('id, full_name').order('full_name') as Promise<{ data: { id: string; full_name: string }[] | null }>,
    pitch.owner_id
      ? supabase.from('profiles').select('full_name').eq('id', pitch.owner_id).single()
      : Promise.resolve({ data: null }),
    // Müşterinin finansal riski — teklif verirken görünmesi gereken bilgi
    supabase.from('bookings')
      .select('net_amount, amount_paid, currency, payment_status, payment_due_date')
      .eq('client_id', pitch.client_id) as Promise<{ data: Booking[] | null }>,
    // Reklam yasağı kontrolü için, bu kategoride hâlâ süren tüm işler
    pitch.brand_category
      ? supabase.from('bookings')
          .select('id, talent_id, client_name, exclusivity_category, exclusivity_end_date')
          .eq('exclusivity_category', pitch.brand_category)
          .gte('exclusivity_end_date', today)
      : Promise.resolve({ data: [] }),
  ])

  const client = clientRaw as Client | null
  const items: PitchItemRow[] = (itemsRaw ?? []).map(i => ({
    ...i,
    talentName: i.talent?.full_name ?? '—',
  }))

  // Her oyuncu için bu kategorideki aktif yasakları önceden hesapla —
  // hem listede rozet, hem oyuncu eklerken uyarı olarak kullanılıyor.
  const conflictsByTalent: Record<string, ExclusivityConflict[]> = {}
  const exBookings = (exclusivityBookings ?? []) as Pick<Booking, 'id' | 'talent_id' | 'client_name' | 'exclusivity_category' | 'exclusivity_end_date'>[]
  for (const tal of talents ?? []) {
    const c = findExclusivityConflicts(exBookings, tal.id, pitch.brand_category, today)
    if (c.length > 0) conflictsByTalent[tal.id] = c
  }

  const risk = client ? assessClientRisk(client, clientBookings ?? [], today) : null

  const overdue = pitch.decision_due_date !== null && pitch.decision_due_date < today
    && pitch.stage !== 'kazanildi' && pitch.stage !== 'kaybedildi'

  function money(n: number, currency: string) {
    return `${n.toLocaleString('tr-TR')} ${currency}`
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <Link href="/teklifler" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('backToList')}
        </Link>
        <PitchEditButton pitch={pitch} clients={allClients ?? []} teamMembers={members ?? []} />
      </div>

      {/* Hero */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{pitch.title}</h1>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full mt-1.5 ${PITCH_STAGE_STYLES[pitch.stage]}`}>
            {t(`stages.${pitch.stage}`)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-gray-500">
          {client && (
            <Link href={`/musteriler/${client.id}`} className="flex items-center gap-1 hover:text-indigo-600 font-medium">
              <Building2 className="w-3.5 h-3.5" />{client.name}
            </Link>
          )}
          <span>{t(`projectTypes.${pitch.project_type}`)}</span>
          {pitch.brand_category && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
              {tcl(`brandCategories.${pitch.brand_category}`)}
            </span>
          )}
          {pitch.estimated_value !== null && (
            <span className="flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />{money(Number(pitch.estimated_value), pitch.currency)}
            </span>
          )}
          {pitch.expected_start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />{new Date(pitch.expected_start_date).toLocaleDateString('tr-TR')}
            </span>
          )}
          {owner && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{owner.full_name}</span>}
        </div>

        {pitch.decision_due_date && (
          <p className={`flex items-center gap-1.5 text-sm mt-2 ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            {overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
            {t('decisionDue')}: {new Date(pitch.decision_due_date).toLocaleDateString('tr-TR')}
            {overdue && ` — ${t('decisionOverdue')}`}
          </p>
        )}
      </div>

      {/* Müşteri finansal riski — oyuncu önermeden önce görülmesi gereken uyarı */}
      {risk?.shouldWarn && client && (
        <div className="px-6 mb-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-700">{tcl('risk.warnTitle')}</p>
              <ul className="mt-1 space-y-0.5 text-red-600">
                {client.working_status === 'kara_liste' && <li>{tcl('risk.warnBlacklisted')}</li>}
                {client.payment_rating === 'riskli' && <li>{tcl('risk.warnHighRisk')}</li>}
                {risk.overdueCount > 0 && <li>{tcl('risk.warnOverdue', { count: risk.overdueCount })}</li>}
                {risk.overCreditLimit && <li>{tcl('risk.warnOverLimit')}</li>}
              </ul>
              <p className="mt-1.5 text-red-500 font-medium">{tcl('risk.warnAction')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-8 columns-1 lg:columns-2 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
        <PitchItemsSection
          pitchId={pitch.id}
          items={items}
          talents={talents ?? []}
          brandCategory={pitch.brand_category}
          conflictsByTalent={conflictsByTalent}
        />

        {(pitch.notes || pitch.lost_reason || client?.preferred_pitch_styles) && (
          <div className="sb-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">{t('notes')}</h3>
            </div>
            {client?.preferred_pitch_styles && (
              <div className="mb-3 pb-3 border-b border-gray-50">
                <p className="text-xs text-gray-400 mb-1">{tcl('preferredPitchStyles')}</p>
                <p className="text-sm text-gray-600">{client.preferred_pitch_styles}</p>
              </div>
            )}
            {pitch.lost_reason && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">{t('lostReason')}</p>
                <p className="text-sm text-red-500">{pitch.lost_reason}</p>
              </div>
            )}
            {pitch.notes && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{pitch.notes}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
