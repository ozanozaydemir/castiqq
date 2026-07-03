import { Checkout } from '@polar-sh/nextjs'

// GET /api/checkout?products=PRODUCT_ID&customerExternalId=ORG_ID
// Polar'ın checkout sayfasına yönlendirir.
// customerExternalId = org UUID — webhook'ta bu ID üzerinden orga yazıyoruz.
export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=1`,
  server: (process.env.POLAR_SERVER ?? 'sandbox') as 'sandbox' | 'production',
})
