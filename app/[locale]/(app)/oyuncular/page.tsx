import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { OyuncuFilters } from './OyuncuFilters'
import { TalentSlideshowButton } from './TalentSlideshow'
import { Link } from '@/i18n/navigation'
import { Plus, Users } from 'lucide-react'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

const PAGE_SIZE = 24

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-violet-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-sky-400 to-blue-600',
]

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  return (parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2)).toUpperCase()
}

type SearchParams = {
  q?: string; gender?: string; city?: string
  age_min?: string; age_max?: string
  height_min?: string; height_max?: string
  skill?: string; availability?: string; agency?: string
  page?: string
}

type TalentRow = {
  id: string; full_name: string; city: string | null; gender: string | null
  playable_age_min: number | null; playable_age_max: number | null
  height_cm: number | null; agency_name: string | null
  availability: string; skills: string[] | null
  avatar_url: string | null; photos: string[] | null
}

const AVAIL_DOTS: Record<string, string> = {
  available: 'bg-green-400',
  busy: 'bg-amber-400',
  unavailable: 'bg-gray-300',
}

async function OyuncuGrid({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const t = await getTranslations('talent')
  const ta = await getTranslations('talent.availability')

  const AVAILABILITY_CONFIG: Record<string, { dot: string; label: string }> = {
    available:   { dot: AVAIL_DOTS.available,   label: ta('available') },
    busy:        { dot: AVAIL_DOTS.busy,         label: ta('busy') },
    unavailable: { dot: AVAIL_DOTS.unavailable,  label: ta('unavailable') },
  }

  let query = supabase
    .from('talent')
    .select('id, full_name, city, gender, playable_age_min, playable_age_max, height_cm, agency_name, availability, skills, avatar_url, photos')
    .order('full_name', { ascending: true })

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

  const [{ data }, { data: projectsRaw }] = await Promise.all([
    query as Promise<{ data: TalentRow[] | null }>,
    supabase
      .from('projects')
      .select('id, title, project_roles(id, name)')
      .eq('status', 'active')
      .order('title') as Promise<{ data: { id: string; title: string; project_roles: { id: string; name: string }[] }[] | null }>,
  ])

  const allList = data ?? []
  const projects = (projectsRaw ?? []).filter(p => p.project_roles.length > 0)

  const page = Math.max(1, Number(searchParams.page) || 1)
  const totalPages = Math.max(1, Math.ceil(allList.length / PAGE_SIZE))
  const list = allList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (allList.length === 0) {
    return (
      <div className="sb-card flex flex-col items-center justify-center py-16 text-center flex-1">
        <Users className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">{t('notFound')}</p>
        <p className="text-gray-400 text-sm mt-1 mb-4">{t('notFoundHint')}</p>
        <Link href="/oyuncular/yeni" className="sb-btn-primary">
          <Plus className="w-4 h-4" /> {t('add')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">{t('count', { count: allList.length })}</p>
        <TalentSlideshowButton talents={allList} projects={projects} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {list.map(talent => {
          const avail = AVAILABILITY_CONFIG[talent.availability] ?? AVAILABILITY_CONFIG.available
          const gradient = AVATAR_GRADIENTS[talent.full_name.charCodeAt(0) % AVATAR_GRADIENTS.length]
          const initials = getInitials(talent.full_name)
          const ageLabel = talent.playable_age_min && talent.playable_age_max
            ? `${talent.playable_age_min}–${talent.playable_age_max}`
            : talent.playable_age_min ? `${talent.playable_age_min}+`
            : talent.playable_age_max ? `≤${talent.playable_age_max}`
            : null
          const topSkills = (talent.skills ?? []).slice(0, 2)

          return (
            <Link
              key={talent.id}
              href={`/oyuncular/${talent.id}`}
              className="group relative aspect-[2/3] rounded-2xl overflow-hidden block shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Arka plan: fotoğraf ya da gradient */}
              {(talent.photos?.[0] ?? talent.avatar_url) ? (
                <img
                  src={talent.photos?.[0] ?? talent.avatar_url!}
                  alt={talent.full_name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-white/20 font-black select-none"
                    style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
                    {initials}
                  </span>
                </div>
              )}

              {/* Gradient overlay — alt karartma */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Müsaitlik noktası — sağ üst */}
              <div className="absolute top-2.5 right-2.5">
                <span className={`block w-2.5 h-2.5 rounded-full ring-2 ring-black/30 ${avail.dot}`} />
              </div>

              {/* Ajans etiketi — sol üst (varsa) */}
              {talent.agency_name && (
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] bg-black/40 backdrop-blur-sm text-white/80 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[90px] block">
                    {talent.agency_name}
                  </span>
                </div>
              )}

              {/* Bilgi katmanı — alt */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-bold text-white text-sm leading-tight truncate">
                  {talent.full_name}
                </p>

                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  {talent.city && (
                    <span className="text-white/60 text-xs">{talent.city}</span>
                  )}
                  {ageLabel && (
                    <>
                      {talent.city && <span className="text-white/30 text-xs">·</span>}
                      <span className="text-white/60 text-xs">{ageLabel} yaş</span>
                    </>
                  )}
                  {talent.height_cm && (
                    <>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/60 text-xs">{talent.height_cm} cm</span>
                    </>
                  )}
                </div>

                {topSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {topSkills.map(s => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 bg-white/15 backdrop-blur-sm text-white/80 rounded-md text-[10px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                    {(talent.skills ?? []).length > 2 && (
                      <span className="px-1.5 py-0.5 bg-white/10 text-white/50 rounded-md text-[10px]">
                        +{(talent.skills ?? []).length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} />
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

  return (
    <div>
      <PageHeader
        title={t('pool')}
        description={t('poolDesc')}
        actions={
          <Link href="/oyuncular/yeni" className="sb-btn-primary">
            <Plus className="w-4 h-4" /> {t('add')}
          </Link>
        }
      />

      <div className="p-6 flex gap-6 items-start">
        <Suspense>
          <OyuncuFilters />
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
