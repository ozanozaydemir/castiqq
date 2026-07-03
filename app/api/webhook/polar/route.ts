import { Webhooks } from '@polar-sh/nextjs'
import type { Subscription } from '@polar-sh/sdk/models/components/subscription'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanFromProductId } from '@/lib/plan'

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionCreated: async (payload) => {
    await syncSubscription(payload.data)
  },

  onSubscriptionUpdated: async (payload) => {
    await syncSubscription(payload.data)
  },

  onSubscriptionCanceled: async (payload) => {
    const sub = payload.data
    const orgId = sub.customer.externalId
    if (!orgId) return

    const admin = createAdminClient()
    await admin
      .from('organizations')
      .update({
        subscription_status: 'cancelled',
        subscription_ends_at: sub.currentPeriodEnd?.toISOString() ?? null,
      })
      .eq('id', orgId)
  },

  onSubscriptionRevoked: async (payload) => {
    const sub = payload.data
    const orgId = sub.customer.externalId
    if (!orgId) return

    const admin = createAdminClient()
    await admin
      .from('organizations')
      .update({
        subscription_plan: 'starter',
        subscription_status: 'active',
        polar_subscription_id: null,
        subscription_ends_at: null,
      })
      .eq('id', orgId)
  },
})

async function syncSubscription(sub: Subscription) {
  const orgId = sub.customer.externalId
  if (!orgId) {
    console.error('[polar webhook] subscription has no externalId (orgId)', sub.id)
    return
  }

  const plan = getPlanFromProductId(sub.productId)
  const admin = createAdminClient()

  const { error } = await admin
    .from('organizations')
    .update({
      subscription_plan:      plan,
      subscription_status:    sub.status,
      polar_customer_id:      sub.customer.id,
      polar_subscription_id:  sub.id,
      subscription_ends_at:   sub.currentPeriodEnd?.toISOString() ?? null,
    })
    .eq('id', orgId)

  if (error) {
    console.error('[polar webhook] DB update failed', error.message, error.code)
  }
}
