'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_LIMITS, type Plan } from '@/lib/plan'

export type ActionState = { error?: string; success?: boolean } | null

export async function inviteTeamMember(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const [{ data: profile }, { data: org }, { count: memberCount }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).single(),
    supabase.from('organizations').select('subscription_plan, subscription_status').eq('id', orgId).single(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
  ])

  if (profile?.role !== 'admin') return { error: 'Sadece yöneticiler üye davet edebilir.' }

  // Plan üye limitini kontrol et
  const rawPlan = org?.subscription_plan
  const isActive = org?.subscription_status === 'active'
  const effectivePlan: Plan = (isActive && rawPlan && rawPlan in PLAN_LIMITS)
    ? (rawPlan as Plan)
    : 'starter'
  const maxUsers = PLAN_LIMITS[effectivePlan].maxUsers

  if (maxUsers !== Infinity && (memberCount ?? 0) >= maxUsers) {
    return {
      error: `${PLAN_LIMITS[effectivePlan].label} planınız en fazla ${maxUsers} kullanıcıya izin veriyor. Daha fazla üye eklemek için planınızı yükseltin.`
    }
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role  = (formData.get('role') as string) || 'member'
  if (!email) return { error: 'E-posta adresi zorunludur.' }

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { organization_id: orgId, role },
    redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
  })

  if (error) {
    if (error.message.includes('already been invited') || error.message.includes('already registered')) {
      return { error: 'Bu e-posta adresi zaten sistemde kayıtlı veya davet gönderilmiş.' }
    }
    return { error: error.message }
  }

  revalidatePath('/ayarlar/ekip')
  return { success: true }
}

export async function updateMemberRole(memberId: string, role: string): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (myProfile?.role !== 'admin') return { error: 'Sadece yöneticiler rol değiştirebilir.' }
  if (memberId === userId) return { error: 'Kendi rolünüzü değiştiremezsiniz.' }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', memberId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/ayarlar/ekip')
  return { success: true }
}

export async function removeMember(memberId: string): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (myProfile?.role !== 'admin') return { error: 'Sadece yöneticiler üye çıkarabilir.' }
  if (memberId === userId) return { error: 'Kendinizi çıkaramazsınız.' }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/ayarlar/ekip')
  return { success: true }
}

export async function cancelInvite(memberId: string): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const { data: myProfile } = await supabase
    .from('profiles').select('role').eq('id', userId).single()
  if (myProfile?.role !== 'admin') return { error: 'Sadece yöneticiler davet iptal edebilir.' }

  // Profili sil (auth user'ı da silebiliriz, ama mevcut hesapları etkilemez)
  await supabase.from('profiles').delete().eq('id', memberId).eq('organization_id', orgId)

  const adminClient = createAdminClient()
  await adminClient.auth.admin.deleteUser(memberId)

  revalidatePath('/ayarlar/ekip')
  return { success: true }
}
