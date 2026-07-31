import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  PLAN_LIMITS, getPlanLabel, getPlanFromProductId, getProductIdForPlan,
  getActivePlan, isSubscriptionActive, formatStorage,
} from '../../lib/plan'

describe('PLAN_LIMITS', () => {
  it('pro planı tanımlı', () => {
    expect(PLAN_LIMITS.pro.maxUsers).toBe(3)
    expect(PLAN_LIMITS.pro.storageGB).toBe(1000)
  })

  it('agency planı tanımlı', () => {
    expect(PLAN_LIMITS.agency.maxUsers).toBe(5)
    expect(PLAN_LIMITS.agency.storageGB).toBe(200)
  })

  it('starter planı yok', () => {
    expect((PLAN_LIMITS as Record<string, unknown>)['starter']).toBeUndefined()
  })

  it('tüm planların storage limiti > 0', () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan.storageGB).toBeGreaterThan(0)
    }
  })

  it("her planın label'ı var", () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan.label).toBeTruthy()
    }
  })
})

describe('formatStorage', () => {
  it('1000 GB → 1 TB', () => {
    expect(formatStorage(1000)).toBe('1 TB')
  })

  it('200 GB → 200 GB', () => {
    expect(formatStorage(200)).toBe('200 GB')
  })

  it('10 GB → 10 GB', () => {
    expect(formatStorage(10)).toBe('10 GB')
  })
})

describe('getActivePlan', () => {
  it("'pro' planı doğrudan döner", () => {
    expect(getActivePlan('pro', 'active', 'production')).toBe('pro')
  })

  it("'agency' planı doğrudan döner", () => {
    expect(getActivePlan('agency', 'trialing', 'agency')).toBe('agency')
  })

  it('null plan + production org_type → pro', () => {
    expect(getActivePlan(null, 'trialing', 'production')).toBe('pro')
  })

  it('null plan + agency org_type → agency', () => {
    expect(getActivePlan(null, 'active', 'agency')).toBe('agency')
  })

  it("'starter' (legacy) + production org → pro", () => {
    expect(getActivePlan('starter', 'active', 'production')).toBe('pro')
  })

  it('null org_type → pro varsayılan', () => {
    expect(getActivePlan(null, 'active', null)).toBe('pro')
  })
})

describe('isSubscriptionActive', () => {
  it("'active' durumu aktif sayılır", () => {
    expect(isSubscriptionActive('active')).toBe(true)
  })

  it("'trialing' durumu aktif sayılır", () => {
    expect(isSubscriptionActive('trialing')).toBe(true)
  })

  it("'canceled' durumu aktif değil", () => {
    expect(isSubscriptionActive('canceled')).toBe(false)
  })

  it("'past_due' durumu aktif değil", () => {
    expect(isSubscriptionActive('past_due')).toBe(false)
  })

  it('null durumu aktif değil', () => {
    expect(isSubscriptionActive(null)).toBe(false)
  })
})

describe('getPlanLabel', () => {
  it('geçerli plan adı döner', () => {
    expect(getPlanLabel('pro')).toContain('Production')
    expect(getPlanLabel('agency')).toContain('Menajerlik')
  })

  it('bilinmeyen plan için girdiyi geri döner', () => {
    expect(getPlanLabel('unknown')).toBe('unknown')
  })
})

describe('getPlanFromProductId', () => {
  beforeEach(() => {
    vi.stubEnv('POLAR_PRO_PRODUCT_ID', 'prod_pro_123')
    vi.stubEnv('POLAR_AGENCY_PRODUCT_ID', 'prod_agency_456')
  })

  it('pro product id → pro plan', () => {
    expect(getPlanFromProductId('prod_pro_123')).toBe('pro')
  })

  it('agency product id → agency plan', () => {
    expect(getPlanFromProductId('prod_agency_456')).toBe('agency')
  })

  // Sessizce 'pro' dönmek, yanlış ürün ID'si yapılandırıldığında ödeme
  // yapan bir ajansı fark edilmeden pro limitlerine düşürüyordu.
  it('bilinmeyen product id → null (sessizce pro varsaymaz)', () => {
    expect(getPlanFromProductId('prod_unknown')).toBeNull()
  })

  it('boş string → null', () => {
    expect(getPlanFromProductId('')).toBeNull()
  })

  it('null/undefined → null', () => {
    expect(getPlanFromProductId(null)).toBeNull()
    expect(getPlanFromProductId(undefined)).toBeNull()
  })

  it('env var tanımsızsa eşleşme uydurmaz', () => {
    vi.stubEnv('POLAR_PRO_PRODUCT_ID', '')
    vi.stubEnv('POLAR_AGENCY_PRODUCT_ID', '')
    expect(getPlanFromProductId('prod_pro_123')).toBeNull()
  })
})

describe('getProductIdForPlan', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID', 'pub_pro_123')
    vi.stubEnv('NEXT_PUBLIC_POLAR_AGENCY_PRODUCT_ID', 'pub_agency_456')
  })

  it('pro planı doğru product id döner', () => {
    expect(getProductIdForPlan('pro')).toBe('pub_pro_123')
  })

  it('agency planı doğru product id döner', () => {
    expect(getProductIdForPlan('agency')).toBe('pub_agency_456')
  })

  it('env var yoksa boş string döner', () => {
    vi.stubEnv('NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID', '')
    expect(getProductIdForPlan('pro')).toBe('')
  })
})
