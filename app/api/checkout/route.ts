import { Checkout } from '@polar-sh/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const polarCheckout = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=1`,
  server: (process.env.POLAR_SERVER ?? 'sandbox') as 'sandbox' | 'production',
})

// GET /api/checkout?products=PRODUCT_ID
// Validates auth, injects the real org ID as customerExternalId, then delegates to Polar.
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = rateLimit(`checkout:${ip}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/giris', req.url))

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Override customerExternalId with the verified org ID — prevents clients from spoofing another org's subscription
  const url = new URL(req.url)
  url.searchParams.set('customerExternalId', profile.organization_id)
  return polarCheckout(new NextRequest(url.toString(), req))
}
