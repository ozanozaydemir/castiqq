'use client'

import { useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Send, Trash2, UserPlus, MapPin, Loader2, Printer, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getOrCreateDraftSubmission, addSubmissionItem, removeSubmissionItem, submitSubmission } from '@/app/actions/roleShareSubmissions'
import type { MatchResult, TalentCandidate } from '@/lib/roleMatching'

type DraftItem = { id: string; full_name: string; photo_url: string | null; source_talent_id: string | null }
type PastRound = {
  id: string; status: string; created_at: string
  role_share_submission_items: { id: string; full_name: string; cd_decision: string }[]
}

export function SubmissionBuilder({ shareId, matches, otherTalents, draftSubmissionId, draftItems, pastRounds, canPropose }: {
  shareId: string; matches: MatchResult[]; otherTalents: TalentCandidate[]; draftSubmissionId: string | null; draftItems: DraftItem[]
  pastRounds: PastRound[]; canPropose: boolean
}) {
  const t = useTranslations('incomingRoles')
  const [isPending, startTransition] = useTransition()
  const [pendingTalentId, setPendingTalentId] = useState<string | null>(null)
  const [showOthers, setShowOthers] = useState(false)
  const [otherSearch, setOtherSearch] = useState('')
  const router = useRouter()

  const proposedTalentIds = new Set(draftItems.map(i => i.source_talent_id).filter(Boolean))
  const filteredOthers = otherSearch.trim()
    ? otherTalents.filter(tl => tl.full_name.toLowerCase().includes(otherSearch.trim().toLowerCase()))
    : otherTalents

  function handlePropose(talentId: string) {
    setPendingTalentId(talentId)
    startTransition(async () => {
      let subId = draftSubmissionId
      if (!subId) {
        const result = await getOrCreateDraftSubmission(shareId)
        if ('error' in result) { setPendingTalentId(null); return }
        subId = result.id
      }
      const fd = new FormData()
      await addSubmissionItem(subId, talentId, fd)
      setPendingTalentId(null)
      router.refresh()
    })
  }

  function handleRemove(itemId: string) {
    startTransition(async () => { await removeSubmissionItem(itemId); router.refresh() })
  }

  function handleSubmitRound() {
    if (!draftSubmissionId) return
    startTransition(async () => { await submitSubmission(draftSubmissionId); router.refresh() })
  }

  return (
    <div className="space-y-6">
      {canPropose && (
        <div className="sb-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('matchesTitle')}</h3>
          {matches.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('noMatches')}</p>
          ) : (
            <div className="space-y-2">
              {matches.slice(0, 20).map(({ talent, reasons }) => {
                const already = proposedTalentIds.has(talent.id)
                return (
                  <div key={talent.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    {talent.photos?.[0] ? (
                      <img src={talent.photos[0]} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        {talent.full_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{talent.full_name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {talent.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{talent.city}</span>}
                        {reasons.length > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{t('matchScore', { score: reasons.length })}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePropose(talent.id)}
                      disabled={already || (isPending && pendingTalentId === talent.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                        already ? 'text-green-600 bg-green-50 cursor-default' : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                      }`}
                    >
                      {isPending && pendingTalentId === talent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {already ? t('proposed') : t('proposeCta')}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {canPropose && otherTalents.length > 0 && (
        <div className="sb-card p-5">
          <button
            onClick={() => setShowOthers(v => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-sm font-semibold text-gray-700">{t('otherTalentsTitle')}</h3>
            {showOthers ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <p className="text-xs text-gray-400 mt-1">{t('otherTalentsHint')}</p>

          {showOthers && (
            <div className="mt-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={otherSearch}
                  onChange={e => setOtherSearch(e.target.value)}
                  placeholder={t('otherTalentsSearchPlaceholder')}
                  className="sb-input pl-8 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredOthers.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3 text-center">{t('otherTalentsEmpty')}</p>
                ) : (
                  filteredOthers.map(talent => {
                    const already = proposedTalentIds.has(talent.id)
                    return (
                      <div key={talent.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        {talent.photos?.[0] ? (
                          <img src={talent.photos[0]} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                            {talent.full_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{talent.full_name}</p>
                          {talent.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{talent.city}</span>}
                        </div>
                        <button
                          onClick={() => handlePropose(talent.id)}
                          disabled={already || (isPending && pendingTalentId === talent.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            already ? 'text-green-600 bg-green-50 cursor-default' : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                          }`}
                        >
                          {isPending && pendingTalentId === talent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                          {already ? t('proposed') : t('proposeCta')}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {draftItems.length > 0 && (
        <div className="sb-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('draftTitle')}</h3>
          <div className="space-y-2 mb-4">
            {draftItems.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-700">{item.full_name}</span>
                <button onClick={() => handleRemove(item.id)} disabled={isPending} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSubmitRound} disabled={isPending} className="sb-btn-primary w-full disabled:opacity-50">
            <Send className="w-4 h-4" /> {t('sendRoundCta')}
          </button>
        </div>
      )}

      {pastRounds.length > 0 && (
        <div className="sb-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('pastRoundsTitle')}</h3>
          <div className="space-y-3">
            {pastRounds.map(round => (
              <div key={round.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">{new Date(round.created_at).toLocaleDateString('tr-TR')}</span>
                    <Link href={`/oneri-yazdir/${round.id}`} target="_blank" className="text-gray-300 hover:text-indigo-500 transition-colors">
                      <Printer className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400">{t(`submissionStatus.${round.status}`)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {round.role_share_submission_items.map(item => (
                    <span
                      key={item.id}
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.cd_decision === 'begenildi' ? 'bg-green-50 text-green-600'
                        : item.cd_decision === 'reddedildi' ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.full_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
