'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type PublicApplyResult =
  | { success: true; uploadToken: string; isExisting?: boolean }
  | { error: string }

export async function submitPublicApplication(
  rolePublicToken: string,
  data: { full_name: string; email: string | null; phone: string | null },
): Promise<PublicApplyResult> {
  if (!data.full_name.trim()) return { error: 'İsim zorunludur.' }

  const admin = createAdminClient()

  // Find role by public_token — check is_public AND status
  const { data: role } = await admin
    .from('project_roles')
    .select('id, name, organization_id, status, is_public')
    .eq('public_token', rolePublicToken)
    .single()

  if (!role) return { error: 'Rol bulunamadı.' }
  if (!role.is_public) return { error: 'Bu rol için başvuru kapalı.' }
  if (role.status !== 'open' && role.status !== 'casting') {
    return { error: 'Bu rol için başvuru kapalı.' }
  }

  // Duplicate detection — same email for same role returns existing token
  if (data.email) {
    const { data: existing } = await admin
      .from('auditions')
      .select('token')
      .eq('role_id', role.id)
      .eq('talent_email', data.email.trim())
      .maybeSingle()

    if (existing?.token) {
      return { success: true, uploadToken: existing.token, isExisting: true }
    }
  }

  // Create talent record
  const { data: talent, error: talentError } = await admin
    .from('talent')
    .insert({
      organization_id: role.organization_id,
      full_name: data.full_name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      availability: 'available',
      visibility: 'private',
    })
    .select('id')
    .single()

  if (talentError) {
    console.error('Public apply talent error:', talentError.message, talentError.code)
    return { error: 'Başvuru oluşturulamadı.' }
  }

  // Create audition
  const { data: audition, error: auditionError } = await admin
    .from('auditions')
    .insert({
      organization_id: role.organization_id,
      role_id: role.id,
      talent_id: talent.id,
      talent_name: data.full_name.trim(),
      talent_email: data.email?.trim() || null,
      invite_phone: data.phone?.trim() || null,
      status: 'pending',
    })
    .select('token')
    .single()

  if (auditionError) {
    console.error('Public apply audition error:', auditionError.message, auditionError.code)
    return { error: 'Başvuru oluşturulamadı.' }
  }

  return { success: true, uploadToken: audition.token }
}
