import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { UploadSection } from './UploadSection'
import { Film, User, Calendar, FileText } from 'lucide-react'

export default async function OyuncuTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = await getTranslations('upload')
  const admin = createAdminClient()

  const { data: audition } = await admin
    .from('auditions')
    .select(`
      id, status, submitted_at, talent_name, organization_id,
      project_roles (
        id, name, description, gender, age_min, age_max, notes, script_url,
        projects ( title, type, deadline )
      ),
      audition_videos ( id, uploaded_at, duration_seconds )
    `)
    .eq('token', token)
    .single()

  if (!audition) notFound()

  const role = audition.project_roles as any
  const project = role?.projects as any
  const existingVideos = (audition.audition_videos as { id: string; uploaded_at: string; duration_seconds: number | null }[] | null) ?? []
  const ageLabel = role?.age_min && role?.age_max
    ? `${role.age_min}–${role.age_max} yaş`
    : role?.age_min ? `${role.age_min}+` : null

  const GENDER_LABELS: Record<string, string> = {
    erkek: 'Erkek', kadin: 'Kadın', diger: 'Diğer',
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
              {t('deadline', { date: new Date(project.deadline).toLocaleDateString('tr-TR') })}
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

      {/* Senaryo */}
      {role?.script_url && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            {t('script')}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {t('scriptInstructions')}
          </p>
          <a
            href={`/api/script/${token}`}
            className="sb-btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <FileText className="w-4 h-4" /> {t('downloadScript')}
          </a>
        </div>
      )}

      {/* GDPR / Veri bilgilendirmesi */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-4 text-xs text-gray-500 leading-relaxed">
        <span className="font-semibold text-gray-600">Gizlilik Bildirimi: </span>
        Yüklediğiniz videolar yalnızca casting değerlendirmesi amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz.
        Değerlendirme süreci tamamlandıktan sonra verileriniz silinir.{' '}
        <a href="/gizlilik" className="text-indigo-500 hover:underline">
          Gizlilik Politikası
        </a>
      </div>

      {/* Video yükleme */}
      <UploadSection token={token} initialVideos={existingVideos} />
    </div>
  )
}
