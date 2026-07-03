import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { RollerFilters } from './RollerFilters'
import { Link } from '@/i18n/navigation'
import { UserSearch } from 'lucide-react'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

const PAGE_SIZE = 20

type SearchParams = { q?: string; status?: string; gender?: string; sort?: string; page?: string; project?: string }

type Role = {
  id: string
  name: string
  status: string
  gender: string | null
  age_min: number | null
  age_max: number | null
  project_id: string
  projects: { id: string; title: string } | null
}

async function RollerTable({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const t = await getTranslations('roles')

  const statusConfig: Record<string, { label: string; variant: 'green' | 'indigo' | 'yellow' | 'default' }> = {
    open:      { label: t('status.open'),      variant: 'green' },
    casting:   { label: t('status.casting'),   variant: 'yellow' },
    filled:    { label: t('status.filled'),    variant: 'indigo' },
    cancelled: { label: t('status.cancelled'), variant: 'default' },
  }

  const GENDER_LABELS: Record<string, string> = {
    erkek: t('gender.erkek'), kadin: t('gender.kadin'), diger: t('gender.diger'),
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .in('status', ['active', 'draft'])
    .order('title')

  let query = supabase
    .from('project_roles')
    .select('id, name, status, gender, age_min, age_max, project_id, projects(id, title)')

  if (searchParams.status)  query = query.eq('status', searchParams.status)
  if (searchParams.gender)  query = query.eq('gender', searchParams.gender)
  if (searchParams.project) query = query.eq('project_id', searchParams.project)

  const sort = searchParams.sort ?? 'newest'
  if      (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else if (sort === 'az')     query = query.order('name', { ascending: true })
  else if (sort === 'za')     query = query.order('name', { ascending: false })
  else                        query = query.order('created_at', { ascending: false })

  const { data: roles } = await query as { data: Role[] | null }
  let list = roles ?? []

  // Client-side text search (rol adı veya proje adı)
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.projects?.title ?? '').toLowerCase().includes(q)
    )
  }

  const page = Math.max(1, Number(searchParams.page) || 1)
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const pageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <RollerFilters total={list.length} projects={projects ?? []} />

      {list.length === 0 ? (
        <div className="sb-card flex flex-col items-center justify-center py-16 text-center">
          <UserSearch className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('notFound')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('notFoundHint')}</p>
        </div>
      ) : (
        <div className="sb-card overflow-hidden">
          <table className="sb-table">
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colProject')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colGender')}</th>
                <th>{t('colAgeRange')}</th>
              </tr>
            </thead>
            <tbody>
              {pageList.map(r => {
                const status = statusConfig[r.status] ?? { label: r.status, variant: 'default' as const }
                const age = r.age_min && r.age_max
                  ? `${r.age_min}–${r.age_max}`
                  : r.age_min ? `${r.age_min}+`
                  : r.age_max ? `≤${r.age_max}`
                  : '—'
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="relative">
                      <Link
                        href={`/roller/${r.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 after:absolute after:inset-0"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/projeler/${r.project_id}`} className="relative z-10 text-gray-500 hover:text-indigo-600">
                        {r.projects?.title ?? '—'}
                      </Link>
                    </td>
                    <td className="relative z-10">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="text-gray-500">{GENDER_LABELS[r.gender ?? ''] ?? r.gender ?? '—'}</td>
                    <td className="text-gray-500">{age}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} />
        </div>
      )}
    </>
  )
}

export default async function RollerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const t = await getTranslations('roles')

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <RollerTable searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}
