import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { OyuncuFilters } from './OyuncuFilters'
import { TalentGridClient } from './TalentGridClient'
import { ExportToSheetsButton } from './ExportToSheetsButton'
import { ImportFromSheetsButton } from './ImportFromSheetsButton'
import { Link } from '@/i18n/navigation'
import { Plus, TriangleAlert } from 'lucide-react'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

const PAGE_SIZE = 24

type SearchParams = {
  q?: string; gender?: string; city?: string
  age_min?: string; age_max?: string
  height_min?: string; height_max?: string
  skill?: string; availability?: string; agency?: string
  assigned?: string
  sort?: string; page?: string
}

type TalentRow = {
  id: string; full_name: string; city: string | null; gender: string | null
  playable_age_min: number | null; playable_age_max: number | null
  height_cm: number | null; agency_name: string | null
  availability: string; skills: string[] | null
  avatar_url: string | null; photos: string[] | null
}

async function OyuncuGrid({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  const sort = searchParams.sort ?? 'name_asc'

  let query = supabase
    .from('talent')
    .select('id, full_name, city, gender, playable_age_min, playable_age_max, height_cm, agency_name, availability, skills, avatar_url, photos')

  switch (sort) {
    case 'name_desc':
      query = query.order('full_name', { ascending: false })
      break
    case 'available':
      // alphabetical order happens to match: available < busy < unavailable
      query = query.order('availability', { ascending: true }).order('full_name', { ascending: true })
      break
    case 'recent':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('full_name', { ascending: true })
  }

  if (searchParams.q)            query = query.ilike('full_name', `%${searchParams.q}%`)
  if (searchParams.gender)       query = query.eq('gender', searchParams.gender)
  if (searchParams.city)         query = query.ilike('city', `%${searchParams.city}%`)
  if (searchParams.availability) query = query.eq('availability', searchParams.availability)
  if (searchParams.age_min)      query = query.gte('playable_age_max', Number(searchParams.age_min))
  if (searchParams.age_max)      query = query.lte('playable_age_min', Number(searchParams.age_max))
  if (searchParams.height_min)   query = query.gte('height_cm', Number(searchParams.height_min))
  if (searchParams.height_max)   query = query.lte('height_cm', Number(searchParams.height_max))
  if (searchParams.agency === 'yes') query = query.not('agency_name', 'is', null)
  if (searchParams.agency === 'no')  query = query.is('agency_name', null)
  if (searchParams.skill)        query = query.contains('skills', [searchParams.skill])
  if (searchParams.assigned === 'unassigned') query = query.is('assigned_to', null)
  else if (searchParams.assigned)             query = query.eq('assigned_to', searchParams.assigned)

  const [{ data }, { data: projectsRaw }, { data: collectionsRaw }] = await Promise.all([
    query as Promise<{ data: TalentRow[] | null }>,
    supabase
      .from('projects')
      .select('id, title, project_roles(id, name)')
      .eq('status', 'active')
      .order('title') as Promise<{ data: { id: string; title: string; project_roles: { id: string; name: string }[] }[] | null }>,
    supabase
      .from('collections')
      .select('id, name')
      .order('name') as Promise<{ data: { id: string; name: string }[] | null }>,
  ])

  const allList   = data ?? []
  const projects  = (projectsRaw ?? []).filter(p => p.project_roles.length > 0)
  const collections = collectionsRaw ?? []

  const page       = Math.max(1, Number(searchParams.page) || 1)
  const totalPages = Math.max(1, Math.ceil(allList.length / PAGE_SIZE))
  const list       = allList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <TalentGridClient
      list={list}
      totalCount={allList.length}
      page={page}
      totalPages={totalPages}
      projects={projects}
      collections={collections}
      currentSort={sort}
    />
  )
}

async function PendingPaymentsBanner() {
  const supabase = await createClient()
  const t = await getTranslations('talent.bookings')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') return null

  const today = new Date().toISOString().split('T')[0]
  const { data: unpaid } = await supabase
    .from('bookings')
    .select('net_amount, amount_paid, currency, payment_due_date')
    .neq('payment_status', 'paid')

  const rows = unpaid ?? []
  if (rows.length === 0) return null

  const totals: Record<string, number> = {}
  let overdueCount = 0
  for (const r of rows) {
    totals[r.currency] = (totals[r.currency] ?? 0) + (Number(r.net_amount) - Number(r.amount_paid))
    if (r.payment_due_date && r.payment_due_date < today) overdueCount++
  }

  return (
    <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <TriangleAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          {t('pendingSummary', { count: rows.length })} — {Object.entries(totals).map(([cur, amt]) => `${amt.toLocaleString('tr-TR')} ${cur}`).join(' · ')}
        </p>
        {overdueCount > 0 && (
          <p className="text-xs text-red-600 font-medium mt-0.5">{t('overdueSummary', { count: overdueCount })}</p>
        )}
      </div>
    </div>
  )
}

export default async function OyuncularPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const t = await getTranslations('talent')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  const isAgency = org?.org_type === 'agency'
  const { data: teamMembers } = isAgency
    ? await supabase.from('profiles').select('id, full_name').eq('organization_id', profile?.organization_id ?? '')
    : { data: [] }

  return (
    <div>
      <PageHeader
        title={t('pool')}
        description={t('poolDesc')}
        actions={
          <>
            <ImportFromSheetsButton />
            <ExportToSheetsButton />
            <Link href="/oyuncular/yeni" className="sb-btn-primary">
              <Plus className="w-4 h-4" /> {t('add')}
            </Link>
          </>
        }
      />

      <Suspense>
        <PendingPaymentsBanner />
      </Suspense>

      <div className="p-6 flex gap-6 items-start">
        <Suspense>
          <OyuncuFilters teamMembers={isAgency ? (teamMembers ?? []) : []} />
        </Suspense>

        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <OyuncuGrid searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}
