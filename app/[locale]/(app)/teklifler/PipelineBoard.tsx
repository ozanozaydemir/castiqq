'use client'

import { useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Plus, Target, Calendar, AlertTriangle, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PitchModal } from './PitchModal'
import { createPitch, updatePitchStage } from '@/app/actions/pitches'
import { ACTIVE_PITCH_STAGES, PITCH_STAGE_STYLES } from '@/lib/crm'
import type { Pitch, PitchStage } from '@/types/database'

export type PitchWithMeta = Pitch & {
  clientName: string
  itemCount: number
}

function money(n: number, currency: string) {
  return `${n.toLocaleString('tr-TR')} ${currency}`
}

export function PipelineBoard({
  pitches,
  clients,
  teamMembers,
}: {
  pitches: PitchWithMeta[]
  clients: { id: string; name: string }[]
  teamMembers: { id: string; full_name: string }[]
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('pitches')

  const today = new Date().toISOString().split('T')[0]
  const soon = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  function handleStageChange(pitchId: string, stage: string) {
    startTransition(async () => { await updatePitchStage(pitchId, stage); router.refresh() })
  }

  const lost = pitches.filter(p => p.stage === 'kaybedildi')
  const byStage = (s: PitchStage) => pitches.filter(p => p.stage === s)

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModalOpen(true)} className="sb-btn-primary">
          <Plus className="w-4 h-4" /> {t('addPitch')}
        </button>
      </div>

      {pitches.length === 0 ? (
        <div className="sb-card flex flex-col items-center justify-center py-16 text-center">
          <Target className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('empty')}</p>
          <p className="text-gray-400 text-sm mt-1 max-w-md">{t('emptyHint')}</p>
        </div>
      ) : (
        <>
          {/* Pipeline sütunları — mobilde yatay kaydırılır, sayfa gövdesi kaymaz. */}
          <div className="overflow-x-auto -mx-6 px-6 pb-2">
            <div className="flex gap-3 min-w-max">
              {ACTIVE_PITCH_STAGES.map(stage => {
                const items = byStage(stage)
                const total = items.reduce((sum, p) => sum + Number(p.estimated_value ?? 0), 0)
                return (
                  <div key={stage} className="w-64 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PITCH_STAGE_STYLES[stage]}`}>
                        {t(`stages.${stage}`)}
                      </span>
                      <span className="text-xs text-gray-400">{items.length}</span>
                    </div>
                    {total > 0 && (
                      <p className="text-xs text-gray-400 px-1 mb-2">{money(total, 'TRY')}</p>
                    )}

                    <div className="space-y-2">
                      {items.map(p => {
                        const overdue = p.decision_due_date !== null && p.decision_due_date < today && p.stage !== 'kazanildi'
                        const dueSoon = !overdue && p.decision_due_date !== null && p.decision_due_date <= soon && p.stage !== 'kazanildi'
                        return (
                          <div key={p.id} className="sb-card p-3 hover:border-indigo-200 transition-colors">
                            <Link href={`/teklifler/${p.id}`} className="block">
                              <p className="text-sm font-semibold text-gray-900 leading-snug">{p.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{p.clientName}</p>
                            </Link>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-gray-400">
                              <span>{t(`projectTypes.${p.project_type}`)}</span>
                              {p.itemCount > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Users className="w-3 h-3" />{p.itemCount}
                                </span>
                              )}
                              {p.estimated_value !== null && (
                                <span className="font-medium text-gray-600">{money(Number(p.estimated_value), p.currency)}</span>
                              )}
                            </div>

                            {p.decision_due_date && (
                              <p className={`flex items-center gap-1 text-xs mt-1.5 ${
                                overdue ? 'text-red-500 font-medium' : dueSoon ? 'text-amber-600' : 'text-gray-400'
                              }`}>
                                {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                {overdue ? t('decisionOverdue') : dueSoon ? t('decisionSoon') : ''}
                                {' '}{new Date(p.decision_due_date).toLocaleDateString('tr-TR')}
                              </p>
                            )}

                            <select
                              value={p.stage}
                              disabled={isPending}
                              onChange={e => handleStageChange(p.id, e.target.value)}
                              className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 cursor-pointer disabled:opacity-60"
                            >
                              {['brief', 'oyuncu_onerildi', 'opsiyon', 'sozlesme', 'kazanildi', 'kaybedildi'].map(s => (
                                <option key={s} value={s}>{t(`stages.${s}`)}</option>
                              ))}
                            </select>
                          </div>
                        )
                      })}
                      {items.length === 0 && (
                        <div className="border border-dashed border-gray-200 rounded-xl py-6 text-center">
                          <span className="text-xs text-gray-300">—</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {lost.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-500 mb-3">{t('lostSection')}</h2>
              <div className="sb-card divide-y divide-gray-50">
                {lost.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <Link href={`/teklifler/${p.id}`} className="text-sm font-medium text-gray-700 hover:text-indigo-600 truncate block">
                        {p.title}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {p.clientName}{p.lost_reason && ` · ${p.lost_reason}`}
                      </p>
                    </div>
                    {p.estimated_value !== null && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{money(Number(p.estimated_value), p.currency)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <PitchModal
          action={createPitch}
          clients={clients}
          teamMembers={teamMembers}
          onClose={() => { setModalOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
