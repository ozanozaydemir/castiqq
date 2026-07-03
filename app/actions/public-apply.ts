'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type PublicApplyResult =
  | { success: true; uploadToken: string }
  | { error: string }

export async function submitPublicApplication(
  rolePublicToken: string,
  data: { full_name: string; email: string | null; phone: string | null },
): Promise<PublicApplyResult> {
  if (!data.full_name.trim()) return { error: 'İsim zorunludur.' }

  const admin = createAdminClient()

  // Find role by public_token
  const { data: role } = await admin
    .from('project_roles')
    .select('id, title, organization_id, status')
    .eq('public_token', rolePublicToken)
    .single()

  if (!role) return { error: 'Rol bulunamadı.' }
  if (role.status !== 'open' && role.status !== 'casting') {
    return { error: 'Bu rol için başvuru kapalı.' }
  }

  // Create talent record
  const { data: talent, error: talentError } = await admin
    .from('talent')
    .insert({
      organization_id: role.organization_id,
      full_name: data.full_name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      availability: 'available',
      visibility: 'private',
    })
    .select('id')
    .single()

  if (talentError) {
    console.error('Public apply talent error:', talentError.message)
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
      talent_email: data.email || null,
      invite_phone: data.phone || null,
      status: 'pending',
    })
    .select('token')
    .single()

  if (auditionError) {
    console.error('Public apply audition error:', auditionError.message)
    return { error: 'Başvuru oluşturulamadı.' }
  }

  return { success: true, uploadToken: audition.token }
}
