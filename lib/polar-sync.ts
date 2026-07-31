import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanFromProductId } from '@/lib/plan'

// Polar SDK'sının Subscription tipinin yalnızca kullandığımız alanları.
// Yapısal tip sayesinde route SDK nesnesini doğrudan geçebiliyor, test de
// elle nesne kurabiliyor.
export type PolarSubscriptionLike = {
  id: string
  status: string
  productId: string
  currentPeriodEnd?: Date | null
  customer: { id: string; externalId?: string | null }
}

export async function syncSubscription(sub: PolarSubscriptionLike): Promise<void> {
  const orgId = sub.customer.externalId
  if (!orgId) {
    console.error('[polar webhook] subscription has no externalId (orgId)', sub.id)
    return
  }

  const plan = getPlanFromProductId(sub.productId)

  const patch: Record<string, unknown> = {
    subscription_status:   sub.status,
    polar_customer_id:     sub.customer.id,
    polar_subscription_id: sub.id,
    subscription_ends_at:  sub.currentPeriodEnd?.toISOString() ?? null,
  }

  if (plan) {
    patch.subscription_plan = plan
  } else {
    // Ürün ID'si tanınmadı — büyük ihtimalle env yanlış yapılandırılmış
    // (ör. sandbox ID'leriyle production'a çıkılmış).
    //
    // Aboneliği yine de kaydediyoruz ki müşteri erişimini kaybetmesin, ama
    // subscription_plan'e DOKUNMUYORUZ. Buraya 'pro' yazmak, ₺4.999 ödeyen
    // bir ajansı sessizce pro limitlerine düşürürdü. Plan yazılmayınca
    // getActivePlan() org_type'a düşüyor ve doğru limitleri veriyor.
    //
    // Sessiz kalmıyoruz: bu yapılandırma hatası görünür olmalı.
    const msg = `[polar webhook] TANINMAYAN ÜRÜN ID — subscription_plan güncellenmedi`
    console.error(msg, {
      productId:      sub.productId,
      subscriptionId: sub.id,
      orgId,
    })
    Sentry.captureMessage(msg, {
      level: 'error',
      extra: { productId: sub.productId, subscriptionId: sub.id, orgId },
    })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('organizations').update(patch).eq('id', orgId)

  if (error) {
    console.error('[polar webhook] DB update failed', error.message, error.code)
    Sentry.captureException(error, { extra: { orgId, subscriptionId: sub.id } })
  }
}
