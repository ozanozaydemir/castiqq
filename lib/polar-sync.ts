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

  await applyOrgPatch(orgId, patch, sub.id)
}

// Abonelik iptal edildi: dönem sonuna kadar erişim sürer, plan korunur.
export async function markSubscriptionCanceled(sub: PolarSubscriptionLike): Promise<void> {
  const orgId = sub.customer.externalId
  if (!orgId) {
    console.error('[polar webhook] canceled subscription has no externalId (orgId)', sub.id)
    return
  }

  await applyOrgPatch(orgId, {
    subscription_status:  'canceled',
    subscription_ends_at: sub.currentPeriodEnd?.toISOString() ?? null,
  }, sub.id)
}

// Abonelik geri alındı: erişim biter, plan sıfırlanır.
export async function markSubscriptionRevoked(sub: PolarSubscriptionLike): Promise<void> {
  const orgId = sub.customer.externalId
  if (!orgId) {
    console.error('[polar webhook] revoked subscription has no externalId (orgId)', sub.id)
    return
  }

  await applyOrgPatch(orgId, {
    subscription_plan:     null,
    subscription_status:   'canceled',
    polar_subscription_id: null,
    subscription_ends_at:  null,
  }, sub.id)
}

// Tek yazma noktası. Supabase istemcisi throw ETMEZ — hatayı sonuç nesnesinde
// döndürür. Bu kontrol atlanırsa başarısız UPDATE sessizce yutulur ve webhook
// Polar'a 200 döner; Polar bir daha denemez. Revoke handler'ı tam olarak bu
// şekilde çalışmıyordu: subscription_plan NOT NULL olduğu için UPDATE 23502
// ile düşüyor, org ücretli planıyla açık kalıyordu.
async function applyOrgPatch(
  orgId: string,
  patch: Record<string, unknown>,
  subscriptionId: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('organizations').update(patch).eq('id', orgId)

  if (error) {
    console.error('[polar webhook] DB update failed', error.message, error.code)
    Sentry.captureException(error, { extra: { orgId, subscriptionId, patch } })
  }
}
