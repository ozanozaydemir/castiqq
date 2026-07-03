import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { ProjectRole } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { RollerSection } from './RollerSection'
import { deleteProje, updateProjeStatus } from '@/app/actions/projects'
import { DeleteButton } from '@/components/DeleteButton'
import { Link } from '@/i18n/navigation'
import {
  ArrowLeft, Pencil, Film, Tv, Megaphone, Theater, Clapperboard,
  Calendar, MapPin, User, Monitor, Users, Layers, ClipboardList, Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { getTranslations } from 'next-intl/server'

function formatDate(d: string | null) {
  if (!d) return null
  return format(new Date(d), 'd MMMM yyyy', { locale: tr })
}

export default async function ProjeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('projects')

  const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'indigo' | 'purple' | 'yellow' | 'green' | 'default' }> = {
    film:    { label: t('typeFilm'),    icon: <Film className="w-3.5 h-3.5" />,         variant: 'indigo' },
    dizi:    { label: t('typeDizi'),    icon: <Tv className="w-3.5 h-3.5" />,           variant: 'purple' },
    reklam:  { label: t('typeReklam'), icon: <Megaphone className="w-3.5 h-3.5" />,    variant: 'yellow' },
    tiyatro: { label: t('typeTiyatro'), icon: <Theater className="w-3.5 h-3.5" />,     variant: 'green' },
    diger:   { label: t('typeDiger'),   icon: <Clapperboard className="w-3.5 h-3.5" />, variant: 'default' },
  }

  const STATUS_CONFIG: Record<string, { label: string; variant: 'green' | 'indigo' | 'default' }> = {
    active:    { label: t('statusActive'),    variant: 'green' },
    completed: { label: t('statusCompleted'), variant: 'indigo' },
    archived:  { label: t('statusArchived'),  variant: 'default' },
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: roles } = await supabase
    .from('project_roles')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const roleList: ProjectRole[] = roles ?? []
  const roleIds = roleList.map(r => r.id)

  const auditionsResult = roleIds.length > 0
    ? await supabase.from('auditions').select('role_id, status').in('role_id', roleIds)
    : { data: [] as { role_id: string; status: string }[] }

  type AuditionRow = { role_id: string; status: string }
  const auditionList: AuditionRow[] = (auditionsResult.data ?? []) as AuditionRow[]

  const auditionCounts = auditionList.reduce((acc: Record<string, number>, a) => {
    acc[a.role_id] = (acc[a.role_id] ?? 0) + 1
    return acc
  }, {})

  const pendingCount = auditionList.filter(a => a.status === 'pending').length
  const totalAuditions = auditionList.length
  const openRoles = roleList.filter(r => r.status === 'open').length

  const typeCfg = TYPE_CONFIG[project.type] ?? TYPE_CONFIG.diger
  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active

  const archiveAction  = updateProjeStatus.bind(null, project.id, 'archived')
  const activateAction = updateProjeStatus.bind(null, project.id, 'active')
  const deleteAction   = deleteProje.bind(null, project.id)

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <Link href="/projeler" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('title')}
        </Link>

        <div className="flex items-center gap-2">
          {project.status === 'active' && (
            <form action={archiveAction}>
              <button type="submit" className="sb-btn-secondary text-xs">
                {t('archive')}
              </button>
            </form>
          )}
          {project.status === 'archived' && (
            <form action={activateAction}>
              <button type="submit" className="sb-btn-secondary text-xs text-green-600 hover:text-green-700">
                {t('unarchive')}
              </button>
            </form>
          )}
          <DeleteButton
            action={deleteAction}
            confirmMessage={t('deleteConfirm')}
          />
          <Link href={`/projeler/${project.id}/duzenle`} className="sb-btn-primary">
            <Pencil className="w-3.5 h-3.5" />
            {t('update')}
          </Link>
        </div>
      </div>

      {/* Hero header */}
      <div className="px-6 pt-5 pb-6">
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.title}</h1>
          <div className="flex items-center gap-1.5 mt-1 flex-shrink-0">
            <Badge variant={typeCfg.variant}>
              <span className="flex items-center gap-1">{typeCfg.icon}{typeCfg.label}</span>
            </Badge>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
          {project.platform && (
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-gray-400" />
              {project.platform}
            </span>
          )}
          {project.director && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {project.director}
            </span>
          )}
          {project.deadline && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {t('deadlineLabel2')} {formatDate(project.deadline)}
            </span>
          )}
          {(project.shooting_start || project.shooting_end) && (
            <span className="flex items-center gap-1.5">
              <Clapperboard className="w-3.5 h-3.5 text-gray-400" />
              {project.shooting_start && formatDate(project.shooting_start)}
              {project.shooting_start && project.shooting_end && ' – '}
              {project.shooting_end && formatDate(project.shooting_end)}
            </span>
          )}
          {project.shooting_location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {project.shooting_location}
            </span>
          )}
        </div>

        {project.description && (
          <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-2xl">{project.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 mb-6">
        {[
          { icon: <Layers className="w-5 h-5 text-indigo-500" />, value: roleList.length, label: t('statsRoles'), bg: 'bg-indigo-50' },
          { icon: <Users className="w-5 h-5 text-blue-500" />, value: openRoles, label: t('statsOpenRoles'), bg: 'bg-blue-50' },
          { icon: <ClipboardList className="w-5 h-5 text-green-500" />, value: totalAuditions, label: t('statsApplications'), bg: 'bg-green-50' },
          { icon: <Clock className="w-5 h-5 text-amber-500" />, value: pendingCount, label: t('statsPending'), bg: 'bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="sb-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Roles */}
      <div className="px-6 pb-8">
        <RollerSection
          projectId={project.id}
          roles={roleList}
          auditionCounts={auditionCounts}
        />
      </div>
    </div>
  )
}
