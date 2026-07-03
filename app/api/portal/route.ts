import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { polar } from '@/lib/polar'

// GET /api/portal
// Mevcut kullanıcının orguna ait Polar Customer Portal'a yönlendirir.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/giris', request.url))

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('polar_customer_id')
    .eq('id', profile.organization_id)
    .single()

  if (!org?.polar_customer_id) {
    // Henüz Polar'da müşteri yok — ayarlara geri dön
    return NextResponse.redirect(new URL('/ayarlar', request.url))
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/ayarlar`

  const session = await polar.customerSessions.create({
    customerId: org.polar_customer_id,
  })

  return NextResponse.redirect(session.customerPortalUrl + `?returnUrl=${encodeURIComponent(returnUrl)}`)
}
