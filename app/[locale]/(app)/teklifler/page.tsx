import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { getTranslations } from 'next-intl/server'
import { PipelineBoard, type PitchWithMeta } from './PipelineBoard'
import type { Pitch } from '@/types/database'

export default async function TekliflerPage() {
  const supabase = await createClient()
  const t = await getTranslations('pitches')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const [{ data: pitches }, { data: clients }, { data: members }, { data: items }] = await Promise.all([
    supabase.from('pitches').select('*, clients(name)').order('created_at', { ascending: false }) as Promise<{
      data: (Pitch & { clients: { name: string } | null })[] | null
    }>,
    supabase.from('clients').select('id, name').order('name') as Promise<{ data: { id: string; name: string }[] | null }>,
    supabase.from('profiles').select('id, full_name').order('full_name') as Promise<{ data: { id: string; full_name: string }[] | null }>,
    supabase.from('pitch_items').select('pitch_id') as Promise<{ data: { pitch_id: string }[] | null }>,
  ])

  const itemCounts = new Map<string, number>()
  for (const i of items ?? []) {
    itemCounts.set(i.pitch_id, (itemCounts.get(i.pitch_id) ?? 0) + 1)
  }

  const pitchList: PitchWithMeta[] = (pitches ?? []).map(p => ({
    ...p,
    clientName: p.clients?.name ?? '—',
    itemCount: itemCounts.get(p.id) ?? 0,
  }))

  // ── Özet metrikler ──
  const open = pitchList.filter(p => p.stage !== 'kazanildi' && p.stage !== 'kaybedildi')
  const pipelineValue = open.reduce((s, p) => s + Number(p.estimated_value ?? 0), 0)
  const thisYear = new Date().getFullYear()
  const won = pitchList.filter(p => p.stage === 'kazanildi' && new Date(p.created_at).getFullYear() === thisYear)
  const closed = pitchList.filter(p => p.stage === 'kazanildi' || p.stage === 'kaybedildi')
  const winRate = closed.length > 0
    ? Math.round((pitchList.filter(p => p.stage === 'kazanildi').length / closed.length) * 100)
    : null

  const stats = [
    { label: t('pipelineValue'), value: `${pipelineValue.toLocaleString('tr-TR')} TRY` },
    { label: t('openPitches'), value: String(open.length) },
    { label: t('wonThisYear'), value: String(won.length) },
    { label: t('winRate'), value: winRate !== null ? `%${winRate}` : '—' },
  ]

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="p-6">
        {pitchList.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map(s => (
              <div key={s.label} className="sb-card p-4">
                <p className="text-xl font-bold text-gray-900 leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <PipelineBoard
          pitches={pitchList}
          clients={clients ?? []}
          teamMembers={members ?? []}
        />
      </div>
    </div>
  )
}
