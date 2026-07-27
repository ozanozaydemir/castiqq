// Kullanıcının org_type'ına göre giriş sonrası gideceği ana sayfa.
// Agency org'lar production dashboard'unu değil kendi Genel Bakış sayfasını görür.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveHomePath(supabase: any, userId: string): Promise<'/dashboard' | '/genel-bakis'> {
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userId).single()
  if (!profile?.organization_id) return '/dashboard'

  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile.organization_id).single()
  return org?.org_type === 'agency' ? '/genel-bakis' : '/dashboard'
}
