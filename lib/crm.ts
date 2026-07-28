import type {
  BrandCategory, ClientTier, ContactRole, PaymentRating, PaymentTerms,
  PitchStage, WorkingStatus, Client, Booking,
} from '@/types/database'

// ──────────────────────────────────────────────────────────────────
// Menajerlik CRM'inin ortak sabitleri. DB CHECK'leri 047_agency_crm.sql'de;
// buradaki listeler onlarla birebir aynı olmalı.
// ──────────────────────────────────────────────────────────────────

export const BRAND_CATEGORIES: BrandCategory[] = [
  'bankacilik', 'telekom', 'icecek', 'otomotiv', 'gida', 'kozmetik', 'perakende', 'moda',
  'elektronik', 'sigorta', 'havayolu', 'gayrimenkul', 'saglik', 'e_ticaret', 'enerji', 'sans_oyunlari',
]

export const INDUSTRY_SEGMENTS = [
  'dizi', 'sinema', 'dijital_ott', 'reklam', 'moda', 'etkinlik', 'tiyatro', 'seslendirme',
] as const

export const CONTACT_ROLES: ContactRole[] = [
  'casting_direktoru', 'uygulayici_yapimci', 'yonetmen', 'marka_muduru',
  'ajans_produktoru', 'yapim_koordinatoru', 'finans', 'diger',
]

export const PAYMENT_TERMS: PaymentTerms[] = ['avans', 'net_15', 'net_30', 'net_60', 'net_90', 'yayin_sonrasi']

export const PITCH_STAGES: PitchStage[] = ['brief', 'oyuncu_onerildi', 'opsiyon', 'sozlesme', 'kazanildi', 'kaybedildi']

/** Pipeline board'da gösterilen aşamalar — kaybedilenler ayrı listede. */
export const ACTIVE_PITCH_STAGES: PitchStage[] = ['brief', 'oyuncu_onerildi', 'opsiyon', 'sozlesme', 'kazanildi']

export const TIER_STYLES: Record<ClientTier, string> = {
  tier_1: 'bg-amber-50 text-amber-700 border-amber-200',
  tier_2: 'bg-gray-100 text-gray-600 border-gray-200',
  tier_3: 'bg-gray-50 text-gray-500 border-gray-200',
}

export const PAYMENT_RATING_STYLES: Record<PaymentRating, string> = {
  belirsiz:  'bg-gray-100 text-gray-500',
  guvenilir: 'bg-green-50 text-green-700',
  gecikmeli: 'bg-amber-50 text-amber-700',
  riskli:    'bg-red-50 text-red-600',
}

export const WORKING_STATUS_STYLES: Record<WorkingStatus, string> = {
  aktif:      'bg-green-50 text-green-700',
  potansiyel: 'bg-blue-50 text-blue-600',
  gecmis:     'bg-gray-100 text-gray-500',
  kara_liste: 'bg-red-50 text-red-600',
}

export const PITCH_STAGE_STYLES: Record<PitchStage, string> = {
  brief:           'bg-gray-100 text-gray-600',
  oyuncu_onerildi: 'bg-blue-50 text-blue-600',
  opsiyon:         'bg-purple-50 text-purple-600',
  sozlesme:        'bg-indigo-50 text-indigo-600',
  kazanildi:       'bg-green-50 text-green-700',
  kaybedildi:      'bg-red-50 text-red-500',
}

/** Vade süresini gün sayısına çevirir — fatura vade tarihi önerisi için. */
export function paymentTermsToDays(terms: PaymentTerms): number | null {
  switch (terms) {
    case 'avans': return 0
    case 'net_15': return 15
    case 'net_30': return 30
    case 'net_60': return 60
    case 'net_90': return 90
    // Yayına girme tarihi baştan bilinmiyor — otomatik hesaplanamaz.
    case 'yayin_sonrasi': return null
  }
}

// ──────────────────────────────────────────────────────────────────
// Reklam yasağı (exclusivity) çakışma motoru
// ──────────────────────────────────────────────────────────────────

export type ExclusivityConflict = {
  bookingId: string
  clientName: string
  category: BrandCategory
  endDate: string
}

type ExclusivityBooking = Pick<
  Booking,
  'id' | 'talent_id' | 'client_name' | 'exclusivity_category' | 'exclusivity_end_date'
>

/**
 * Bir oyuncuya belirli bir marka kategorisinde iş önerilip önerilemeyeceğini
 * söyler. Aynı kategoride süresi dolmamış bir reklam yasağı varsa çakışma
 * döner — "X Bankası ile 6 ay daha yasak var, Y Bankası önerilemez".
 *
 * `excludeBookingId`: mevcut bir işi düzenlerken kendisiyle çakışmasın diye.
 */
export function findExclusivityConflicts(
  bookings: ExclusivityBooking[],
  talentId: string,
  category: BrandCategory | null,
  today: string,
  excludeBookingId?: string,
): ExclusivityConflict[] {
  if (!category) return []
  return bookings
    .filter(b =>
      b.talent_id === talentId &&
      b.id !== excludeBookingId &&
      b.exclusivity_category === category &&
      b.exclusivity_end_date !== null &&
      b.exclusivity_end_date >= today,
    )
    .map(b => ({
      bookingId: b.id,
      clientName: b.client_name,
      category,
      endDate: b.exclusivity_end_date as string,
    }))
}

// ──────────────────────────────────────────────────────────────────
// Müşteri finansal risk değerlendirmesi
// ──────────────────────────────────────────────────────────────────

export type ClientRisk = {
  /** Tahsil edilmemiş (net - ödenen) toplam, para birimi bazında */
  outstandingByCurrency: Record<string, number>
  /** Vadesi geçmiş fatura sayısı */
  overdueCount: number
  /** Kredi limiti aşıldı mı (TRY bazında; limit tanımlıysa) */
  overCreditLimit: boolean
  /** Yeni teklif verilmeden önce menajerin uyarılması gerekiyor mu */
  shouldWarn: boolean
}

type RiskBooking = Pick<
  Booking,
  'net_amount' | 'amount_paid' | 'currency' | 'payment_status' | 'payment_due_date'
>

export function assessClientRisk(
  client: Pick<Client, 'credit_limit' | 'payment_rating' | 'working_status'>,
  bookings: RiskBooking[],
  today: string,
): ClientRisk {
  const outstandingByCurrency: Record<string, number> = {}
  let overdueCount = 0

  for (const b of bookings) {
    if (b.payment_status === 'paid') continue
    const remaining = Number(b.net_amount) - Number(b.amount_paid)
    if (remaining > 0) {
      outstandingByCurrency[b.currency] = (outstandingByCurrency[b.currency] ?? 0) + remaining
    }
    if (b.payment_due_date !== null && b.payment_due_date < today) overdueCount += 1
  }

  const overCreditLimit =
    client.credit_limit !== null && (outstandingByCurrency['TRY'] ?? 0) > Number(client.credit_limit)

  const shouldWarn =
    client.working_status === 'kara_liste' ||
    client.payment_rating === 'riskli' ||
    overdueCount > 0 ||
    overCreditLimit

  return { outstandingByCurrency, overdueCount, overCreditLimit, shouldWarn }
}
