'use client'

import { useState } from 'react'
import { Play, X } from 'lucide-react'

type EmbedInfo =
  | { type: 'youtube' | 'vimeo'; embedUrl: string }
  | { type: 'video' | 'audio'; embedUrl: string }
  | { type: 'link' }

function getEmbedInfo(url: string): EmbedInfo {
  try {
    const u = new URL(url)

    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1).split('?')[0]
        : u.searchParams.get('v')
      if (id) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1` }
    }

    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).find(p => /^\d+$/.test(p))
      if (id) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1` }
    }

    const path = u.pathname.toLowerCase()
    if (['.mp4', '.webm', '.mov'].some(ext => path.endsWith(ext)))
      return { type: 'video', embedUrl: url }
    if (['.mp3', '.wav', '.ogg', '.m4a'].some(ext => path.endsWith(ext)))
      return { type: 'audio', embedUrl: url }
  } catch {
    // invalid URL — fall through
  }
  return { type: 'link' }
}

interface Props {
  url: string
  label: string
  icon: React.ReactNode
}

export function MediaEmbed({ url, label, icon }: Props) {
  const [open, setOpen] = useState(false)
  const info = getEmbedInfo(url)
  const embeddable = info.type !== 'link'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        {embeddable ? (
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {label}
            {open
              ? <X className="w-3 h-3 opacity-60" />
              : <Play className="w-3 h-3 fill-current" />}
          </button>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            {label}
          </a>
        )}
      </div>

      {open && embeddable && (
        <div className="rounded-xl overflow-hidden bg-black">
          {(info.type === 'youtube' || info.type === 'vimeo') && (
            <div className="aspect-video">
              <iframe
                src={info.embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {info.type === 'video' && (
            <video src={info.embedUrl} controls autoPlay className="w-full max-h-72" preload="metadata" />
          )}
          {info.type === 'audio' && (
            <div className="p-4">
              <audio src={info.embedUrl} controls autoPlay className="w-full" preload="metadata" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
