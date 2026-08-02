import { Webhooks } from '@polar-sh/nextjs'
import {
  syncSubscription,
  markSubscriptionCanceled,
  markSubscriptionRevoked,
} from '@/lib/polar-sync'

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionCreated: async (payload) => {
    await syncSubscription(payload.data)
  },

  onSubscriptionUpdated: async (payload) => {
    await syncSubscription(payload.data)
  },

  onSubscriptionCanceled: async (payload) => {
    await markSubscriptionCanceled(payload.data)
  },

  onSubscriptionRevoked: async (payload) => {
    await markSubscriptionRevoked(payload.data)
  },
})
