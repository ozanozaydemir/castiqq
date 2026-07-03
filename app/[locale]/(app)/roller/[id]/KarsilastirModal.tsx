'use client'

import { X, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

type VideoEntry = {
  id: string
  public_url: string | null
  storage_path: string
  uploaded_at: string
  duration_seconds: number | null
}

type CompareAudition = {
  id: string
  talent_name: string | null
  talent: { id: string; full_name: string } | null
  rating: number | null
  notes: string | null
  status: string
  audition_videos: VideoEntry[]
}

interface KarsilastirModalProps {
  auditions: CompareAudition[]
  onClose: () => void
}

const STATUS_COLORS: Record<string, string> = {
  selected: 'bg-green-100 text-green-700',
  shortlisted: 'bg-indigo-100 text-indigo-700',
  reviewing: 'bg-amber-100 text-amber-700',
  pending: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-700',
  candidate: 'bg-blue-100 text-blue-700',
}

export function KarsilastirModal({ auditions, onClose }: KarsilastirModalProps) {
  const t = useTranslations('auditions')

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex-1 overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-semibold text-gray-900">{t('compareTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison grid */}
        <div
          className="grid gap-0 divide-x divide-gray-200 bg-white"
          style={{ gridTemplateColumns: `repeat(${auditions.length}, minmax(0, 1fr))` }}
        >
          {auditions.map(aud => {
            const name = aud.talent?.full_name ?? aud.talent_name ?? '—'
            const latestVideo = aud.audition_videos[aud.audition_videos.length - 1] ?? null
            const statusColor = STATUS_COLORS[aud.status] ?? STATUS_COLORS.pending

            return (
              <div key={aud.id} className="flex flex-col">
                {/* Name + status */}
                <div className="px-4 pt-5 pb-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                      {aud.status}
                    </span>
                    {aud.rating && (
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < aud.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Video */}
                <div className="bg-black aspect-video">
                  {latestVideo?.public_url ? (
                    <video
                      src={latestVideo.public_url}
                      controls
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                      {t('noVideo')}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {aud.notes && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 line-clamp-4">{aud.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
