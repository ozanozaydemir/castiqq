'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_LIMITS, getActivePlan, isSubscriptionActive } from '@/lib/plan'
import { sendTeamInviteEmail } from '@/lib/resend'
import { getLocale } from 'next-intl/server'

export type ActionState = { error?: string; success?: boolean } | null

export async function inviteTeamMember(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const [{ data: profile }, { data: org }, { count: memberCount }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).single(),
    supabase.from('organizations').select('name, subscription_plan, subscription_status, org_type').eq('id', orgId).single(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
  ])

  if (profile?.role !== 'admin') return { error: 'Sadece yöneticiler üye davet edebilir.' }

  // Plan üye limitini kontrol et
  if (!isSubscriptionActive(org?.subscription_status)) {
    return { error: 'Aktif aboneliğiniz yok. Daha fazla üye eklemek için aboneliğinizi yenileyin.' }
  }
  const effectivePlan = getActivePlan(org?.subscription_plan, org?.subscription_status, org?.org_type)
  const maxUsers = PLAN_LIMITS[effectivePlan].maxUsers

  if ((memberCount ?? 0) >= maxUsers) {
    return {
      error: `${PLAN_LIMITS[effectivePlan].label} planınız en fazla ${maxUsers} kullanıcıya izin veriyor. Daha fazla üye eklemek için planınızı yükseltin.`
    }
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role  = (formData.get('role') as string) || 'member'
  if (!email) return { error: 'E-posta adresi zorunludur.' }

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const locale = await getLocale()

  // Kullanıcıyı oluştur + davet linkini üret, ama Supabase'in çıplak
  // şablonu yerine kendi markalı emailimizle (Resend) gönder.
  const { data: linkData, error } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { organization_id: orgId, role },
      // generateLink sunucu tarafında çalışıyor — tarayıcı olmadığı için PKCE
      // code verifier üretilemiyor ve Supabase implicit flow'a düşüyor. Token'lar
      // `#access_token=...` fragment'ıyla dönüyor; fragment sunucuya HİÇ
      // gönderilmediği için /auth/callback route handler'ı onu göremez
      // (`?code=` boş kalır → error=no_code → /giris). Bu yüzden davet linki
      // doğrudan client sayfasına gitmeli: browser client fragment'ı okuyup
      // session'ı kurar (detectSessionInUrl).
      redirectTo: `${siteUrl}/sifremi-sifirla`,
    },
  })

  if (error) {
    if (error.message.includes('already been invited') || error.message.includes('already registered')) {
      return { error: 'Bu e-posta adresi zaten sistemde kayıtlı veya davet gönderilmiş.' }
    }
    return { error: error.message }
  }

  const actionLink = linkData?.properties?.action_link
  if (!actionLink) return { error: 'Davet linki üretilemedi.' }

  const { error: emailError } = await sendTeamInviteEmail(
    email,
    org?.name ?? 'Castiqq',
    actionLink,
    locale as 'tr' | 'en',
  )
  if (emailError) {
    console.error('[inviteTeamMember] email send failed', emailError.message)
    return { error: 'Davet oluşturuldu ancak email gönderilemedi. Lütfen tekrar deneyin.' }
  }

  revalidatePath('/[locale]/ayarlar/ekip', 'page')
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

  // profiles_update_self politikası yalnızca `id = auth.uid()` satırına izin
  // veriyor — yani yönetici başkasının rolünü RLS client'ıyla değiştiremez,
  // silme gibi bu da sessizce 0 satır etkiliyordu.
  if (!(await assertSameOrg(supabase, memberId, orgId))) return { error: 'Üye bulunamadı.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', memberId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/[locale]/ayarlar/ekip', 'page')
  return { success: true }
}

// Hedef üyenin gerçekten çağıranın org'una ait olduğunu doğrular.
// Admin client RLS'i baypas ettiği için bu kontrol atlanamaz — aksi halde
// bir yönetici ID tahmin ederek başka org'un üyesini silebilirdi.
async function assertSameOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, memberId: string, orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', memberId)
    .eq('organization_id', orgId)
    .maybeSingle()
  return !!data
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
  if (!(await assertSameOrg(supabase, memberId, orgId))) return { error: 'Üye bulunamadı.' }

  // profiles'ta DELETE politikası migration 054'e kadar yoktu; RLS açık +
  // politika yok = silme sessizce 0 satır etkiliyor, hata da dönmüyordu.
  // Admin client kullanmak bu tuzağı tamamen ortadan kaldırıyor.
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/[locale]/ayarlar/ekip', 'page')
  return { success: true }
}

export async function cancelInvite(memberId: string): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const { data: myProfile } = await supabase
    .from('profiles').select('role').eq('id', userId).single()
  if (myProfile?.role !== 'admin') return { error: 'Sadece yöneticiler davet iptal edebilir.' }
  if (memberId === userId) return { error: 'Kendi davetinizi iptal edemezsiniz.' }
  if (!(await assertSameOrg(supabase, memberId, orgId))) return { error: 'Davet bulunamadı.' }

  // profiles.id → auth.users(id) ON DELETE CASCADE olduğu için auth
  // kullanıcısını silmek profil satırını da götürür.
  // Bu çağrının hatası önceden yutuluyordu: başarısız olsa bile action
  // success dönüyor, arayüzde davet duruyor ve "sayfa yenilenmedi" gibi
  // görünüyordu.
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(memberId)
  if (error) return { error: error.message }

  revalidatePath('/[locale]/ayarlar/ekip', 'page')
  return { success: true }
}
