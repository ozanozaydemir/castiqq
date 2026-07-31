import { Webhooks } from '@polar-sh/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncSubscription } from '@/lib/polar-sync'

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
        subscription_status: 'canceled',
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
        subscription_plan: null,
        subscription_status: 'canceled',
        polar_subscription_id: null,
        subscription_ends_at: null,
      })
      .eq('id', orgId)
  },
})
