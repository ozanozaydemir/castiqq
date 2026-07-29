'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { resolveHomePath } from '@/lib/home-path'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const locale = await getLocale()
  redirect(locale === 'en' ? '/en/giris' : '/giris')
}

export type AuthActionState = { error?: string; success?: boolean } | null

async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function login(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const t = await getTranslations('auth')
  const ip = await clientIp()
  const rl = rateLimit(`login:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return { error: t('tooManyLoginAttempts') }
  }

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  if (!email || !password) return { error: t('allFieldsRequired') }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: t('wrongCredentials') }

  const locale = await getLocale()
  const homePath = await resolveHomePath(supabase, data.user.id)
  redirect(locale === 'en' ? `/en${homePath}` : homePath)
}

export async function register(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const t = await getTranslations('auth')
  const ip = await clientIp()
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60_000)
  if (!rl.ok) {
    return { error: t('tooManyRegisterAttempts') }
  }

  const org_name = (formData.get('org_name') as string)?.trim()
  const full_name = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string
  const locale = (formData.get('locale') as string) || 'tr'
  if (!org_name || !full_name || !email || !password) return { error: t('allFieldsRequired') }
  if (password !== confirm) return { error: t('passwordMismatch') }
  if (password.length < 6) return { error: t('passwordTooShort') }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // org_type plan seçiminde belirleneceği için varsayılan 'production' kullanılır
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?locale=${locale}`,
      data: { full_name, org_name, org_type: 'production' },
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function selectPlan(orgType: 'production' | 'agency', productId: string): Promise<never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (profile?.organization_id) {
    await supabase
      .from('organizations')
      .update({ org_type: orgType })
      .eq('id', profile.organization_id)
  }

  redirect(`/api/checkout?products=${productId}`)
}
