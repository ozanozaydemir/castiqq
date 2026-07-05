import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { deleteOyuncu } from '@/app/actions/talent'
import { DeleteButton } from '@/components/DeleteButton'
import { AvailabilitySelector } from './AvailabilitySelector'
import { AddToCollectionButton } from './AddToCollectionButton'
import type { TalentLanguage, TalentExperience, TalentEducation } from '@/types/database'
import { Link } from '@/i18n/navigation'
import {
  ArrowLeft, Pencil, MapPin, Phone, Mail, Building2, User,
  Ruler, Globe, Star, GraduationCap,
  Clapperboard, Play, Mic, Film, Banknote, Users,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { MediaEmbed } from './MediaEmbed'

const LANG_LEVEL_LABELS: Record<string, string> = {
  native: 'Ana dil', C2: 'C2', C1: 'C1', B2: 'B2', B1: 'B1', A2: 'A2', A1: 'A1',
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="sb-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  )
}

function InitialsAvatar({ name, size = 'lg' }: { name: string; size?: 'lg' | 'xl' }) {
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)
  const colors = ['bg-indigo-100 text-indigo-600', 'bg-purple-100 text-purple-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600']
  const color = colors[name.charCodeAt(0) % colors.length]
  const sz = size === 'xl' ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-base'
  return (
    <div className={`rounded-2xl flex items-center justify-center font-bold ${color} ${sz}`}>
      {initials.toUpperCase()}
    </div>
  )
}

