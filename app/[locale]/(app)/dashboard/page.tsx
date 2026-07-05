import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Film, UserSearch, Users, Video, UserCheck, TriangleAlert } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { getTranslations, getLocale } from 'next-intl/server'
import { PLAN_LIMITS, type Plan } from '@/lib/plan'
import { OnboardingCard } from './OnboardingCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const t = await getTranslations('dashboard')
  const locale = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id

  const today          = new Date().toISOString().split('T')[0]
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const oneWeekAgo     = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: projectCount },
    { count: roleCount },
    { count: talentCount },
    { count: auditionCount },
    { count: candidateCount },
    { data: recentTalents },
    { data: recentProjects },
    { data: upcomingDeadlines },
    { data: orgData },
    { count: newTalentCount },
    { count: newProjectCount },
    { count: newAuditionCount },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'active'),
    supabase.from('project_roles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'open'),
    supabase.from('talent').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!),
    supabase.from('auditions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'pending'),
    supabase.from('auditions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'candidate'),
    supabase.from('talent').select('id, full_name, city, availability, created_at').eq('organization_id', orgId!).order('created_at', { ascending: false }).limit(6) as Promise<{ data: { id: string; full_name: string; city: string | null; availability: string; created_at: string }[] | null }>,
    supabase.from('projects').select('id, title, status, created_at').eq('organization_id', orgId!).order('created_at', { ascending: false }).limit(4) as Promise<{ data: { id: string; title: string; status: string; created_at: string }[] | null }>,
    supabase.from('projects')
      .select('id, title, deadline')
      .eq('organization_id', orgId!)
      .eq('status', 'active')
      .not('deadline', 'is', null)
      .gte('deadline', today)
      .lte('deadline', sevenDaysLater)
      .order('deadline') as Promise<{ data: { id: string; title: string; deadline: string }[] | null }>,
    supabase.from('organizations').select('subscription_plan, storage_used_bytes').eq('id', orgId!).single() as Promise<{ data: { subscription_plan: string; storage_used_bytes: number } | null }>,
    supabase.from('talent').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).gte('created_at', oneWeekAgo),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).gte('created_at', oneWeekAgo),
    supabase.from('auditions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId!).gte('created_at', oneWeekAgo),
  ])

  const stats = [
    { label: t('stats.activeProjects'),   value: projectCount ?? 0,   trend: newProjectCount ?? 0,  icon: Film,       color: 'text-indigo-500', bg: 'bg-indigo-50',  href: '/projeler' },
    { label: t('stats.openRoles'),        value: roleCount ?? 0,      trend: 0,                     icon: UserSearch, color: 'text-purple-500', bg: 'bg-purple-50',  href: '/roller' },
    { label: t('stats.totalTalent'),      value: talentCount ?? 0,    trend: newTalentCount ?? 0,   icon: Users,      color: 'text-blue-500',   bg: 'bg-blue-50',    href: '/oyuncular' },
    { label: t('stats.candidates'),       value: candidateCount ?? 0, trend: 0,                     icon: UserCheck,  color: 'text-teal-500',   bg: 'bg-teal-50',    href: '/roller' },
    { label: t('stats.pendingAuditions'), value: auditionCount ?? 0,  trend: newAuditionCount ?? 0, icon: Video,      color: 'text-orange-500', bg: 'bg-orange-50',  href: '/roller' },
  ]

  const AVAIL: Record<string, string> = { available: 'bg-green-400', busy: 'bg-amber-400', unavailable: 'bg-gray-300' }
  const PROJECT_STATUS: Record<string, { label: string; color: string }> = {
    active:    { label: t('projectStatus.active'),    color: 'text-green-600 bg-green-50' },
    draft:     { label: t('projectStatus.draft'),     color: 'text-gray-500 bg-gray-100' },
    completed: { label: t('projectStatus.completed'), color: 'text-blue-600 bg-blue-50' },
    archived:  { label: t('projectStatus.archived'),  color: 'text-gray-400 bg-gray-50' },
  }

  const deadlines = upcomingDeadlines ?? []

  const hasProjects = (projectCount ?? 0) > 0
  const hasTalent = (talentCount ?? 0) > 0
  const hasAuditions = ((auditionCount ?? 0) + (candidateCount ?? 0)) > 0

  return (
    <div>
      <PageHeader
        title={profile?.full_name ? t('welcomeGreeting', { name: profile.full_name.split(' ')[0] }) : t('welcome')}
        description={t('subtitle')}
      />

      <div className="p-6 space-y-6">
        <OnboardingCard
          hasProjects={hasProjects}
          hasTalent={hasTalent}
          hasAuditions={hasAuditions}
        />

        {/* Deadline uyarısı */}
        {deadlines.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <TriangleAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                {deadlines.length === 1
                  ? t('deadlineWeekSingular')
                  : t('deadlineWeekPlural', { count: deadlines.length })}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {deadlines.map(p => (
                  <Link
                    key={p.id}
                    href={`/projeler/${p.id}`}
                    className="text-xs text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    {p.title} — {format(new Date(p.deadline), 'd MMM', { locale: locale === 'tr' ? tr : enUS })}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Storage sayacı */}
        {orgData && (() => {
          const plan = (orgData.subscription_plan ?? 'starter') as Plan
          const limitGB = PLAN_LIMITS[plan]?.storageGB ?? 10
          const usedGB = (orgData.storage_used_bytes ?? 0) / (1024 ** 3)
          const pct = Math.min(100, Math.round((usedGB / limitGB) * 100))
          const critical = pct >= 90
          const warn = pct >= 75
          return (
            <div className={`rounded-xl border px-4 py-3 flex items-center gap-4 ${critical ? 'border-red-200 bg-red-50' : warn ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${critical ? 'text-red-700' : warn ? 'text-amber-700' : 'text-gray-600'}`}>
                    {t('storageLabel')}
                  </span>
                  <span className={`text-xs ${critical ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-500'}`}>
                    {usedGB.toFixed(1)} GB / {limitGB} GB
                  </span>
                </div>
                <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${critical ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {(critical || warn) && (
                <Link href="/ayarlar" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                  {t('storageUpgrade')}
                </Link>
              )}
            </div>
          )
        })()}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map(({ label, value, trend, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href} className="sb-card p-5 hover:border-indigo-200 transition-colors group">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
              {trend > 0 && (
                <div className="text-xs text-green-600 font-semibold mt-1">
                  {t('newThisWeek', { count: trend })}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Recent panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Son oyuncular */}
          <div className="sb-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{t('recentTalent')}</h2>
              <Link href="/oyuncular" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">{t('seeAll')}</Link>
            </div>
            {(recentTalents ?? []).length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-300">
                <Users className="w-6 h-6 mr-2" />
                <span className="text-sm">{t('noTalentYet')}</span>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {(recentTalents ?? []).map(talent => (
                  <li key={talent.id}>
                    <Link href={`/oyuncular/${talent.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${AVAIL[talent.availability] ?? 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 flex-1 truncate">{talent.full_name}</span>
                      {talent.city && <span className="text-xs text-gray-400 truncate max-w-[100px]">{talent.city}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Son projeler + hızlı erişim */}
          <div className="space-y-4">
            <div className="sb-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">{t('recentProjects')}</h2>
                <Link href="/projeler" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">{t('seeAll')}</Link>
              </div>
              {(recentProjects ?? []).length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-300">
                  <Film className="w-6 h-6 mr-2" />
                  <span className="text-sm">{t('noProjectsYet')}</span>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {(recentProjects ?? []).map(p => {
                    const st = PROJECT_STATUS[p.status] ?? { label: p.status, color: 'text-gray-500 bg-gray-100' }
                    return (
                      <li key={p.id}>
                        <Link href={`/projeler/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                          <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 flex-1 truncate">{p.title}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Quick links */}
            <div className="sb-card p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('quickAccess')}</h2>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { href: '/projeler/yeni', label: t('newProject'), icon: Film },
                  { href: '/oyuncular/yeni', label: t('addTalent'), icon: Users },
                  { href: '/roller',         label: t('viewRoles'), icon: UserSearch },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
