import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, User, Calendar, MapPin, FileText, Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getIncomingShare } from '@/app/actions/roleShares'
import { listSubmissionsForShare } from '@/app/actions/roleShareSubmissions'
import { matchTalentToRole, type TalentCandidate } from '@/lib/roleMatching'
import { SubmissionBuilder } from './SubmissionBuilder'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-600',
  revoked: 'bg-gray-100 text-gray-500',
  role_closed: 'bg-amber-50 text-amber-600',
  expired: 'bg-gray-100 text-gray-500',
}

export default async function GelenRolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('incomingRoles')
  const share = await getIncomingShare(id)
  if (!share) notFound()

  const supabase = await createClient()
  const { data: talents } = await supabase
    .from('talent')
    .select('id, full_name, gender, birth_year, playable_age_min, playable_age_max, height_cm, city, skills, availability, photos')
    .order('full_name')

  const submissions = await listSubmissionsForShare(id)
  const draftSubmission = submissions.find(s => s.status === 'taslak')
  const pastRounds = submissions.filter(s => s.status !== 'taslak')

  const proposedElsewhere = new Set(
    submissions.flatMap(s => s.role_share_submission_items.map(i => i.source_talent_id).filter(Boolean)),
  )

  const matches = matchTalentToRole(
    {
      gender: share.gender,
      age_min: share.age_min,
      age_max: share.age_max,
      min_height_cm: share.height_min,
      max_height_cm: share.height_max,
      required_skills: share.required_skills ?? [],
      city: share.city,
    },
    (talents ?? []) as TalentCandidate[],
  ).filter(m => !proposedElsewhere.has(m.talent.id))

  // Rol kriterlerine uymayan (sert filtrede elenen) oyuncular da menajer
  // isterse yine önerebilsin diye ayrı bir "roster'da ara" listesi.
  const matchedIds = new Set(matches.map(m => m.talent.id))
  const otherTalents = ((talents ?? []) as TalentCandidate[])
    .filter(tl => !matchedIds.has(tl.id) && !proposedElsewhere.has(tl.id))

  const ageLabel = share.age_min && share.age_max
    ? `${share.age_min}–${share.age_max} yaş`
    : share.age_min ? `${share.age_min}+` : share.age_max ? `≤${share.age_max}` : null

  return (
    <div>
      <div className="flex items-center px-6 pt-6 pb-0">
        <Link href="/gelen-roller" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('backToList')}
        </Link>
      </div>

      <div className="px-6 pt-5 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[share.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {t(`status.${share.status}`)}
          </span>
          <span className="text-xs text-indigo-500 font-medium">{share.sender_organization_name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{share.role_title}</h1>
        {share.project_title && <p className="text-sm text-gray-500 mt-0.5">{share.project_title}</p>}

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
          {share.gender && <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" />{share.gender}</span>}
          {ageLabel && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />{ageLabel}</span>}
          {share.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" />{share.city}</span>}
          {share.submission_deadline && (
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" />{t('deadlineLabel')}: {new Date(share.submission_deadline).toLocaleDateString('tr-TR')}</span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {share.role_description && (
          <div className="sb-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('roleDescription')}</h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{share.role_description}</p>
          </div>
        )}

        {share.message && (
          <div className="sb-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('messageFromSender')}</h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{share.message}</p>
          </div>
        )}

        {share.script_asset_path && (
          <a
            href={`/api/shared-script/${share.id}`}
            className="sb-card p-4 flex items-center gap-3 hover:border-indigo-200 border border-transparent transition-colors"
          >
            <FileText className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">{t('downloadScript')}</span>
          </a>
        )}

        {share.status !== 'active' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t(`closedBanner.${share.status}`)}
          </div>
        )}

        <SubmissionBuilder
          shareId={id}
          matches={matches}
          otherTalents={otherTalents}
          draftSubmissionId={draftSubmission?.id ?? null}
          draftItems={draftSubmission?.role_share_submission_items.map(i => ({ id: i.id, full_name: i.full_name, photo_url: i.photo_url, source_talent_id: i.source_talent_id ?? null })) ?? []}
          pastRounds={pastRounds}
          canPropose={share.status === 'active'}
        />
      </div>
    </div>
  )
}
