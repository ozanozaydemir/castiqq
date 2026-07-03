'use client'

import { useState, useRef, useTransition, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  X, Check, Copy, MessageCircle, Save, Loader2,
  ChevronLeft, ChevronRight, Clock, Tag, Plus, Trash2, Bookmark,
  Star, RotateCcw,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { updateAuditionStatus, updateAuditionNotes, updateAuditionRating, deleteVideo } from '@/app/actions/auditions'
import { addAuditionTag, removeAuditionTag } from '@/app/actions/audition-tags'
import { addVideoNote, deleteVideoNote } from '@/app/actions/video-notes'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// ── Types ──────────────────────────────────────────────────────────

export type VideoEntry = {
  id: string
  public_url: string | null
  storage_path: string
  uploaded_at: string
  duration_seconds: number | null
}

export type TagEntry = { id: string; name: string }

export type VideoAudition = {
  id: string
  status: string
  notes: string | null
  rating: number | null
  submitted_at: string | null
  talent_name: string | null
  invite_phone: string | null
  token: string
  talent: { id: string; full_name: string } | null
  audition_videos: VideoEntry[]
  tags: TagEntry[]
}

// ── Helpers ────────────────────────────────────────────────────────

const TAG_PALETTE = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function tagStyle(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % TAG_PALETTE.length
  return TAG_PALETTE[Math.abs(h)]
}

function fmt(secs: number | null): string | null {
  if (!secs) return null
  const m = Math.floor(secs / 60), s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Rating selector ────────────────────────────────────────────────

function RatingSelector({ auditionId, roleId, initial }: {
  auditionId: string; roleId: string; initial: number | null
}) {
  const t = useTranslations('auditions')
  const [rating, setRating] = useState<number | null>(initial)
  const [hover, setHover]   = useState<number | null>(null)
  const [isPending, start]  = useTransition()

  function handleClick(val: number) {
    const next = rating === val ? null : val
    setRating(next)
    start(async () => { await updateAuditionRating(auditionId, roleId, next) })
  }

  const display = hover ?? rating ?? 0

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('rating')}</p>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            disabled={isPending}
            className="p-0.5 transition-colors disabled:opacity-50"
            title={t('ratingStarTitle', { count: i })}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                display >= i
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-200 hover:text-amber-200'
              }`}
            />
          </button>
        ))}
        {rating && (
          <button
            onClick={() => { setRating(null); start(async () => { await updateAuditionRating(auditionId, roleId, null) }) }}
            disabled={isPending}
            className="ml-1.5 text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
          >
            {t('ratingReset')}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Re-audition panel ──────────────────────────────────────────────

function ReAuditionPanel({ token, invitePhone, siteUrl }: {
  token: string; invitePhone: string | null; siteUrl: string
}) {
  const t = useTranslations('auditions')
  const [open, setOpen]       = useState(false)
  const [message, setMessage] = useState('')

  const inviteUrl = `${siteUrl}/oyuncu/${token}`
  const fullMsg   = message.trim()
    ? `Merhaba! Ek bir video çekimi talep ediyoruz:\n\n${message.trim()}\n\nAynı linkten yeni videonuzu yükleyebilirsiniz:\n${inviteUrl}`
    : `Merhaba! Ek bir video çekimi talep ediyoruz. Aynı linkten yükleyebilirsiniz:\n${inviteUrl}`
  const waLink = invitePhone
    ? `https://wa.me/${invitePhone.replace(/\D/g, '')}?text=${encodeURIComponent(fullMsg)}`
    : null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> {t('reAudition')}
        </p>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          {open ? t('reAuditionClose') : t('reAuditionOpen')}
        </button>
      </div>
      {open && (
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('reAuditionPlaceholder')}
            rows={3}
            className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-indigo-300 placeholder-gray-300"
          />
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg py-2 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> {t('reAuditionWhatsapp')}
            </a>
          ) : (
            <button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              className="flex items-center justify-center gap-1.5 w-full bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-lg py-2 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> {t('reAuditionCopyLink')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Status selector ────────────────────────────────────────────────

function StatusSelector({ auditionId, roleId, current }: {
  auditionId: string; roleId: string; current: string
}) {
  const t = useTranslations('auditions')
  const [status, setStatus] = useState(current)
  const [isPending, start]  = useTransition()
  const router = useRouter()

  const STATUS_OPTIONS = [
    { value: 'pending',     label: t('status.pending'),     bg: 'bg-gray-100 text-gray-600' },
    { value: 'reviewing',   label: t('status.reviewing'),   bg: 'bg-yellow-50 text-yellow-700' },
    { value: 'shortlisted', label: t('status.shortlisted'), bg: 'bg-indigo-50 text-indigo-600' },
    { value: 'rejected',    label: t('status.rejected'),    bg: 'bg-red-50 text-red-500' },
    { value: 'selected',    label: t('status.selected'),    bg: 'bg-green-50 text-green-600' },
  ]

  function handleChange(val: string) {
    setStatus(val)
    start(async () => {
      await updateAuditionStatus(auditionId, roleId, val)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('statusLabel')}</p>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map(o => (
          <button key={o.value} onClick={() => handleChange(o.value)} disabled={isPending}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              status === o.value ? `${o.bg} border-transparent` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Notes panel ────────────────────────────────────────────────────

function NotesPanel({ auditionId, roleId, initialNotes }: {
  auditionId: string; roleId: string; initialNotes: string | null
}) {
  const t = useTranslations('auditions')
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saved, setSaved]  = useState(false)
  const [isPending, start] = useTransition()
  const router = useRouter()

  const NOTE_PRESETS = [
    { icon: '✓', text: t('notePresets.strongPerformance') },
    { icon: '✓', text: t('notePresets.stagePresence') },
    { icon: '~', text: t('notePresets.openToDirection') },
    { icon: '~', text: t('notePresets.reviewAgain') },
    { icon: '✗', text: t('notePresets.outOfCasting') },
  ]

  function applyPreset(text: string) {
    setNotes(prev => prev ? `${prev}\n${text}` : text)
    setSaved(false)
  }

  function handleSave() {
    start(async () => {
      await updateAuditionNotes(auditionId, roleId, notes)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('notes')}</p>
      <div className="flex flex-wrap gap-1">
        {NOTE_PRESETS.map(p => (
          <button key={p.text} onClick={() => applyPreset(p.text)}
            className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {p.text}
          </button>
        ))}
      </div>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        placeholder={t('notesPlaceholder')}
        rows={4}
        className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-indigo-400 transition-colors placeholder-gray-300"
      />
      <button onClick={handleSave} disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
      >
        {isPending
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('notesSaving')}</>
          : saved
          ? <><Check className="w-3.5 h-3.5" /> {t('notesSaved')}</>
          : <><Save className="w-3.5 h-3.5" /> {t('notesSave')}</>}
      </button>
    </div>
  )
}

// ── Tags panel ─────────────────────────────────────────────────────

function TagsPanel({ auditionId, roleId, initialTags }: {
  auditionId: string; roleId: string; initialTags: TagEntry[]
}) {
  const t = useTranslations('auditions')
  const [tags, setTags]       = useState<TagEntry[]>(initialTags)
  const [orgTags, setOrgTags] = useState<TagEntry[]>([])
  const [input, setInput]     = useState('')
  const [open, setOpen]       = useState(false)
  const [isPending, start]    = useTransition()
  const router = useRouter()

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  useEffect(() => {
    supabase.from('tags').select('id, name').order('name')
      .then(({ data }) => setOrgTags(data ?? []))
  }, [supabase])

  const suggestions = orgTags.filter(tg =>
    !tags.find(ct => ct.id === tg.id) &&
    tg.name.includes(input.toLowerCase().trim())
  )

  function addTag(name: string) {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed || tags.find(tg => tg.name === trimmed)) { setOpen(false); setInput(''); return }
    start(async () => {
      const { tag, error } = await addAuditionTag(auditionId, roleId, trimmed)
      if (error || !tag) return
      setTags(prev => [...prev, tag])
      setOrgTags(prev => prev.find(tg => tg.id === tag.id) ? prev : [...prev, tag].sort((a,b) => a.name.localeCompare(b.name)))
      setInput('')
      setOpen(false)
      router.refresh()
    })
  }

  function removeTag(tagId: string) {
    setTags(prev => prev.filter(tg => tg.id !== tagId))
    start(async () => {
      await removeAuditionTag(auditionId, tagId, roleId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
        <Tag className="w-3 h-3" /> {t('tags')}
      </p>
      <div className="flex flex-wrap gap-1 items-center">
        {tags.map(tg => (
          <span key={tg.id} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${tagStyle(tg.name)}`}>
            {tg.name}
            <button onClick={() => removeTag(tg.id)} className="hover:opacity-70 transition-opacity ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <div className="relative">
          <button
            onClick={() => { setOpen(v => !v); setInput('') }}
            className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            <Plus className="w-2.5 h-2.5" /> {t('tagsAdd')}
          </button>
          {open && (
            <div className="absolute left-0 top-7 z-20 bg-white rounded-xl shadow-lg border border-gray-200 w-52 overflow-hidden">
              <input
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(input); if (e.key === 'Escape') setOpen(false) }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder={t('tagsPlaceholder')}
                className="w-full text-xs px-3 py-2 border-b border-gray-100 focus:outline-none"
              />
              <div className="max-h-36 overflow-y-auto">
                {suggestions.map(tg => (
                  <button key={tg.id} onMouseDown={() => addTag(tg.name)} disabled={isPending}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                  >
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${tagStyle(tg.name)}`}>{tg.name}</span>
                  </button>
                ))}
                {input.trim() && !orgTags.find(tg => tg.name === input.trim().toLowerCase()) && (
                  <button onMouseDown={() => addTag(input)} disabled={isPending}
                    className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> &quot;{input.trim()}&quot; {t('tagsCreate', { name: '' }).replace('""', '').trim()}
                  </button>
                )}
                {suggestions.length === 0 && !input.trim() && (
                  <p className="px-3 py-2 text-xs text-gray-400">{t('tagsTypeToSearch')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Timestamp notes panel ──────────────────────────────────────────

type VideoNote = { id: string; timestamp_seconds: number; note: string }

function TimestampNotesPanel({ videoId, roleId, getTime, seekTo }: {
  videoId: string
  roleId: string
  getTime: () => number
  seekTo: (ts: number) => void
}) {
  const t = useTranslations('auditions')
  const tc = useTranslations('common')
  const [notes, setNotes]       = useState<VideoNote[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [draft, setDraft]       = useState('')
  const [captured, setCaptured] = useState<number | null>(null)
  const [isPending, start]      = useTransition()
  const router = useRouter()

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  useEffect(() => {
    setLoading(true)
    setNotes([])
    setAdding(false)
    supabase
      .from('video_notes')
      .select('id, timestamp_seconds, note')
      .eq('audition_video_id', videoId)
      .order('timestamp_seconds')
      .then(({ data }) => { setNotes(data ?? []); setLoading(false) })
  }, [videoId, supabase])

  function startAdding() {
    setCaptured(Math.floor(getTime()))
    setDraft('')
    setAdding(true)
  }

  function handleAdd() {
    if (!draft.trim() || captured === null) return
    start(async () => {
      const { id, error } = await addVideoNote(videoId, roleId, captured, draft)
      if (error || !id) return
      setNotes(prev =>
        [...prev, { id, timestamp_seconds: captured, note: draft }]
          .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
      )
      setAdding(false)
      setDraft('')
      router.refresh()
    })
  }

  function handleDelete(noteId: string) {
    setNotes(prev => prev.filter(n => n.id !== noteId))
    start(async () => {
      await deleteVideoNote(noteId, roleId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Bookmark className="w-3 h-3" /> {t('timestampNotes')}
        </p>
        <button onClick={startAdding}
          className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-0.5"
        >
          <Plus className="w-2.5 h-2.5" /> {t('timestampAddNow')}
        </button>
      </div>

      {adding && (
        <div className="bg-gray-50 rounded-xl p-2.5 space-y-2 border border-gray-100">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {captured !== null ? fmt(captured) : '—'}
          </p>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            placeholder={t('timestampNotePlaceholder')}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white"
          />
          <div className="flex gap-1.5">
            <button onClick={handleAdd} disabled={isPending || !draft.trim()}
              className="flex-1 text-xs px-2 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t('timestampSave')}
            </button>
            <button onClick={() => setAdding(false)}
              className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
            >
              {tc('cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-300">{t('timestampLoading')}</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-gray-300">{t('timestampNoNotes')}</p>
      ) : (
        <div className="space-y-1.5">
          {notes.map(n => (
            <div key={n.id} className="flex items-start gap-2 group">
              <button onClick={() => seekTo(n.timestamp_seconds)}
                className="flex-shrink-0 text-[10px] font-mono font-semibold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors mt-0.5"
              >
                {fmt(n.timestamp_seconds)}
              </button>
              <span className="flex-1 text-xs text-gray-600 leading-relaxed">{n.note}</span>
              <button onClick={() => handleDelete(n.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────

interface Props {
  auditions: VideoAudition[]
  startIndex: number
  roleId: string
  siteUrl: string
  onClose: () => void
}

export function VideoModal({ auditions, startIndex, roleId, siteUrl, onClose }: Props) {
  const t = useTranslations('auditions')
  const tc = useTranslations('common')
  const [idx, setIdx]       = useState(startIndex)
  const [vidIdx, setVidIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const videoRef            = useRef<HTMLVideoElement>(null)
  const router              = useRouter()
  const [, startDelete]     = useTransition()

  const audition  = auditions[idx]
  const video     = audition.audition_videos[vidIdx] ?? audition.audition_videos[0]
  const name      = audition.talent?.full_name ?? audition.talent_name ?? '—'
  const inviteUrl = `${siteUrl}/oyuncu/${audition.token}`
  const waLink    = audition.invite_phone
    ? `https://wa.me/${audition.invite_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Merhaba! Casting davetiniz hazır:\n${inviteUrl}`
      )}`
    : null

  function go(delta: number) {
    setIdx((idx + delta + auditions.length) % auditions.length)
    setVidIdx(0)
  }

  useEffect(() => {
    if (videoRef.current) videoRef.current.load()
  }, [idx, vidIdx])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const getTime = useCallback(() => videoRef.current?.currentTime ?? 0, [])
  const seekTo  = useCallback((ts: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = ts
    videoRef.current.play()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {audition.talent ? (
              <Link
                href={`/oyuncular/${audition.talent.id}`}
                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate"
                onClick={onClose}
              >
                {name}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900 truncate">{name}</span>
            )}
            {video?.duration_seconds && (
              <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {fmt(video.duration_seconds)}
              </span>
            )}
            {audition.audition_videos.length > 1 && (
              <span className="text-xs text-gray-300 flex-shrink-0">
                {vidIdx + 1}/{audition.audition_videos.length} video
              </span>
            )}
            {audition.submitted_at && (
              <span className="text-xs text-gray-400 flex-shrink-0">
                {new Date(audition.submitted_at).toLocaleDateString('tr-TR')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {video && (
              <button
                onClick={() => {
                  if (!confirm(t('deleteVideoConfirm'))) return
                  const id = video.id
                  startDelete(async () => {
                    await deleteVideo(id, roleId)
                    router.refresh()
                  })
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title={t('deleteVideo')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {auditions.length > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => go(-1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Önceki (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400 tabular-nums w-10 text-center">
                  {idx + 1} / {auditions.length}
                </span>
                <button onClick={() => go(1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Sonraki (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video sekmeleri — sadece birden fazla video varsa */}
        {audition.audition_videos.length > 1 && (
          <div className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-950 border-b border-white/5 flex-shrink-0 overflow-x-auto">
            {audition.audition_videos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setVidIdx(i)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                  i === vidIdx
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
                }`}
              >
                Video {i + 1}
                {v.duration_seconds && (
                  <span className={i === vidIdx ? 'opacity-70' : 'opacity-50'}>
                    {fmt(v.duration_seconds)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Video */}
          <div className="flex-1 bg-black flex items-center justify-center min-w-0">
            {video?.public_url ? (
              <video ref={videoRef} controls className="max-h-full max-w-full w-full" style={{ aspectRatio: '16/9' }}>
                <source src={video.public_url} />
              </video>
            ) : (
              <div className="text-white/30 text-sm">{t('videoNotFound')}</div>
            )}
          </div>

          {/* Right panel */}
          <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col overflow-y-auto">
            <div className="p-5 space-y-5 divide-y divide-gray-50">
              <div className="space-y-5">
                <RatingSelector auditionId={audition.id} roleId={roleId} initial={audition.rating} />
                <StatusSelector auditionId={audition.id} roleId={roleId} current={audition.status} />
                <TagsPanel auditionId={audition.id} roleId={roleId} initialTags={audition.tags} />
                <NotesPanel auditionId={audition.id} roleId={roleId} initialNotes={audition.notes} />
              </div>

              {video && (
                <div className="pt-5">
                  <TimestampNotesPanel
                    videoId={video.id}
                    roleId={roleId}
                    getTime={getTime}
                    seekTo={seekTo}
                  />
                </div>
              )}

              <div className="pt-5">
                <ReAuditionPanel token={audition.token} invitePhone={audition.invite_phone} siteUrl={siteUrl} />
              </div>

              <div className="pt-5 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('connectionLabel')}</p>
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2">
                  <span className="text-xs text-gray-500 flex-1 truncate">{inviteUrl}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    className="flex-shrink-0 text-gray-400 hover:text-indigo-500 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full justify-center bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg py-2 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> {t('whatsappOpen')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
