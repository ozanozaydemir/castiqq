'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { retentionDateFromDays } from '@/lib/retention'
import { auditionVideoPaths, purgeR2 } from '@/lib/video-cleanup'

export type ActionState = { error?: string; success?: boolean; token?: string } | null

export async function createAudition(
  roleId: string,
  talentId: string | null,
  talentName: string,
  talentEmail: string | null,
  invitePhone: string | null,
): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  let resolvedTalentId = talentId

  // Manuel eklemede: önce talent kaydı oluştur, ardından audition'ı buna bağla
  if (!talentId && talentName.trim()) {
    const { data: newTalent, error: talentError } = await supabase
      .from('talent')
      .insert({
        organization_id: orgId,
        full_name: talentName.trim(),
        email: talentEmail || null,
        phone: invitePhone || null,
        availability: 'available',
        visibility: 'private',
      })
      .select('id')
      .single()

    if (talentError) return { error: talentError.message }
    resolvedTalentId = newTalent.id
  }

  const { data, error } = await supabase
    .from('auditions')
    .insert({
      organization_id: orgId,
      role_id: roleId,
      talent_id: resolvedTalentId || null,
      talent_name: talentName || null,
      talent_email: talentEmail || null,
      invite_phone: invitePhone || null,
      status: 'pending',
      retention_until: await defaultRetentionUntil(supabase, orgId),
    })
    .select('token')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/roller/${roleId}`)
  revalidatePath('/oyuncular')
  return { success: true, token: data.token }
}

export async function updateAuditionStatus(id: string, roleId: string, status: string) {
  const { supabase } = await requireOrg()
  await supabase.from('auditions').update({ status }).eq('id', id)
  revalidatePath(`/roller/${roleId}`)
}

export async function deleteAudition(id: string, roleId: string) {
  const { supabase } = await requireOrg()
  const paths = await auditionVideoPaths(supabase, id)
  await supabase.from('auditions').delete().eq('id', id)
  await purgeR2(paths)
  revalidatePath(`/roller/${roleId}`)
}

export async function reorderAuditions(roleId: string, orderedIds: string[]) {
  const { supabase } = await requireOrg()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('auditions').update({ sort_order: index }).eq('id', id)
    )
  )
  revalidatePath(`/roller/${roleId}`)
}

/**
 * Org'un varsayılan saklama süresini mutlak tarihe çevirir.
 *
 * Snapshot alıyoruz: org varsayılanı sonradan kısalırsa mevcut davetlerin
 * videoları beklenmedik şekilde erken silinmemeli.
 */
async function defaultRetentionUntil(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, orgId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('organizations')
    .select('default_retention_days')
    .eq('id', orgId)
    .single()
  const days = data?.default_retention_days
  if (days == null) return null
  return retentionDateFromDays(days).toISOString()
}

export async function addCandidate(
  roleId: string,
  talentId: string,
): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  // Aynı role zaten eklendiyse hata ver
  const { data: existing } = await supabase
    .from('auditions')
    .select('id')
    .eq('role_id', roleId)
    .eq('talent_id', talentId)
    .maybeSingle()

  if (existing) return { error: 'Bu oyuncu zaten bu role aday olarak eklenmiş.' }

  const { data: talent } = await supabase
    .from('talent')
    .select('full_name, email, phone')
    .eq('id', talentId)
    .single()

  if (!talent) return { error: 'Oyuncu bulunamadı.' }

  const { error } = await supabase.from('auditions').insert({
    organization_id: orgId,
    role_id: roleId,
    talent_id: talentId,
    talent_name: talent.full_name,
    talent_email: talent.email ?? null,
    invite_phone: talent.phone ?? null,
    status: 'candidate',
    retention_until: await defaultRetentionUntil(supabase, orgId),
  })

  if (error) {
    console.error('[addCandidate] insert hatası:', error)
    return { error: error.message }
  }

  revalidatePath(`/roller/${roleId}`)
  return { success: true }
}

export async function updateAuditionRating(
  auditionId: string,
  roleId: string,
  rating: number | null,
): Promise<ActionState> {
  const { supabase } = await requireOrg()
  const { error } = await supabase
    .from('auditions')
    .update({ rating })
    .eq('id', auditionId)
  if (error) return { error: error.message }
  revalidatePath(`/roller/${roleId}`)
  return { success: true }
}

export async function updateAuditionNotes(
  auditionId: string,
  roleId: string,
  notes: string,
): Promise<ActionState> {
  const { supabase, userId } = await requireOrg()
  const { error } = await supabase
    .from('auditions')
    .update({
      notes: notes || null,
      notes_updated_by: notes ? userId : null,
      notes_updated_at: notes ? new Date().toISOString() : null,
    })
    .eq('id', auditionId)
  if (error) return { error: error.message }
  revalidatePath(`/roller/${roleId}`)
  return { success: true }
}

/**
 * Adayı "audition bekleniyor" durumuna alıp yükleme linkini üretir.
 *
 * Senaryo seçimi ve saklama tarihi burada belirleniyor: link tam bu anda
 * oyuncuya gidiyor, dolayısıyla "hangi sahneleri göndereceğim" ve "videolar
 * ne zaman silinecek" kararlarının doğru yeri burası.
 */
export async function requestAudition(
  auditionId: string,
  roleId: string,
  invitePhone: string | null,
  scriptIds?: string[],
  retentionUntil?: string | null,
): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  // Tarih doğrulaması: geçmiş bir tarih videoyu yüklenir yüklenmez silinebilir
  // hale getirirdi.
  if (retentionUntil) {
    const d = new Date(retentionUntil)
    if (Number.isNaN(d.getTime())) return { error: 'Geçersiz saklama tarihi.' }
    if (d.getTime() <= Date.now()) return { error: 'Saklama tarihi gelecekte olmalı.' }
  }

  const { data, error } = await supabase
    .from('auditions')
    .update({
      status: 'pending',
      ...(invitePhone !== null ? { invite_phone: invitePhone } : {}),
      ...(retentionUntil !== undefined ? { retention_until: retentionUntil } : {}),
    })
    .eq('id', auditionId)
    .eq('organization_id', orgId)
    .select('token')
    .single()

  if (error) return { error: error.message }

  // Senaryo seçimi verildiyse davetin senaryo listesini bununla değiştir.
  if (scriptIds) {
    await supabase.from('audition_scripts').delete().eq('audition_id', auditionId)

    if (scriptIds.length > 0) {
      // Seçilen senaryoların gerçekten bu role ait olduğunu doğrula — id'ler
      // client'tan geliyor ve audition_scripts erişim sınırımız.
      const { data: valid } = await supabase
        .from('role_scripts')
        .select('id')
        .eq('role_id', roleId)
        .in('id', scriptIds)

      const rows = (valid ?? []).map((s: { id: string }) => ({
        audition_id: auditionId,
        script_id: s.id,
      }))
      if (rows.length > 0) {
        const { error: linkError } = await supabase.from('audition_scripts').insert(rows)
        if (linkError) {
          console.error('[requestAudition] senaryo bağlanamadı', linkError.message)
          return { error: 'Davet oluşturuldu ancak senaryolar eklenemedi.' }
        }
      }
    }
  }

  revalidatePath(`/roller/${roleId}`)
  return { success: true, token: data.token }
}

export async function deleteVideo(videoId: string, roleId: string): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const { data: video } = await supabase
    .from('audition_videos')
    .select('storage_path')
    .eq('id', videoId)
    .eq('organization_id', orgId)
    .single()

  if (!video) return { error: 'Video bulunamadı.' }

  const { deleteFromR2 } = await import('@/lib/r2')
  await deleteFromR2(video.storage_path).catch(err =>
    console.error('R2 delete error:', err.message)
  )

  const { error } = await supabase.from('audition_videos').delete().eq('id', videoId)
  if (error) return { error: error.message }

  // storage_used_bytes'ı migration 053'teki trigger düşürüyor.

  revalidatePath(`/roller/${roleId}`)
  return { success: true }
}

export async function bulkUpdateAuditionStatus(
  ids: string[],
  roleId: string,
  status: string,
): Promise<ActionState> {
  if (!ids.length) return { error: 'Hiç aday seçilmedi.' }
  const { supabase } = await requireOrg()
  const { error } = await supabase.from('auditions').update({ status }).in('id', ids)
  if (error) return { error: error.message }
  revalidatePath(`/roller/${roleId}`)
  return { success: true }
}
