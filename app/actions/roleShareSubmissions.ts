'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifySubmissionReceived, notifySubmissionDecided } from '@/lib/notify'

export type ActionState = { error?: string; success?: boolean } | null

/** Agency bir role_share'i ilk açtığında taslak turu getirir/oluşturur. */
export async function getOrCreateDraftSubmission(shareId: string): Promise<{ id: string } | { error: string }> {
  const { supabase, orgId, userId } = await requireOrg()

  const { data: existing } = await supabase
    .from('role_share_submissions')
    .select('id')
    .eq('role_share_id', shareId)
    .eq('agency_organization_id', orgId)
    .eq('status', 'taslak')
    .maybeSingle()

  if (existing) return { id: existing.id }

  const { data: share } = await supabase.from('role_shares').select('status').eq('id', shareId).single()
  if (!share) return { error: 'Paylaşım bulunamadı.' }
  if (share.status !== 'active') return { error: 'Bu paylaşım artık aktif değil, yeni öneri gönderilemez.' }

  const { data, error } = await supabase.from('role_share_submissions').insert({
    role_share_id: shareId,
    agency_organization_id: orgId,
    submitted_by: userId,
  }).select('id').single()

  if (error) return { error: error.message }
  return { id: data.id }
}

/** Kendi roster'ından bir oyuncuyu taslak öneriye ekler — veriler talent tablosundan kopyalanır (client'tan değil). */
export async function addSubmissionItem(submissionId: string, talentId: string, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const { data: submission } = await supabase.from('role_share_submissions').select('status').eq('id', submissionId).single()
  if (!submission) return { error: 'Öneri turu bulunamadı.' }
  if (submission.status !== 'taslak') return { error: 'Gönderilmiş bir öneri turuna oyuncu eklenemez.' }

  const { data: talent } = await supabase
    .from('talent')
    .select('id, full_name, avatar_url, photos, birth_year, playable_age_min, height_cm, city, showreel_url')
    .eq('id', talentId)
    .single()

  if (!talent) return { error: 'Oyuncu bulunamadı.' }

  const age = talent.playable_age_min ?? (talent.birth_year ? new Date().getFullYear() - talent.birth_year : null)
  const proposedFee = Number(formData.get('proposed_fee'))

  const { error } = await supabase.from('role_share_submission_items').insert({
    submission_id: submissionId,
    source_talent_id: talent.id,
    full_name: talent.full_name,
    photo_url: talent.avatar_url ?? talent.photos?.[0] ?? null,
    age,
    height_cm: talent.height_cm,
    city: talent.city,
    reel_url: talent.showreel_url,
    proposed_fee: formData.get('proposed_fee') && !isNaN(proposedFee) ? proposedFee : null,
    currency: (formData.get('currency') as string) || 'TRY',
    agency_notes: (formData.get('agency_notes') as string)?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Bu oyuncu zaten bu öneri turuna eklenmiş.' }
    return { error: error.message }
  }

  revalidatePath(`/gelen-roller/${submissionId}`)
  return { success: true }
}

export async function removeSubmissionItem(itemId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('role_share_submission_items').delete().eq('id', itemId)
}

/** Taslağı kilitler ve production tarafına bildirim/email tetikler. */
export async function submitSubmission(submissionId: string): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const { data: submission } = await supabase
    .from('role_share_submissions')
    .select('id, status, role_share_id, role_shares(organization_id, role_title, project_role_id)')
    .eq('id', submissionId)
    .single()

  if (!submission) return { error: 'Öneri turu bulunamadı.' }
  if (submission.status !== 'taslak') return { error: 'Bu öneri zaten gönderilmiş.' }

  const { count } = await supabase
    .from('role_share_submission_items')
    .select('id', { count: 'exact', head: true })
    .eq('submission_id', submissionId)

  if (!count) return { error: 'Göndermeden önce en az bir oyuncu ekleyin.' }

  await supabase.from('role_share_submissions').update({ status: 'gonderildi' }).eq('id', submissionId)

  const roleShare = submission.role_shares as unknown as { organization_id: string; role_title: string; project_role_id: string } | null
  if (roleShare) {
    const admin = createAdminClient()
    const { data: agencyOrg } = await admin.from('organizations').select('name').eq('id', orgId).single()
    await notifySubmissionReceived(roleShare.organization_id, agencyOrg?.name ?? 'Menajerlik', roleShare.role_title, roleShare.project_role_id)
  }

  revalidatePath(`/gelen-roller/${submission.role_share_id}`)
  return { success: true }
}

/** Production tarafı — tekil oyuncu kararı (kabul/red). */
export async function decideSubmissionItem(itemId: string, decision: 'begenildi' | 'reddedildi', shareId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('role_share_submission_items').update({ cd_decision: decision }).eq('id', itemId)
  revalidatePath(`/roller`)
  revalidatePath(`/gelen-roller/${shareId}`)
}

/** Production tarafı — öneri turunun genel kararı, agency'ye bildirim gider. */
export async function decideSubmission(submissionId: string, decision: 'kabul' | 'kismen_kabul' | 'red'): Promise<ActionState> {
  const { supabase, userId } = await requireOrg()

  const { data: submission } = await supabase
    .from('role_share_submissions')
    .select('agency_organization_id, role_share_id, role_shares(role_title)')
    .eq('id', submissionId)
    .single()

  if (!submission) return { error: 'Öneri turu bulunamadı.' }

  await supabase.from('role_share_submissions').update({
    status: decision, reviewed_by: userId, reviewed_at: new Date().toISOString(),
  }).eq('id', submissionId)

  const roleTitle = (submission.role_shares as unknown as { role_title: string } | null)?.role_title ?? 'Rol'
  await notifySubmissionDecided(submission.agency_organization_id, roleTitle, decision, submission.role_share_id)

  revalidatePath(`/roller`)
  return { success: true }
}

/** Bir role_share'e bağlı tüm öneri turları + kalemleri (her iki taraf da kullanır). */
export type SubmissionItemRow = {
  id: string; full_name: string; photo_url: string | null; age: number | null
  height_cm: number | null; city: string | null; reel_url: string | null
  proposed_fee: number | null; currency: string; agency_notes: string | null
  cd_decision: 'beklemede' | 'begenildi' | 'reddedildi'; source_talent_id: string | null
}
export type SubmissionRow = {
  id: string; status: string; pdf_url: string | null; created_at: string; reviewed_at: string | null
  role_share_submission_items: SubmissionItemRow[]
}

export async function listSubmissionsForShare(shareId: string): Promise<SubmissionRow[]> {
  const { supabase } = await requireOrg()
  const { data } = await supabase
    .from('role_share_submissions')
    .select('id, status, pdf_url, created_at, reviewed_at, role_share_submission_items(id, full_name, photo_url, age, height_cm, city, reel_url, proposed_fee, currency, agency_notes, cd_decision, source_talent_id)')
    .eq('role_share_id', shareId)
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as SubmissionRow[]
}
