// 'pro'    = Cast direktörleri — yapım şirketleri ve serbest direktörler
// 'agency' = Menajerlik ajansları — org_type='agency' olan hesaplar
// Ücretsiz/starter tier yoktur; yeni kullanıcılar 14 gün deneme sonrası bu planlardan birine geçer.
export type Plan = 'pro' | 'agency'

export const PLAN_LIMITS: Record<Plan, {
  maxUsers: number
  storageGB: number
  label: string
}> = {
  pro:    { maxUsers: 3, storageGB: 1000, label: 'Production Planı' },
  agency: { maxUsers: 5, storageGB: 200,  label: 'Menajerlik Planı' },
}

export function formatStorage(gb: number): string {
  return gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`
}

// Geçerli planı döner.
// Aktif Polar aboneliği yoksa (null/legacy 'starter') org_type'a göre ilgili planı verir —
// bu durum kayıt sonrası deneme dönemi veya abonelik başlamadan önceki ilk girişi kapsar.
export function getActivePlan(
  plan: string | null | undefined,
  _status: string | null | undefined,
  orgType: string | null | undefined,
): Plan {
  if (plan === 'pro' || plan === 'agency') return plan
  return orgType === 'agency' ? 'agency' : 'pro'
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing'
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

// Bilinmeyen/eşleşmeyen ürün ID'sinde `null` döner.
//
// Eskiden sessizce 'pro' dönüyordu. Sandbox → production geçişinde ürün
// ID'leri değiştiği için env güncellenmezse ₺4.999 ödeyen bir ajansın
// webhook'u eşleşmez ve müşteri fark edilmeden pro limitlerine düşerdi —
// hata yok, log yok. Artık çağıran tarafın bu durumu ele alması zorunlu.
//
// Env değişkeninin kendisi tanımsızsa karşılaştırma yapılmaz: aksi halde
// `undefined === undefined` ile yanlış eşleşme oluşabilirdi.
export function getPlanFromProductId(productId: string | null | undefined): Plan | null {
  if (!productId) return null
  const proId    = process.env.POLAR_PRO_PRODUCT_ID
  const agencyId = process.env.POLAR_AGENCY_PRODUCT_ID
  if (proId    && productId === proId)    return 'pro'
  if (agencyId && productId === agencyId) return 'agency'
  return null
}
