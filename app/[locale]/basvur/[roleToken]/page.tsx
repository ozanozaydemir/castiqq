import { createAdminClient } from '@/lib/supabase/admin'
import { getTranslations, getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ApplyForm } from './ApplyForm'

export default async function PublicApplyPage({
  params,
}: {
  params: Promise<{ roleToken: string; locale: string }>
}) {
  const { roleToken } = await params
  const locale = await getLocale()
  const t = await getTranslations('applyForm')

  const admin = createAdminClient()
  const { data: role } = await admin
    .from('project_roles')
    .select('id, name, status, is_public, description, age_min, age_max, gender, projects!project_roles_project_id_fkey(title)')
    .eq('public_token', roleToken)
    .single()

  if (!role) notFound()

  const projectRaw = role.projects
  const project = (Array.isArray(projectRaw) ? projectRaw[0] : projectRaw) as { title: string } | null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

  const isClosed = !role.is_public || (role.status !== 'open' && role.status !== 'casting')

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-lg mb-4">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            CastFlow
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
          {project && <p className="text-sm text-gray-500">{project.title}</p>}
        </div>

        {/* Role info */}
        {(role.description || role.age_min || role.age_max || role.gender) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            {role.description && (
              <p className="text-sm text-gray-700">{role.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {role.gender && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                  {role.gender === 'erkek'
                    ? locale === 'en' ? 'Male' : 'Erkek'
                    : role.gender === 'kadin'
                    ? locale === 'en' ? 'Female' : 'Kadın'
                    : locale === 'en' ? 'Other' : 'Diğer'}
                </span>
              )}
              {(role.age_min || role.age_max) && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {role.age_min && role.age_max
                    ? `${role.age_min}–${role.age_max} ${locale === 'en' ? 'years' : 'yaş'}`
                    : role.age_min
                    ? `${role.age_min}+`
                    : `≤${role.age_max}`}
                </span>
              )}
            </div>
          </div>
        )}

        {isClosed ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">{t('closed')}</p>
          </div>
        ) : (
          <ApplyForm
            rolePublicToken={roleToken}
            roleName={role.name}
            projectTitle={project?.title ?? ''}
            siteUrl={siteUrl}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}
