'use client'

import { useState, useTransition } from 'react'
import { VideoModal, type VideoAudition } from '@/app/[locale]/(app)/roller/[id]/VideoModal'
import { deleteVideo } from '@/app/actions/auditions'
import { Link, useRouter } from '@/i18n/navigation'
import {
  Play, ExternalLink, Copy, Check, Clock, Video,
  MessageCircle, Trash2, Star, ChevronDown, ChevronUp,
} from 'lucide-react'

export type AuditionWithVideos = {
  id: string
  status: string
  notes: string | null
  rating: number | null
  submitted_at: string | null
  token: string
  talent_name: string | null
  invite_phone: string | null
  project_roles: { id: string; name: string; projects: { id: string; title: string } | null } | null
  audition_videos: {
    id: string
    storage_path: string
    public_url: string | null
    uploaded_at: string
    duration_seconds: number | null
    file_size_bytes: number | null
  }[]
  audition_tags: { tags: { id: string; name: string } | null }[]
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  candidate:   { label: 'Aday',          color: 'bg-gray-100 text-gray-600' },
  pending:     { label: 'Beklemede',      color: 'bg-amber-50 text-amber-600' },
  reviewing:   { label: 'İnceleniyor',    color: 'bg-yellow-50 text-yellow-700' },
  shortlisted: { label: 'Kısa Listede',   color: 'bg-indigo-50 text-indigo-600' },
  rejected:    { label: 'Elendi',         color: 'bg-red-50 text-red-500' },
  selected:    { label: 'Seçildi',        color: 'bg-green-50 text-green-600' },
}

function fmt(secs: number): string {
  const m = Math.floor(secs / 60), s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
      title="Upload linkini kopyala"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Kopyalandı' : 'Link'}
    </button>
  )
}

function VideoCardItem({
  video,
  index,
  onDelete,
}: {
  video: AuditionWithVideos['audition_videos'][number]
  index: number
  onDelete: (videoId: string) => void
}) {
  const [, startDel] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    startDel(async () => { await onDelete(video.id) })
    setConfirming(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Video className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
        <span className="font-medium text-gray-700">Video {index + 1}</span>
        {video.duration_seconds != null && (
          <span className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3 h-3" />{fmt(video.duration_seconds)}
          </span>
        )}
        {video.file_size_bytes != null && (
          <span className="text-gray-300">{fmtSize(video.file_size_bytes)}</span>
        )}
        <span className="text-gray-300">
          {new Date(video.uploaded_at).toLocaleDateString('tr-TR')}
        </span>
      </div>
      <button
        onClick={handleDelete}
        className={`flex items-center gap-1 text-[11px] rounded-md px-2 py-1 transition-colors flex-shrink-0 ${
          confirming
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
        }`}
        title="Videoyu sil"
      >
        <Trash2 className="w-3 h-3" />
        {confirming && 'Emin misin?'}
      </button>
    </div>
  )
}

interface Props {
  auditions: AuditionWithVideos[]
  talent: { id: string; full_name: string }
  siteUrl: string
}

