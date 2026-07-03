import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RolAuditions } from './RolAuditions'
import { RolStatusSelect } from './RolStatusSelect'
import { CopyPublicLinkButton } from './CopyPublicLinkButton'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, User, Calendar, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function RolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const tr = await getTranslations('roles')
  const ta = await getTranslations('auditions')

  const GENDER_LABELS: Record<string, string> = {
    erkek: tr('gender.erkek'), kadin: tr('gender.kadin'), diger: tr('gender.diger'),
  }

  const [{ data: role }, { data: talents }] = await Promise.all([
    supabase
      .from('project_roles')
      .select('*, projects(id, title, type, status)')
      .eq('id', id)
      .single(),
    supabase
      .from('talent')
      .select('id, full_name, phone, email')
      .order('full_name'),
  ])

  // Auditions: tam sorgu (migration 015 gerektirir — notes_updated_by, profiles FK)
  let { data: auditions, error: auditionsError } = await supabase
    .from('auditions')
    .select('id, status, notes, rating, notes_updated_by, notes_updated_at, submitted_at, talent_name, talent_email, invite_phone, token, sort_order, talent(id, full_name), audition_videos(id, public_url, storage_path, uploaded_at, duration_seconds), profiles!auditions_notes_author_fkey(full_name)')
    .eq('role_id', id)
    .order('sort_order', { ascending: true })

  if (auditionsError) {
    console.error('[roller/[id]/page] Tam sorgu başarısız (migration 015 uygulandı mı?):', auditionsError.message, auditionsError.code, auditionsError.hint)

    // Fallback — migration 015 olmadan çalışan basit sorgu
    const fallback = await supabase
      .from('auditions')
      .select('id, status, notes, rating, submitted_at, talent_name, talent_email, invite_phone, token, sort_order, talent(id, full_name), audition_videos(id, public_url, storage_path, uploaded_at, duration_seconds)')
      .eq('role_id', id)
      .order('sort_order', { ascending: true })

    if (fallback.error) {
      console.error('[roller/[id]/page] Fallback sorgu da başarısız:', fallback.error.message, fallback.error.code)
    } else {
      console.log('[roller/[id]/page] Fallback sorgu başarılı — migration 015 henüz uygulanmamış, not yazar bilgisi gösterilmeyecek.')
    }

    auditions = fallback.data
    auditionsError = fallback.error
  }

  // Tags — migration 016 uygulanmamışsa bu başarısız olur, sessizce atlanır
  const { data: auditionTagsRaw, error: tagsError } = await supabase
    .from('audition_tags')
    .select('audition_id, tags(id, name)')
    .in('audition_id', (auditions ?? []).map((a: { id: string }) => a.id))

  if (tagsError) {
    console.error('[roller/[id]/page] audition_tags sorgusu başarısız (migration 016 uygulandı mı?):', tagsError.message)
  }

  // tags'i audition bazında grupla
  const tagsByAudition: Record<string, { id: string; name: string }[]> = {}
  for (const row of (auditionTagsRaw ?? []) as { audition_id: string; tags: { id: string; name: string } | null }[]) {
    if (!row.tags) continue
    if (!tagsByAudition[row.audition_id]) tagsByAudition[row.audition_id] = []
    tagsByAudition[row.audition_id].push(row.tags)
  }

  const auditionsWithTags = (auditions ?? []).map((a: { id: string } & Record<string, unknown>) => ({
    ...a,
    audition_tags: (tagsByAudition[a.id] ?? []).map(t => ({ tags: t })),
  }))

  if (!role) notFound()

  const project = role.projects as { id: string; title: string } | null
  const ageLabel = role.age_min && role.age_max
    ? `${role.age_min}–${role.age_max} yaş`
    : role.age_min ? `${role.age_min}+` : role.age_max ? `≤${role.age_max}` : null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center px-6 pt-6 pb-0">
        <Link href="/roller" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {tr('backToRoles')}
        </Link>
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <RolStatusSelect roleId={id} projectId={project?.id ?? null} currentStatus={role.status} />
          {project && (
            <Link href={`/projeler/${project.id}`} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
              {project.title}
            </Link>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>

        {/* Public apply link */}
        {role.public_token && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">{tr('publicLink')}:</span>
            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 max-w-[280px] truncate">
              {`${siteUrl}/basvur/${role.public_token}`}
            </code>
            <CopyPublicLinkButton url={`${siteUrl}/basvur/${role.public_token}`} />
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
          {role.gender && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400" />
              {GENDER_LABELS[role.gender] ?? role.gender}
            </span>
          )}
          {ageLabel && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              {ageLabel}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            {ta('candidateCount', { count: auditions?.length ?? 0 })}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {role.description && (
          <div className="sb-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{tr('roleDescription')}</h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{role.description}</p>
          </div>
        )}

        {role.notes && (
          <div className="sb-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{tr('notes')}</h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{role.notes}</p>
          </div>
        )}

        {/* Auditions — client component (davet modal + status update) */}
        <RolAuditions
          roleId={id}
          roleName={role.name}
          auditions={auditionsWithTags as any[]}
          talents={(talents ?? []) as any[]}
          siteUrl={siteUrl}
        />
      </div>
    </div>
  )
}
