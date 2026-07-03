'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Upload, CheckCircle2, Loader2, Film, Clock, Plus } from 'lucide-react'

const MAX_VIDEOS = 3

type UploadedVideo = {
  id: string
  uploaded_at: string
  duration_seconds: number | null
}

interface Props {
  token: string
  initialVideos: UploadedVideo[]
}

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise(resolve => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const url = URL.createObjectURL(file)
    video.src = url
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(isFinite(video.duration) ? Math.round(video.duration) : null)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
  })
}

function formatDuration(secs: number | null) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`R2 HTTP ${xhr.status}: ${xhr.responseText?.slice(0, 200) || 'bilinmeyen hata'}`))
      }
    }
    xhr.onerror = () => reject(new Error(
      'R2 bağlantı hatası — büyük ihtimalle CORS ayarı eksik. ' +
      `URL: ${url.slice(0, 60)}...`
    ))
    xhr.send(file)
  })
}

export function UploadSection({ token, initialVideos }: Props) {
  const t = useTranslations('upload')
  const [videos, setVideos]     = useState<UploadedVideo[]>(initialVideos)
  const [file, setFile]         = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const atLimit = videos.length >= MAX_VIDEOS

  async function handleUpload() {
    if (!file || atLimit) return
    setError(null)
    setUploading(true)
    setProgress(5)

    const urlRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fileName: file.name, fileType: file.type, fileSize: file.size }),
    })

    if (!urlRes.ok) {
      const { error: e } = await urlRes.json()
      setError(e ?? t('urlError'))
      setUploading(false)
      return
    }

    const { presignedUrl, storagePath, auditionId, organizationId } = await urlRes.json()
    setProgress(10)

    try {
      await uploadWithProgress(presignedUrl, file, pct => {
        setProgress(10 + Math.round(pct * 0.85))
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploadFailed'))
      setUploading(false)
      return
    }

    setProgress(96)

    const completeRes = await fetch('/api/video-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditionId, organizationId, storagePath, duration, fileSizeBytes: file.size }),
    })

    if (!completeRes.ok) {
      const { error: e } = await completeRes.json()
      setError(e ?? t('recordFailed'))
      setUploading(false)
      return
    }

    const { videoId, uploadedAt } = await completeRes.json()

    setProgress(100)
    setVideos(prev => [...prev, {
      id: videoId,
      uploaded_at: uploadedAt,
      duration_seconds: duration,
    }])
    setFile(null)
    setDuration(null)
    setUploading(false)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t('myVideos')}</h3>
        <span className="text-xs text-gray-400">{t('videoCount', { current: videos.length, max: MAX_VIDEOS })}</span>
      </div>

      {/* Yüklenen videolar */}
      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-green-800 flex-1">{t('videoN', { n: i + 1 })}</span>
              {v.duration_seconds && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Clock className="w-3 h-3" />
                  {formatDuration(v.duration_seconds)}
                </span>
              )}
              <span className="text-xs text-green-500">
                {new Date(v.uploaded_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload formu ya da limit mesajı */}
      {atLimit ? (
        <div className="text-center py-4 text-sm text-gray-400">
          {t('atLimit', { max: MAX_VIDEOS })}
        </div>
      ) : (
        <>
          {videos.length === 0 && (
            <p className="text-sm text-gray-500">
              {t('instructions')}
            </p>
          )}

          {/* Drop zone */}
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <Film className="w-7 h-7 mx-auto mb-2 text-gray-300" />
            {file ? (
              <div>
                <p className="font-medium text-indigo-700 text-sm">{file.name}</p>
                <p className="text-xs text-indigo-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">{t('dropzone')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('dropzoneHint')}</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async e => {
                const f = e.target.files?.[0] ?? null
                setFile(f)
                setDuration(f ? await getVideoDuration(f) : null)
              }}
            />
          </div>

          {uploading && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{progress < 10 ? t('preparing') : progress < 96 ? t('uploading') : t('completing')}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="sb-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('uploading')}</>
            ) : videos.length > 0 ? (
              <><Plus className="w-4 h-4" /> {t('addMore')} ({videos.length}/{MAX_VIDEOS})</>
            ) : (
              <><Upload className="w-4 h-4" /> {t('button')}</>
            )}
          </button>
        </>
      )}
    </div>
  )
}