export function TalentVideosTab({ auditions, talent, siteUrl }: Props) {
  const router = useRouter()
  const [openModal, setOpenModal] = useState<{ audition: VideoAudition; roleId: string } | null>(null)
  const [expandedVideos, setExpandedVideos] = useState<Record<string, boolean>>({})

  const withVideos = auditions.filter(a => a.audition_videos.length > 0)

  const totalVideos   = withVideos.reduce((s, a) => s + a.audition_videos.length, 0)
  const totalDuration = withVideos.reduce((s, a) =>
    s + a.audition_videos.reduce((ss, v) => ss + (v.duration_seconds ?? 0), 0), 0)
  const projectCount = new Set(withVideos.map(a => a.project_roles?.projects?.id).filter(Boolean)).size

  function openVideo(a: AuditionWithVideos) {
    const roleId = a.project_roles?.id ?? ''
    const videoAudition: VideoAudition = {
      id: a.id,
      status: a.status,
      notes: a.notes,
      rating: a.rating,
      submitted_at: a.submitted_at,
      talent_name: a.talent_name,
      invite_phone: a.invite_phone,
      token: a.token,
      talent: { id: talent.id, full_name: talent.full_name },
      audition_videos: a.audition_videos,
      tags: a.audition_tags.flatMap(at => (at.tags ? [at.tags] : [])),
    }
    setOpenModal({ audition: videoAudition, roleId })
  }

  async function handleDeleteVideo(videoId: string, roleId: string) {
    await deleteVideo(videoId, roleId)
    router.refresh()
  }

  if (withVideos.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <Video className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Henüz yüklenmiş video bulunmuyor.</p>
        <p className="text-xs text-gray-300 mt-1">Oyuncuya audition daveti gönderildikten sonra videolar burada görünür.</p>
      </div>
    )
  }

  return (
    <>
      {/* Summary stats */}
      <div className="px-6 pb-4">
        <div className="flex gap-4 p-3 bg-gray-50 rounded-xl text-sm">
          <span className="text-gray-500">
            <strong className="text-gray-900">{totalVideos}</strong> video
          </span>
          {projectCount > 0 && (
            <span className="text-gray-500">
              <strong className="text-gray-900">{projectCount}</strong> proje
            </span>
          )}
          {totalDuration > 0 && (
            <span className="text-gray-500">
              Toplam süre: <strong className="text-gray-900">{fmt(totalDuration)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Audition cards */}
      <div className="px-6 pb-8 space-y-3">
        {withVideos.map(a => {
          const role    = a.project_roles
          const project = role?.projects
          const st      = STATUS_MAP[a.status] ?? { label: a.status, color: 'bg-gray-100 text-gray-500' }
          const inviteUrl = `${siteUrl}/oyuncu/${a.token}`
          const waLink    = a.invite_phone
            ? `https://wa.me/${a.invite_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba! Casting davetiniz: ${inviteUrl}`)}`
            : null
          const expanded = expandedVideos[a.id] ?? false
          const aud_duration = a.audition_videos.reduce((s, v) => s + (v.duration_seconds ?? 0), 0)

          return (
            <div key={a.id} className="sb-card overflow-hidden">
              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Role + Project */}
                  <div className="min-w-0">
                    {role ? (
                      <Link href={`/roller/${role.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 text-sm leading-tight block">
                        {role.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Rol bilgisi yok</span>
                    )}
                    {project && (
                      <Link href={`/projeler/${project.id}`} className="text-xs text-gray-400 hover:text-gray-600 block mt-0.5">
                        {project.title}
                      </Link>
                    )}
                  </div>

                  {/* Status + Rating */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.rating != null && (
                      <span className="text-amber-400 text-xs">
                        {'★'.repeat(a.rating)}{'☆'.repeat(5 - a.rating)}
                      </span>
                    )}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {a.submitted_at && (
                    <span>{new Date(a.submitted_at).toLocaleDateString('tr-TR')}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Video className="w-3 h-3" />{a.audition_videos.length} video
                  </span>
                  {aud_duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{fmt(aud_duration)}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => openVideo(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> İzle
                  </button>

                  {role && (
                    <Link
                      href={`/roller/${role.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Role Git
                    </Link>
                  )}

                  <CopyButton text={inviteUrl} />

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg transition-colors"
                      title="WhatsApp ile yeni video iste"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Expand/collapse video list */}
                  <button
                    onClick={() => setExpandedVideos(prev => ({ ...prev, [a.id]: !expanded }))}
                    className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Videolar
                  </button>
                </div>
              </div>

              {/* Expanded video list */}
              {expanded && (
                <div className="border-t border-gray-50 px-4 pb-3">
                  <div className="divide-y divide-gray-50">
                    {a.audition_videos.map((v, i) => (
                      <VideoCardItem
                        key={v.id}
                        video={v}
                        index={i}
                        onDelete={(videoId) => handleDeleteVideo(videoId, role?.id ?? '')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* VideoModal overlay */}
      {openModal && (
        <VideoModal
          auditions={[openModal.audition]}
          startIndex={0}
          roleId={openModal.roleId}
          siteUrl={siteUrl}
          onClose={() => { setOpenModal(null); router.refresh() }}
        />
      )}
    </>
  )
}
