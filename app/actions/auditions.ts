'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

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
  await supabase.from('auditions').delete().eq('id', id)
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

export async function requestAudition(
  auditionId: string,
  roleId: string,
  invitePhone: string | null,
): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const { data, error } = await supabase
    .from('auditions')
    .update({
      status: 'pending',
      ...(invitePhone !== null ? { invite_phone: invitePhone } : {}),
    })
    .eq('id', auditionId)
    .select('token')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/roller/${roleId}`)
  return { success: true, token: data.token }
}
