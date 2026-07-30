import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPlanFromProductId } from '../../lib/plan'

// syncSubscription fonksiyonunu izole test etmek için DB mock'u
const mockUpdate = vi.fn().mockReturnValue({ error: null })
const mockEq = vi.fn().mockReturnValue({ error: null })

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (data: unknown) => {
        mockUpdate(data)
        return { eq: mockEq }
      },
    }),
  }),
}))

// syncSubscription'ı doğrudan test edebilmek için route'daki mantığı burada tekrar yazıyoruz.
// Route @polar-sh/nextjs Webhooks wrapper'ı kullandığından HTTP handler'ı mock'lamak yerine
// iş mantığını (DB güncelleme) ayrı olarak test ediyoruz.
async function syncSubscription(sub: {
  id: string
  status: string
  productId: string
  currentPeriodEnd?: Date | null
  customer: { id: string; externalId: string | null }
}) {
  const { createAdminClient } = await import('../../lib/supabase/admin')
  const orgId = sub.customer.externalId
  if (!orgId) return

  const plan = getPlanFromProductId(sub.productId)
  const admin = createAdminClient()

  await admin
    .from('organizations')
    .update({
      subscription_plan: plan,
      subscription_status: sub.status,
      polar_customer_id: sub.customer.id,
      polar_subscription_id: sub.id,
      subscription_ends_at: sub.currentPeriodEnd?.toISOString() ?? null,
    })
    .eq('id', orgId)
}

const MOCK_SUB = {
  id: 'sub_abc',
  status: 'active',
  productId: 'prod_pro_123',
  currentPeriodEnd: new Date('2026-12-31'),
  customer: { id: 'cust_abc', externalId: 'org-uuid-123' },
}

describe('syncSubscription', () => {
  beforeEach(() => {
    vi.stubEnv('POLAR_PRO_PRODUCT_ID', 'prod_pro_123')
    vi.stubEnv('POLAR_AGENCY_PRODUCT_ID', 'prod_agency_456')
    mockUpdate.mockClear()
    mockEq.mockClear()
  })

  it('externalId yoksa DB güncellememeli', async () => {
    await syncSubscription({ ...MOCK_SUB, customer: { id: 'cust_abc', externalId: null } })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('pro subscription → DB\'ye pro plan yazmalı', async () => {
    await syncSubscription(MOCK_SUB)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_plan: 'pro',
        subscription_status: 'active',
        polar_subscription_id: 'sub_abc',
      }),
    )
    expect(mockEq).toHaveBeenCalledWith('id', 'org-uuid-123')
  })

  it('agency subscription → DB\'ye agency plan yazmalı', async () => {
    await syncSubscription({
      ...MOCK_SUB,
      productId: 'prod_agency_456',
    })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_plan: 'agency' }),
    )
  })

  it('bilinmeyen productId → starter plan', async () => {
    await syncSubscription({ ...MOCK_SUB, productId: 'prod_unknown' })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_plan: 'starter' }),
    )
  })

  it('currentPeriodEnd null ise subscription_ends_at null yazmalı', async () => {
    await syncSubscription({ ...MOCK_SUB, currentPeriodEnd: null })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_ends_at: null }),
    )
  })

  it('currentPeriodEnd varsa ISO string yazmalı', async () => {
    await syncSubscription(MOCK_SUB)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_ends_at: '2026-12-31T00:00:00.000Z' }),
    )
  })
})

describe('getPlanFromProductId — edge cases', () => {
  beforeEach(() => {
    vi.stubEnv('POLAR_PRO_PRODUCT_ID', 'prod_pro_123')
    vi.stubEnv('POLAR_AGENCY_PRODUCT_ID', 'prod_agency_456')
  })

  it('her iki env var da aynı değerse pro döner', () => {
    vi.stubEnv('POLAR_AGENCY_PRODUCT_ID', 'prod_pro_123')
    // pro check önce → pro kazanır
    expect(getPlanFromProductId('prod_pro_123')).toBe('pro')
  })
})
