import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = searchParams.get('locale') ?? 'tr'
  const defaultNext = locale === 'en' ? '/en/dashboard' : '/dashboard'
  const next = searchParams.get('next') ?? defaultNext

  if (!code) {
    return NextResponse.redirect(`${origin}/giris?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return NextResponse.redirect(`${origin}${next}`)
    return NextResponse.redirect(`${origin}/giris?error=auth`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/giris`)

  // Yeni kullanıcıya hoş geldin emaili gönder (kayıt sonrası 10 dk içinde doğrulandıysa)
  if (user.email && user.created_at) {
    const msSinceCreation = Date.now() - new Date(user.created_at).getTime()
    if (msSinceCreation < 10 * 60 * 1000) {
      const name = (user.user_metadata?.full_name as string | undefined) ?? user.email
      sendWelcomeEmail(user.email, name, locale as 'tr' | 'en')
        .catch(err => console.error('Welcome email error:', err.message))
    }
  }

  // Davetli kullanıcı: organization_id metadata'da varsa profili oluştur
  const meta = user.user_metadata ?? {}
  if (meta.organization_id) {
    const adminClient = createAdminClient()
    await adminClient.from('profiles').upsert({
      id: user.id,
      organization_id: meta.organization_id,
      full_name: meta.full_name ?? user.email ?? '',
      role: meta.role ?? 'member',
    }, { onConflict: 'id', ignoreDuplicates: true })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
