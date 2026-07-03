'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/Badge'
import { AdayEkleModal } from './AdayEkleModal'
import {
  updateAuditionStatus, deleteAudition, reorderAuditions, requestAudition,
} from '@/app/actions/auditions'
import { useRouter } from '@/i18n/navigation'
import {
  UserPlus, Copy, Check, MessageCircle, ChevronDown,
  Trash2, Users, GripVertical, ArrowUpDown, Video, X, Loader2, Play, MessageSquare, Star,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { VideoModal, type VideoAudition, type TagEntry } from './VideoModal'
import { useTranslations } from 'next-intl'

// ── Types ────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = {
  selected: 0, shortlisted: 1, reviewing: 2, pending: 3, rejected: 4, candidate: 5,
}

type SortKey = 'manual' | 'name' | 'status' | 'date' | 'rating'
type TalentRef = { id: string; full_name: string } | null

type VideoEntry = {
  id: string
  public_url: string | null
  storage_path: string
  uploaded_at: string
  duration_seconds: number | null
}

type Audition = {
  id: string
  status: string
  notes: string | null
  rating: number | null
  notes_updated_by: string | null
  notes_updated_at: string | null
  profiles: { full_name: string } | null
  submitted_at: string | null
  talent_name: string | null
  talent_email: string | null
  invite_phone: string | null
  token: string
  sort_order: number
  talent: TalentRef
  audition_videos: VideoEntry[]
  audition_tags: { tags: { id: string; name: string } | null }[]
}

type Talent = { id: string; full_name: string; phone: string | null; email: string | null }

type RequestState = { id: string; name: string; phone: string | null }
type VideoState   = { auditions: VideoAudition[]; startIndex: number }

interface Props {
  roleId: string
  roleName: string
  auditions: Audition[]
  talents: Talent[]
  siteUrl: string
}

// ── Copy link button ─────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations('auditions')
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-gray-400 hover:text-indigo-500 transition-colors"
      title={t('copyLink')}
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-500" />
        : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Status dropdown ──────────────────────────────────────────────

