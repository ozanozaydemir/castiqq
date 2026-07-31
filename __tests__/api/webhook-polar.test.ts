import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPlanFromProductId } from '../../lib/plan'

const mockUpdate = vi.fn()
const mockEq = vi.fn().mockResolvedValue({ error: null })
const captureMessage = vi.fn()
const captureException = vi.fn()

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

vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  captureException: (...args: unknown[]) => captureException(...args),
}))

// Route'daki mantığı kopyalamak yerine gerçek modülü test ediyoruz —
// kopya test, route kodu değiştiğinde sessizce yalan söyleyebiliyordu.
import { syncSubscription } from '../../lib/polar-sync'

const MOCK_SUB = {
  id: 'sub_abc',
  status: 'active',
  productId: 'prod_pro_123',
  currentPeriodEnd: new Date('2026-12-31'),
  customer: { id: 'cust_abc', externalId: 'org-uuid-123' },
}

beforeEach(() => {
  vi.stubEnv('POLAR_PRO_PRODUCT_ID', 'prod_pro_123')
  vi.stubEnv('POLAR_AGENCY_PRODUCT_ID', 'prod_agency_456')
  mockUpdate.mockClear()
  mockEq.mockClear()
  captureMessage.mockClear()
  captureException.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('syncSubscription', () => {
  it('externalId yoksa DB güncellememeli', async () => {
    await syncSubscription({ ...MOCK_SUB, customer: { id: 'cust_abc', externalId: null } })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("pro subscription → DB'ye pro plan yazmalı", async () => {
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

  it("agency subscription → DB'ye agency plan yazmalı", async () => {
    await syncSubscription({ ...MOCK_SUB, productId: 'prod_agency_456' })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_plan: 'agency' }),
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

// Sandbox → production geçişinde ürün ID'leri değişir. Env güncellenmezse
// eski davranış ödeme yapan ajansı sessizce pro limitlerine düşürüyordu.
describe('syncSubscription — tanınmayan ürün ID', () => {
  const UNKNOWN = { ...MOCK_SUB, productId: 'prod_unknown_999' }

  it('subscription_plan alanına HİÇ dokunmamalı', async () => {
    await syncSubscription(UNKNOWN)
    const patch = mockUpdate.mock.calls[0][0] as Record<string, unknown>
    expect(patch).not.toHaveProperty('subscription_plan')
  })

  it('aboneliğin geri kalanını yine de kaydetmeli — müşteri erişimini kaybetmesin', async () => {
    await syncSubscription(UNKNOWN)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: 'active',
        polar_customer_id: 'cust_abc',
        polar_subscription_id: 'sub_abc',
      }),
    )
  })

  it("Sentry'ye bildirmeli — sessiz kalmamalı", async () => {
    await syncSubscription(UNKNOWN)
    expect(captureMessage).toHaveBeenCalledTimes(1)
    const [, opts] = captureMessage.mock.calls[0] as [
      string,
      { level: string; extra: Record<string, unknown> },
    ]
    expect(opts.level).toBe('error')
    expect(opts.extra.productId).toBe('prod_unknown_999')
    expect(opts.extra.orgId).toBe('org-uuid-123')
  })

  it("bilinen ürün ID'sinde Sentry'ye bildirmemeli", async () => {
    await syncSubscription(MOCK_SUB)
    expect(captureMessage).not.toHaveBeenCalled()
  })
})

describe('getPlanFromProductId — edge cases', () => {
  it('her iki env var da aynı değerse pro döner', () => {
    vi.stubEnv('POLAR_AGENCY_PRODUCT_ID', 'prod_pro_123')
    expect(getPlanFromProductId('prod_pro_123')).toBe('pro')
  })
})
