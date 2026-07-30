import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PLAN_LIMITS, getPlanLabel, getPlanFromProductId, getProductIdForPlan } from '../../lib/plan'

describe('PLAN_LIMITS', () => {
  it('starter planı tanımlı', () => {
    expect(PLAN_LIMITS.starter.maxUsers).toBe(1)
    expect(PLAN_LIMITS.starter.storageGB).toBe(10)
    expect(PLAN_LIMITS.starter.maxTalent).toBeUndefined()
  })

  it('pro planı tanımlı', () => {
    expect(PLAN_LIMITS.pro.maxUsers).toBe(3)
    expect(PLAN_LIMITS.pro.storageGB).toBe(200)
    expect(PLAN_LIMITS.pro.maxTalent).toBeUndefined()
  })

  it('agency planı tanımlı', () => {
    expect(PLAN_LIMITS.agency.maxUsers).toBe(5)
    expect(PLAN_LIMITS.agency.storageGB).toBe(50)
  })

  it('tüm planların storage limiti > 0', () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan.storageGB).toBeGreaterThan(0)
    }
  })

  it('her planın label\'ı var', () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan.label).toBeTruthy()
    }
  })
})

describe('getPlanLabel', () => {
  it('geçerli plan adı döner', () => {
    expect(getPlanLabel('starter')).toBe('Başlangıç')
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

  it('bilinmeyen product id → starter', () => {
    expect(getPlanFromProductId('prod_unknown')).toBe('starter')
  })

  it('boş string → starter', () => {
    expect(getPlanFromProductId('')).toBe('starter')
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