function StatusSelect({ auditionId, roleId, currentStatus }: {
  auditionId: string; roleId: string; currentStatus: string
}) {
  const t = useTranslations('auditions')
  const [, startTransition] = useTransition()
  const router = useRouter()

  const AUDITION_STATUS_OPTIONS = [
    { value: 'pending',     label: t('status.pending'),     variant: 'default' as const },
    { value: 'reviewing',   label: t('status.reviewing'),   variant: 'yellow'  as const },
    { value: 'shortlisted', label: t('status.shortlisted'), variant: 'indigo'  as const },
    { value: 'rejected',    label: t('status.rejected'),    variant: 'default' as const },
    { value: 'selected',    label: t('status.selected'),    variant: 'green'   as const },
  ]

  const current = AUDITION_STATUS_OPTIONS.find(o => o.value === currentStatus)

  return (
    <div className="relative inline-flex items-center gap-1 cursor-pointer select-none">
      <Badge variant={current?.variant ?? 'default'}>{current?.label ?? currentStatus}</Badge>
      <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none" />
      <select
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
        value={currentStatus}
        onChange={e => {
          startTransition(async () => {
            await updateAuditionStatus(auditionId, roleId, e.target.value)
            router.refresh()
          })
        }}
      >
        {AUDITION_STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Audition İste modal ──────────────────────────────────────────

function AuditionIsteModal({ state, roleId, siteUrl, onClose }: {
  state: RequestState; roleId: string; siteUrl: string; onClose: () => void
}) {
  const t = useTranslations('auditions')
  const tc = useTranslations('common')
  const [phone, setPhone] = useState(state.phone ?? '')
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const inviteUrl = token ? `${siteUrl}/oyuncu/${token}` : null
  const waLink = inviteUrl && phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Merhaba! Casting davetiniz hazır. Videonu yüklemek için:\n${inviteUrl}`
      )}`
    : null

  function handleRequest() {
    setError(null)
    startTransition(async () => {
      const result = await requestAudition(state.id, roleId, phone || null)
      if (result?.error) { setError(result.error); return }
      if (result?.token) {
        setToken(result.token)
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{t('requestAuditionTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{state.name}</span>{t('requestAuditionHint')}
          </p>

          {!token ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">{t('whatsappLabel')}</label>
                <input
                  className="sb-input"
                  placeholder={t('whatsappPlaceholder')}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                <p className="text-xs text-gray-400">{t('whatsappHint')}</p>
              </div>
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button
                onClick={handleRequest}
                disabled={isPending}
                className="sb-btn-primary w-full"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('creating')}</>
                  : <><Video className="w-4 h-4" /> {t('createLink')}</>}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <span className="text-xs text-gray-600 flex-1 truncate">{inviteUrl}</span>
                <button
                  onClick={() => {
                    if (!inviteUrl) return
                    navigator.clipboard.writeText(inviteUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex-shrink-0 text-indigo-500 hover:text-indigo-700"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> {t('whatsappSend')}
                </a>
              )}
              <button onClick={onClose} className="w-full sb-btn-secondary text-sm">{tc('close')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sortable row ─────────────────────────────────────────────────

function SortableRow({ audition, roleId, siteUrl, isDragMode, onDelete, onRequestAudition, onWatch }: {
  audition: Audition
  roleId: string
  siteUrl: string
  isDragMode: boolean
  onDelete: (id: string) => void
  onRequestAudition: (a: Audition) => void
  onWatch: (a: Audition) => void
}) {
  const t = useTranslations('auditions')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: audition.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#f5f3ff' : undefined,
  }

  const [, startTransition] = useTransition()
  const router = useRouter()

  const name = audition.talent?.full_name ?? audition.talent_name ?? audition.talent_email ?? '—'
  const isCandidate = audition.status === 'candidate'
  const hasVideo    = (audition.audition_videos?.length ?? 0) > 0
  const inviteUrl = `${siteUrl}/oyuncu/${audition.token}`
  const waLink = !isCandidate && audition.invite_phone
    ? `https://wa.me/${audition.invite_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Merhaba! Casting davetiniz hazır:\n${inviteUrl}`
      )}`
    : null

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="w-8 px-2">
        {isDragMode && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
            tabIndex={-1}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </td>

      <td className="font-medium text-gray-900">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {audition.talent
              ? <Link href={`/oyuncular/${audition.talent.id}`} className="hover:text-indigo-600">{name}</Link>
              : name}
            {audition.notes && (
              <span
                title={`${audition.profiles?.full_name ?? 'Ekip'}: ${audition.notes}`}
                className="flex-shrink-0 text-indigo-400 hover:text-indigo-600 cursor-help"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          {(audition.audition_tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {audition.audition_tags.map(at => at.tags).filter((tg): tg is TagEntry => !!tg).map(tg => (
                <span key={tg.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                  {tg.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>

      <td>
        {isCandidate
          ? <Badge variant="default">{t('status.candidate')}</Badge>
          : <StatusSelect auditionId={audition.id} roleId={roleId} currentStatus={audition.status} />}
      </td>

      <td>
        {audition.rating ? (
          <span className="flex items-center gap-0.5">
            {Array.from({ length: audition.rating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </span>
        ) : (
          <span className="text-gray-200 text-xs">—</span>
        )}
      </td>

      <td>
        {isCandidate ? (
          <span className="text-gray-300 text-xs">—</span>
        ) : hasVideo ? (
          <button
            onClick={() => onWatch(audition)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Play className="w-3 h-3 fill-current" /> {t('watchVideo')}
          </button>
        ) : audition.submitted_at ? (
          <span className="text-green-600 font-medium text-xs">{t('uploaded')}</span>
        ) : (
          <span className="text-gray-300 text-xs">{t('waitingVideo')}</span>
        )}
      </td>

      <td>
        <div className="flex items-center gap-2">
          {isCandidate ? (
            <button
              onClick={() => onRequestAudition(audition)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Video className="w-3 h-3" /> {t('requestAudition')}
            </button>
          ) : (
            <>
              <CopyLinkButton url={inviteUrl} />
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-500 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          )}
        </div>
      </td>

      <td>
        <button
          onClick={() => {
            const msg = isCandidate
              ? t('deleteCandidateConfirm')
              : t('deleteAuditionConfirm')
            if (!confirm(msg)) return
            startTransition(async () => {
              await deleteAudition(audition.id, roleId)
              router.refresh()
            })
            onDelete(audition.id)
          }}
          className="text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ── Main component ───────────────────────────────────────────────

export function RolAuditions({ roleId, roleName, auditions: initial, talents, siteUrl }: Props) {
  const t = useTranslations('auditions')
  const [showAdayModal, setShowAdayModal] = useState(false)
  const [requestingAudition, setRequestingAudition] = useState<RequestState | null>(null)
  const [videoState, setVideoState] = useState<VideoState | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('manual')
  const [items, setItems] = useState<Audition[]>(
    [...initial].sort((a, b) => a.sort_order - b.sort_order)
  )

  useEffect(() => {
    setItems([...initial].sort((a, b) => a.sort_order - b.sort_order))
  }, [initial])

  const [, startTransition] = useTransition()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sorted = useCallback((): Audition[] => {
    if (sortKey === 'manual') return items
    return [...items].sort((a, b) => {
      if (sortKey === 'name') {
        const na = a.talent?.full_name ?? a.talent_name ?? ''
        const nb = b.talent?.full_name ?? b.talent_name ?? ''
        return na.localeCompare(nb, 'tr')
      }
      if (sortKey === 'status') return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      if (sortKey === 'date')   return (b.submitted_at ?? '').localeCompare(a.submitted_at ?? '')
      if (sortKey === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      return 0
    })
  }, [items, sortKey])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    startTransition(async () => {
      await reorderAuditions(roleId, reordered.map(i => i.id))
    })
  }

  const displayItems = sorted()
  const isDragMode = sortKey === 'manual'

  const candidateCount = items.filter(i => i.status === 'candidate').length
  const auditionCount = items.filter(i => i.status !== 'candidate').length

  const existingTalentIds = items
    .map(i => i.talent?.id)
    .filter((id): id is string => !!id)

  const sortLabels: Record<SortKey, string> = {
    manual: t('sortManualLabel'),
    name:   t('sortNameLabel'),
    status: t('sortStatusLabel'),
    date:   t('sortDateLabel'),
    rating: t('sortRatingLabel'),
  }

  return (
    <div className="sb-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">{t('candidates')}</h3>
          {items.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {candidateCount > 0 && t('candidateCount', { count: candidateCount })}
              {candidateCount > 0 && auditionCount > 0 && ' · '}
              {auditionCount > 0 && t('activeAuditions', { count: auditionCount })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative inline-flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:border-gray-300 cursor-pointer">
            <ArrowUpDown className="w-3 h-3" />
            <span>{sortLabels[sortKey]}</span>
            <ChevronDown className="w-3 h-3" />
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
            >
              <option value="manual">{t('sortManual')}</option>
              <option value="rating">{t('sortByRating')}</option>
              <option value="status">{t('sortByStatus')}</option>
              <option value="name">{t('sortByName')}</option>
              <option value="date">{t('sortByDate')}</option>
            </select>
          </div>

          <button onClick={() => setShowAdayModal(true)} className="sb-btn-primary text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            {t('addCandidate')}
          </button>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <Users className="w-8 h-8 text-gray-200 mb-2" />
          <p className="text-gray-400 text-sm">{t('noCandidates')}</p>
          <p className="text-gray-300 text-xs mt-1">{t('noCandidatesHint')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DndContext id="auditions-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <table className="sb-table">
                <thead>
                  <tr>
                    <th className="w-8"></th>
                    <th>{t('colPlayer')}</th>
                    <th>{t('colStatus')}</th>
                    <th>{t('colRating')}</th>
                    <th>{t('colVideo')}</th>
                    <th>{t('colActions')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map(a => (
                    <SortableRow
                      key={a.id}
                      audition={a}
                      roleId={roleId}
                      siteUrl={siteUrl}
                      isDragMode={isDragMode}
                      onDelete={id => setItems(prev => prev.filter(i => i.id !== id))}
                      onRequestAudition={a => {
                        const liveTalent = a.talent ? talents.find(tl => tl.id === a.talent!.id) : null
                        setRequestingAudition({
                          id: a.id,
                          name: a.talent?.full_name ?? a.talent_name ?? '—',
                          phone: liveTalent?.phone ?? a.invite_phone,
                        })
                      }}
                      onWatch={a => {
                        const withVideo = displayItems
                          .filter(i => (i.audition_videos?.length ?? 0) > 0)
                          .map(i => ({
                            ...i,
                            rating: i.rating,
                            tags: (i.audition_tags ?? [])
                              .map(at => at.tags)
                              .filter((tg): tg is TagEntry => !!tg),
                          })) as VideoAudition[]
                        const startIndex = withVideo.findIndex(i => i.id === a.id)
                        setVideoState({ auditions: withVideo, startIndex: Math.max(0, startIndex) })
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {showAdayModal && (
        <AdayEkleModal
          roleId={roleId}
          talents={talents}
          existingTalentIds={existingTalentIds}
          onClose={() => { setShowAdayModal(false); router.refresh() }}
        />
      )}

      {requestingAudition && (
        <AuditionIsteModal
          state={requestingAudition}
          roleId={roleId}
          siteUrl={siteUrl}
          onClose={() => { setRequestingAudition(null) }}
        />
      )}

      {videoState && (
        <VideoModal
          auditions={videoState.auditions}
          startIndex={videoState.startIndex}
          roleId={roleId}
          siteUrl={siteUrl}
          onClose={() => setVideoState(null)}
        />
      )}
    </div>
  )
}
