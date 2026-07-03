import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { ClickableRow } from '@/components/ClickableRow'
import { Pagination } from '@/components/ui/Pagination'
import { ProjelerFilters } from './ProjelerFilters'
import { Link } from '@/i18n/navigation'
import { Plus, Film } from 'lucide-react'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

const PAGE_SIZE = 20

type SearchParams = { q?: string; status?: string; type?: string; sort?: string; page?: string }
type Project = { id: string; title: string; type: string; status: string; deadline: string | null; created_at: string }

async function ProjelerTable({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const tp = await getTranslations('projects')
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const typeLabels: Record<string, string> = {
    film: tp('typeFilm'), dizi: tp('typeDizi'), reklam: tp('typeReklam'), tiyatro: tp('typeTiyatro'), diger: tp('typeDiger'),
  }

  const statusConfig: Record<string, { label: string; variant: 'green' | 'indigo' | 'default' }> = {
    active:    { label: tp('statusActive'),    variant: 'green' },
    completed: { label: tp('statusCompleted'), variant: 'indigo' },
    archived:  { label: tp('statusArchived'),  variant: 'default' },
  }

  let query = supabase
    .from('projects')
    .select('id, title, type, status, deadline, created_at', { count: 'exact' })

  if (searchParams.q)      query = query.ilike('title', `%${searchParams.q}%`)
  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.type)   query = query.eq('type', searchParams.type)

  const sort = searchParams.sort ?? 'newest'
  if      (sort === 'oldest')   query = query.order('created_at', { ascending: true })
  else if (sort === 'az')       query = query.order('title', { ascending: true })
  else if (sort === 'za')       query = query.order('title', { ascending: false })
  else if (sort === 'deadline') query = query.order('deadline', { ascending: true, nullsFirst: false })
  else                          query = query.order('created_at', { ascending: false })

  const { data: projects, count } = await query.range(from, to) as { data: Project[] | null; count: number | null }
  const list = projects ?? []
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  return (
    <>
      <ProjelerFilters />

      {list.length === 0 ? (
        <div className="sb-card flex flex-col items-center justify-center py-16 text-center">
          <Film className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{tp('notFound')}</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">{tp('notFoundHint')}</p>
          <Link href="/projeler/yeni" className="sb-btn-primary">
            <Plus className="w-4 h-4" /> {tp('new')}
          </Link>
        </div>
      ) : (
        <div className="sb-card overflow-hidden">
          <table className="sb-table">
            <thead>
              <tr>
                <th>{tp('colName')}</th>
                <th>{tp('colType')}</th>
                <th>{tp('colStatus')}</th>
                <th>{tp('colDeadline')}</th>
                <th>{tp('colCreated')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => {
                const status = statusConfig[p.status] ?? { label: p.status, variant: 'default' as const }
                return (
                  <ClickableRow key={p.id} href={`/projeler/${p.id}`}>
                    <td className="font-medium text-gray-900">{p.title}</td>
                    <td className="text-gray-500">{typeLabels[p.type] ?? p.type ?? '—'}</td>
                    <td><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="text-gray-500">{p.deadline ?? '—'}</td>
                    <td className="text-gray-500">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                  </ClickableRow>
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

export default async function ProjelerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const t = await getTranslations('projects')

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Link href="/projeler/yeni" className="sb-btn-primary">
            <Plus className="w-4 h-4" /> {t('new')}
          </Link>
        }
      />

      <div className="p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ProjelerTable searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}
