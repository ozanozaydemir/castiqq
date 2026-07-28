'use client'

import { useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Send, Ban, Check, X as XIcon, Clock, MapPin, Banknote, Printer } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { revokeRoleShare } from '@/app/actions/roleShares'
import { decideSubmissionItem, decideSubmission } from '@/app/actions/roleShareSubmissions'

type SubmissionItem = {
  id: string; full_name: string; photo_url: string | null; age: number | null
  height_cm: number | null; city: string | null; reel_url: string | null
  proposed_fee: number | null; currency: string; agency_notes: string | null
  cd_decision: 'beklemede' | 'begenildi' | 'reddedildi'
  gender: string | null; skills: string[]; languages: string[]
  bio: string | null; notable_experience: string | null; photos: string[]
  weight_kg: number | null; hair_color: string | null; eye_color: string | null
  education: string | null; selftape_drama_url: string | null
  selftape_comedy_url: string | null; selftape_ad_url: string | null; voice_sample_url: string | null
}
type Submission = {
  id: string; status: string; pdf_url: string | null; created_at: string; reviewed_at: string | null
  role_share_submission_items: SubmissionItem[]
}
type Share = {
  id: string; target_organization_id: string; target_organization_name: string
  status: string; message: string | null; expires_at: string | null; created_at: string
  submissions: Submission[]
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-600',
  revoked: 'bg-gray-100 text-gray-500',
  role_closed: 'bg-amber-50 text-amber-600',
  expired: 'bg-gray-100 text-gray-500',
}

export function IncomingSharesPanel({ projectRoleId, shares }: { projectRoleId: string; shares: Share[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('roles.share')

  if (shares.length === 0) return null

  function handleRevoke(shareId: string) {
    startTransition(async () => { await revokeRoleShare(shareId, projectRoleId); router.refresh() })
  }

  function handleItemDecision(itemId: string, decision: 'begenildi' | 'reddedildi', shareId: string) {
    startTransition(async () => { await decideSubmissionItem(itemId, decision, shareId); router.refresh() })
  }

  function handleSubmissionDecision(submissionId: string, decision: 'kabul' | 'kismen_kabul' | 'red') {
    startTransition(async () => { await decideSubmission(submissionId, decision); router.refresh() })
  }

  return (
    <div className="sb-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">{t('sharesSectionTitle')}</h3>
      </div>

      <div className="space-y-4">
        {shares.map(share => (
          <div key={share.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{share.target_organization_name}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[share.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {t(`status.${share.status}`)}
                </span>
              </div>
              {share.status === 'active' && (
                <button
                  onClick={() => handleRevoke(share.id)}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" /> {t('revokeBtn')}
                </button>
              )}
            </div>

            {share.message && <p className="text-sm text-gray-600 mb-2">{share.message}</p>}

            {share.submissions.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">{t('noSubmissionsYet')}</p>
            ) : (
              <div className="space-y-3 mt-3">
                {share.submissions.filter(s => s.status !== 'taslak').map(sub => (
                  <div key={sub.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">{t('submissionRound', { count: sub.role_share_submission_items.length })}</span>
                        <Link href={`/oneri-yazdir/${sub.id}`} target="_blank" className="text-gray-300 hover:text-indigo-500 transition-colors">
                          <Printer className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      {sub.status === 'gonderildi' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleSubmissionDecision(sub.id, 'kabul')} disabled={isPending} className="text-xs font-medium px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">{t('acceptBtn')}</button>
                          <button onClick={() => handleSubmissionDecision(sub.id, 'kismen_kabul')} disabled={isPending} className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100">{t('partialBtn')}</button>
                          <button onClick={() => handleSubmissionDecision(sub.id, 'red')} disabled={isPending} className="text-xs font-medium px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">{t('rejectBtn')}</button>
                        </div>
                      )}
                      {sub.status !== 'gonderildi' && (
                        <span className="text-[11px] font-medium text-gray-400">{t(`submissionStatus.${sub.status}`)}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {sub.role_share_submission_items.map(item => (
                        <div key={item.id} className="flex gap-3 bg-white rounded-lg p-3 border border-gray-100">
                          {item.photo_url ? (
                            <img src={item.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-600">
                              {item.full_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.full_name}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {item.cd_decision === 'beklemede' ? (
                                  <>
                                    <button onClick={() => handleItemDecision(item.id, 'begenildi', share.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleItemDecision(item.id, 'reddedildi', share.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                      <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${item.cd_decision === 'begenildi' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {item.cd_decision === 'begenildi' ? t('liked') : t('rejected')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-0.5 text-[11px] text-gray-400">
                              {item.gender && <span>{item.gender}</span>}
                              {item.age && <span>{item.age} yaş</span>}
                              {item.height_cm && <span>{item.height_cm} cm</span>}
                              {item.weight_kg && <span>{item.weight_kg} kg</span>}
                              {item.hair_color && <span>{item.hair_color} saç</span>}
                              {item.eye_color && <span>{item.eye_color} göz</span>}
                              {item.city && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{item.city}</span>}
                              {item.proposed_fee && <span className="flex items-center gap-0.5"><Banknote className="w-2.5 h-2.5" />{item.proposed_fee.toLocaleString('tr-TR')} {item.currency}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-0.5 text-[11px]">
                              {item.reel_url && <a href={item.reel_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Reel</a>}
                              {item.selftape_drama_url && <a href={item.selftape_drama_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{t('selftapeDrama')}</a>}
                              {item.selftape_comedy_url && <a href={item.selftape_comedy_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{t('selftapeComedy')}</a>}
                              {item.selftape_ad_url && <a href={item.selftape_ad_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{t('selftapeAd')}</a>}
                              {item.voice_sample_url && <a href={item.voice_sample_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{t('voiceSample')}</a>}
                            </div>
                            {item.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.skills.map(s => (
                                  <span key={s} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{s}</span>
                                ))}
                              </div>
                            )}
                            {item.languages.length > 0 && (
                              <p className="text-[11px] text-gray-500 mt-1">{item.languages.join(' · ')}</p>
                            )}
                            {item.education && <p className="text-[11px] text-gray-500 mt-1">{t('educationLabel')}: {item.education}</p>}
                            {item.notable_experience && (
                              <p className="text-xs text-gray-600 mt-1">{item.notable_experience}</p>
                            )}
                            {item.bio && <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{item.bio}</p>}
                            {item.photos.length > 1 && (
                              <div className="flex gap-1.5 mt-2">
                                {item.photos.slice(0, 5).map((p, i) => (
                                  <img key={i} src={p} alt="" className="w-10 h-10 rounded object-cover" />
                                ))}
                              </div>
                            )}
                            {item.agency_notes && <p className="text-xs text-gray-500 mt-1.5 italic">{t('agencyNoteLabel')}: {item.agency_notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {share.expires_at && share.status === 'active' && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
                <Clock className="w-3 h-3" /> {t('expiresAt', { date: new Date(share.expires_at).toLocaleDateString('tr-TR') })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
