import { getTranslations, getLocale } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { UploadSection } from './UploadSection'
import { Film, User, Calendar, FileText, CalendarClock } from 'lucide-react'

export default async function OyuncuTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = await getTranslations('upload')
  const locale = await getLocale()
  const admin = createAdminClient()

  const { data: audition, error: auditionError } = await admin
    .from('auditions')
    .select(`
      id, status, submitted_at, talent_name, organization_id, retention_until, current_round,
      project_roles (
        id, name, description, gender, age_min, age_max, notes,
        projects ( title, type, deadline )
      ),
      audition_videos ( id, uploaded_at, duration_seconds ),
      audition_scripts ( role_scripts ( id, label, original_name ) )
    `)
    .eq('token', token)
    .single()

  // Sorgu hatasını loglamak şart: sessizce notFound()'a düşmek, service_role
  // GRANT eksikliği gibi sorunları "geçersiz link" gibi gösteriyor ve
  // teşhisi çok zorlaştırıyor (bkz. migration 012 ve 060).
  if (auditionError) {
    console.error('[oyuncu/[token]] audition sorgusu başarısız:',
      auditionError.message, auditionError.code, auditionError.hint)
  }
  if (!audition) notFound()

  const role = audition.project_roles as any
  const project = role?.projects as any
  const existingVideos = (audition.audition_videos as { id: string; uploaded_at: string; duration_seconds: number | null }[] | null) ?? []

  // Yalnızca BU davete gönderilen senaryolar — rolün havuzunun tamamı değil.
  // Supabase iç içe seçimde role_scripts'i dizi olarak döndürebiliyor; iki
  // şekli de tolere ediyoruz.
  type ScriptRow = { id: string; label: string | null; original_name: string }
  type ScriptLink = { role_scripts: ScriptRow | ScriptRow[] | null }
  const scripts = ((audition.audition_scripts as unknown as ScriptLink[] | null) ?? [])
    .flatMap(s => (Array.isArray(s.role_scripts) ? s.role_scripts : s.role_scripts ? [s.role_scripts] : []))

  const currentRound = (audition as { current_round?: number }).current_round ?? 1
  const retentionUntil = (audition as { retention_until: string | null }).retention_until
  const retentionLabel = retentionUntil
    ? new Date(retentionUntil).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null
  const ageLabel = role?.age_min && role?.age_max
    ? t('age', { min: role.age_min, max: role.age_max })
    : role?.age_min ? t('ageMin', { min: role.age_min }) : null

  const GENDER_LABELS: Record<string, string> = {
    erkek: t('genderLabels.erkek'),
    kadin: t('genderLabels.kadin'),
    diger: t('genderLabels.diger'),
  }

  return (
    <div className="space-y-6">
      {/* Karşılama */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-sm text-indigo-600 font-medium mb-1">{project?.title}</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{role?.name}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {role?.gender && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-300" />
              {GENDER_LABELS[role.gender] ?? role.gender}
            </span>
          )}
          {ageLabel && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-300" />
              {ageLabel}
            </span>
          )}
          {project?.deadline && (
            <span className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-gray-300" />
              {t('deadline', { date: new Date(project.deadline).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US') })}
            </span>
          )}
        </div>

        {role?.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('roleDescription')}</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{role.description}</p>
          </div>
        )}

        {role?.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('roleNotes')}</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{role.notes}</p>
          </div>
        )}
      </div>

      {/* Senaryolar — bu davete gönderilenler */}
      {scripts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            {scripts.length > 1 ? t('scriptsPlural', { count: scripts.length }) : t('script')}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {t('scriptInstructions')}
          </p>
          <div className="space-y-2">
            {scripts.map((s, i) => (
              <a
                key={s.id}
                href={`/api/script/${token}/${s.id}`}
                className="flex items-center gap-3 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl px-3.5 py-2.5 transition-colors group"
              >
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-indigo-700 truncate flex-1">
                  {s.label || s.original_name}
                </span>
                <FileText className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Saklama süresi bilgisi */}
      {retentionLabel && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 px-5 py-4 flex items-start gap-2.5">
          <CalendarClock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            {t('retentionNotice', { date: retentionLabel })}
          </p>
        </div>
      )}

      {/* GDPR / Veri bilgilendirmesi */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-4 text-xs text-gray-500 leading-relaxed">
        <span className="font-semibold text-gray-600">{t('privacyTitle')} </span>
        {retentionLabel ? t('privacyBodyWithDate', { date: retentionLabel }) : t('privacyBody')}{' '}
        <a href={locale === 'en' ? '/en/gizlilik' : '/gizlilik'} className="text-indigo-500 hover:underline">
          {t('privacyPolicy')}
        </a>
      </div>

      {/* Callback tur bilgisi */}
      {currentRound > 1 && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 px-5 py-4 flex items-start gap-2.5">
          <span className="text-lg leading-none">🎬</span>
          <p className="text-sm text-indigo-800 font-medium">
            {currentRound}. tur kaydı bekleniyor. Lütfen yeni bir video çekimi yükleyin.
          </p>
        </div>
      )}

      {/* Video yükleme */}
      <UploadSection token={token} initialVideos={existingVideos} round={currentRound} />
    </div>
  )
}
