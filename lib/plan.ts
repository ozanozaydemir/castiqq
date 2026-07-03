export type Plan = 'starter' | 'pro' | 'agency'

export const PLAN_LIMITS: Record<Plan, {
  maxUsers: number
  storageGB: number
  label: string
}> = {
  starter: { maxUsers: 1,         storageGB: 10,   label: 'Başlangıç' },
  pro:     { maxUsers: 3,         storageGB: 200,  label: 'Pro'        },
  agency:  { maxUsers: Infinity,  storageGB: 1000, label: 'Ajans'      },
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