export default async function OyuncuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('talent')

  const GENDER_LABELS: Record<string, string> = {
    erkek: (await getTranslations('roles.gender'))('erkek'),
    kadin: (await getTranslations('roles.gender'))('kadin'),
    diger: (await getTranslations('roles.gender'))('diger'),
  }

  const ROLE_TYPE_LABELS: Record<string, string> = {
    lead: 'Başrol', supporting: 'Yardımcı', guest: 'Yan Rol',
    cameo: 'Konuk', ad: 'Reklam', extra: 'Figürasyon', voiceover: 'Seslendirme',
  }

  const PROD_TYPE_LABELS: Record<string, string> = {
    film: 'Film', dizi: 'Dizi', reklam: 'Reklam', tiyatro: 'Tiyatro', diger: 'Diğer',
  }

  const { data: rawTalent } = await supabase.from('talent').select('*').eq('id', id).single()
  if (!rawTalent) notFound()
  const talent = rawTalent as typeof rawTalent & { skills: string[]; licenses: string[] }

  const [langRes, expRes, eduRes, audRes, colRes] = await Promise.all([
    supabase.from('talent_languages').select('*').eq('talent_id', id).order('sort_order'),
    supabase.from('talent_experiences').select('*').eq('talent_id', id).order('sort_order'),
    supabase.from('talent_education').select('*').eq('talent_id', id).order('sort_order'),
    supabase.from('auditions')
      .select('id, status, notes, submitted_at, project_roles(id, name, projects(id, title)), audition_videos(id)')
      .eq('talent_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('collections').select('id, name').order('name'),
  ])
  const languages = (langRes.data ?? []) as TalentLanguage[]
  const experiences = (expRes.data ?? []) as TalentExperience[]
  const education = (eduRes.data ?? []) as TalentEducation[]

  type AudRow = {
    id: string
    status: string
    notes: string | null
    submitted_at: string | null
    project_roles: { id: string; name: string; projects: { id: string; title: string } | null } | null
    audition_videos: { id: string }[]
  }
  const audList: AudRow[] = (audRes.data ?? []) as AudRow[]
  const collections = (colRes.data ?? []) as { id: string; name: string }[]
  const totalAuditions = audList.length
  const callbackCount = audList.filter(a => a.status === 'shortlisted' || a.status === 'selected').length
  const callbackRate = totalAuditions > 0 ? Math.round((callbackCount / totalAuditions) * 100) : null

  const delAction = deleteOyuncu.bind(null, talent.id)

  const audStatusMap: Record<string, { label: string; color: string }> = {
    candidate:   { label: t('auditionStatus.candidate'),   color: 'bg-gray-100 text-gray-600' },
    pending:     { label: t('auditionStatus.pending'),     color: 'bg-amber-50 text-amber-600' },
    reviewing:   { label: t('auditionStatus.reviewing'),   color: 'bg-yellow-50 text-yellow-700' },
    shortlisted: { label: t('auditionStatus.shortlisted'), color: 'bg-indigo-50 text-indigo-600' },
    rejected:    { label: t('auditionStatus.rejected'),    color: 'bg-red-50 text-red-500' },
    selected:    { label: t('auditionStatus.selected'),    color: 'bg-green-50 text-green-600' },
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <Link href="/oyuncular" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('pool')}
        </Link>
        <div className="flex items-center gap-2">
          <AddToCollectionButton talentId={talent.id} collections={collections} />
          <DeleteButton
            action={delAction}
            confirmMessage={t('deleteConfirm')}
          />
          <Link href={`/oyuncular/${id}/duzenle`} className="sb-btn-primary">
            <Pencil className="w-3.5 h-3.5" /> {(await getTranslations('common'))('edit')}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Profil görseli: ilk fotoğraf ya da initials avatar */}
          {(talent.photos as string[] | null)?.[0] ? (
            <div className="w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
              <img
                src={(talent.photos as string[])[0]}
                alt={talent.full_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <InitialsAvatar name={talent.full_name} size="xl" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{talent.full_name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                  {talent.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{talent.city}</span>}
                  {talent.gender && <span>{GENDER_LABELS[talent.gender] ?? talent.gender}</span>}
                  {talent.birth_year && <span>{new Date().getFullYear() - talent.birth_year} yaş ({talent.birth_year})</span>}
                </div>
              </div>
              <AvailabilitySelector talentId={talent.id} value={talent.availability} />
            </div>
            {/* Contact row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
              {talent.phone && <a href={`tel:${talent.phone}`} className="flex items-center gap-1 hover:text-gray-600"><Phone className="w-3 h-3" />{talent.phone}</a>}
              {talent.email && <a href={`mailto:${talent.email}`} className="flex items-center gap-1 hover:text-gray-600"><Mail className="w-3 h-3" />{talent.email}</a>}
              {talent.agency_name && <span className="flex items-center gap-1 text-indigo-500 font-medium"><Building2 className="w-3 h-3" />{talent.agency_name}</span>}
              {talent.manager_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{talent.manager_name}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {totalAuditions > 0 && (
        <div className="px-6 mb-4">
          <div className="flex gap-4 p-3 bg-gray-50 rounded-xl text-sm">
            <span className="text-gray-500">{t('totalAuditions')}: <strong className="text-gray-900">{totalAuditions}</strong></span>
            {callbackRate !== null && (
              <span className="text-gray-500">{t('callbackRate')}: <strong className="text-gray-900">%{callbackRate}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Fotoğraf galerisi */}
          {(talent.photos as string[] | null) && (talent.photos as string[]).length > 0 && (
            <div className="sb-card overflow-hidden">
              <div className={`grid gap-0.5 ${
                (talent.photos as string[]).length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {(talent.photos as string[]).slice(0, 4).map((url, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden ${
                      (talent.photos as string[]).length === 3 && i === 0 ? 'row-span-2' : ''
                    }`}
                    style={{ aspectRatio: '2/3' }}
                  >
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 py-1 px-2 bg-gradient-to-t from-black/60 to-transparent">
                        <span className="text-[9px] text-white/70 font-medium">{t('coverPhoto')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Physical */}
          <Section title={t('physicalTraits')} icon={<Ruler className="w-4 h-4" />}>
            <div>
              <MetaRow label={t('playableAge')} value={
                talent.playable_age_min && talent.playable_age_max
                  ? `${talent.playable_age_min}–${talent.playable_age_max}`
                  : talent.playable_age_min ? `${talent.playable_age_min}+`
                  : talent.playable_age_max ? `≤${talent.playable_age_max}`
                  : null
              } />
              <MetaRow label={t('height')} value={talent.height_cm ? `${talent.height_cm} cm` : null} />
              <MetaRow label={t('weight')} value={talent.weight_kg ? `${talent.weight_kg} kg` : null} />
              <MetaRow label={t('eyeColor')} value={talent.eye_color} />
              <MetaRow label={t('hairColor')} value={talent.hair_color} />
              <MetaRow label={t('hairLength')} value={talent.hair_length} />
            </div>
          </Section>

          {/* Languages */}
          {languages.length > 0 && (
            <Section title={t('languages')} icon={<Globe className="w-4 h-4" />}>
              <div className="space-y-2">
                {languages.map(lang => (
                  <div key={lang.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{lang.language}</p>
                      {lang.accents && <p className="text-xs text-gray-400 mt-0.5">{lang.accents}</p>}
                    </div>
                    <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md flex-shrink-0">
                      {LANG_LEVEL_LABELS[lang.level] ?? lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Fee */}
          {talent.fee_type && (
            <Section title={t('fee')} icon={<Banknote className="w-4 h-4" />}>
              <div>
                <MetaRow label={t('feeType')} value={
                  { daily: 'Günlük', weekly: 'Haftalık', per_episode: 'Bölüm Başı', monthly: 'Aylık', per_project: 'Proje Bazlı', hourly: 'Saatlik' }[talent.fee_type as string] ?? talent.fee_type
                } />
                <MetaRow label={t('feeAmount')} value={
                  talent.fee_amount
                    ? `${talent.fee_amount.toLocaleString('tr-TR')} ${talent.fee_currency ?? 'TRY'}`
                    : null
                } />
                <MetaRow label={t('feeNotes')} value={talent.fee_notes} />
              </div>
            </Section>
          )}

          {/* Skills & Licenses */}
          {((talent.skills?.length ?? 0) > 0 || (talent.licenses?.length ?? 0) > 0) && (
            <Section title={t('skillsAndDocs')} icon={<Star className="w-4 h-4" />}>
              {talent.skills && talent.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {talent.skills.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium">{s}</span>
                  ))}
                </div>
              )}
              {talent.licenses && talent.licenses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {talent.licenses.map((l: string) => (
                    <span key={l} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{l}</span>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Experience */}
          {experiences.length > 0 && (
            <Section title={t('experience')} icon={<Film className="w-4 h-4" />}>
              <div className="space-y-3">
                {experiences.map(exp => (
                  <div key={exp.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{exp.project_name}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{exp.year ?? ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {exp.role_name && <span className="text-xs text-gray-600">{exp.role_name}</span>}
                      {exp.role_type && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[11px] font-medium">
                          {ROLE_TYPE_LABELS[exp.role_type] ?? exp.role_type}
                        </span>
                      )}
                      {exp.production_type && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[11px]">
                          {PROD_TYPE_LABELS[exp.production_type] ?? exp.production_type}
                        </span>
                      )}
                    </div>
                    {(exp.director || exp.production_company) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {[exp.director, exp.production_company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <Section title={t('education')} icon={<GraduationCap className="w-4 h-4" />}>
              <div className="space-y-2">
                {education.map(edu => (
                  <div key={edu.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{edu.school}</p>
                      {edu.program && <p className="text-xs text-gray-400">{edu.program}</p>}
                    </div>
                    {edu.year && <span className="text-xs text-gray-400 flex-shrink-0">{edu.year}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Media */}
          {(talent.showreel_url || talent.voice_sample_url || talent.selftape_drama_url || talent.selftape_comedy_url || talent.selftape_ad_url) && (
            <Section title={t('media')} icon={<Play className="w-4 h-4" />}>
              <div className="space-y-3">
                {talent.showreel_url && (
                  <MediaEmbed url={talent.showreel_url} label="Showreel" icon={<Clapperboard className="w-3.5 h-3.5" />} />
                )}
                {talent.voice_sample_url && (
                  <MediaEmbed url={talent.voice_sample_url} label="Ses Örneği" icon={<Mic className="w-3.5 h-3.5" />} />
                )}
                {talent.selftape_drama_url && (
                  <MediaEmbed url={talent.selftape_drama_url} label="Self-tape: Drama" icon={<Play className="w-3.5 h-3.5" />} />
                )}
                {talent.selftape_comedy_url && (
                  <MediaEmbed url={talent.selftape_comedy_url} label="Self-tape: Komedi" icon={<Play className="w-3.5 h-3.5" />} />
                )}
                {talent.selftape_ad_url && (
                  <MediaEmbed url={talent.selftape_ad_url} label="Self-tape: Reklam" icon={<Play className="w-3.5 h-3.5" />} />
                )}
              </div>
            </Section>
          )}

          {/* Notes */}
          {talent.notes && (
            <Section title={t('internalNotes')} icon={<User className="w-4 h-4" />}>
              <p className="text-sm text-gray-600 leading-relaxed">{talent.notes}</p>
            </Section>
          )}

          {/* Adaylıklar */}
          {audList.length > 0 && (
            <Section title={t('candidacies')} icon={<Users className="w-4 h-4" />}>
              <div className="space-y-2">
                {audList.map(a => {
                  const role = a.project_roles
                  const project = role?.projects
                  const st = audStatusMap[a.status] ?? { label: a.status, color: 'bg-gray-100 text-gray-500' }
                  return (
                    <div key={a.id} className="py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          {role ? (
                            <Link href={`/roller/${role.id}`} className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate block">
                              {role.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                          {project && (
                            <Link href={`/projeler/${project.id}`} className="text-xs text-gray-400 hover:text-gray-600 truncate block mt-0.5">
                              {project.title}
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(a.audition_videos?.length ?? 0) > 0 && (
                            <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
                              {a.audition_videos.length} video
                            </span>
                          )}
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                      {a.notes && (
                        <p className="text-xs text-gray-400 italic mt-1 line-clamp-2">{a.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
