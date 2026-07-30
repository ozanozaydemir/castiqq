// 'pro' = tek Production Planı (yapım şirketleri/cast direktörleri)
// 'agency' = tek Menajerlik Planı (org_type='agency') — eski çok katmanlı
// pro/ajans ayrımı kaldırıldı, her taraf artık tek bir plan kullanıyor.
export type Plan = 'starter' | 'pro' | 'agency'

export const PLAN_LIMITS: Record<Plan, {
  maxUsers: number
  storageGB: number
  label: string
}> = {
  starter: { maxUsers: 1, storageGB: 10,  label: 'Başlangıç' },
  pro:     { maxUsers: 3, storageGB: 200, label: 'Production Planı' },
  agency:  { maxUsers: 5, storageGB: 50,  label: 'Menajerlik Planı' },
}

export function getPlanLabel(plan: string): string {
  return PLAN_LIMITS[plan as Plan]?.label ?? plan
}

export function getProductIdForPlan(plan: 'pro' | 'agency'): string {
  const id = plan === 'pro'
    ? process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID
    : process.env.NEXT_PUBLIC_POLAR_AGENCY_PRODUCT_ID
  return id ?? ''
}

export function getPlanFromProductId(productId: string): Plan {
  if (productId === process.env.POLAR_PRO_PRODUCT_ID) return 'pro'
  if (productId === process.env.POLAR_AGENCY_PRODUCT_ID) return 'agency'
  return 'starter'
}
