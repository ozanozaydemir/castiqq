// Video saklama süresi hesapları.
//
// Tarihi yalnızca direktör belirler; oyuncu tarihe müdahale etmez ama istediği
// an kendi videosunu silebilir (KVKK/GDPR silme hakkı). Bu yüzden burada
// "iki tarafın tarihini uzlaştırma" mantığı yok — tek kaynak
// auditions.retention_until.

/** Org ayarı yoksa kullanılan varsayılan. Migration 059'daki DEFAULT ile aynı. */
export const DEFAULT_RETENTION_DAYS = 180

/** Direktörün seçebileceği üst sınır — DB CHECK'i ile aynı. */
export const MAX_RETENTION_DAYS = 3650

/**
 * Gün sayısını mutlak tarihe çevirir.
 *
 * Seçilen günün **yerel 23:59:59'una** sabitliyoruz. Gün başına yuvarlasaydık
 * "1 Eylül" diyen bir kullanıcı videosunun 31 Ağustos akşamı hâlâ dururken
 * 1 Eylül 00:00'da gittiğini görürdü — yani vaat edilen günü hiç yaşamazdı.
 */
export function retentionDateFromDays(days: number, from: Date = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  d.setHours(23, 59, 59, 999)
  return d
}

/** `<input type="date">` değerini (YYYY-MM-DD) o günün yerel sonuna çevirir. */
export function parseRetentionInput(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d, 23, 59, 59, 999)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Date → `<input type="date">` değeri. toISOString kullanmıyoruz: UTC'ye kayıp günü değiştirebilir. */
export function toDateInputValue(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** Bugünden itibaren kalan tam gün sayısı. Geçmişse negatif. */
export function daysUntil(target: string | Date, now: Date = new Date()): number {
  const t = typeof target === 'string' ? new Date(target) : target
  return Math.ceil((t.getTime() - now.getTime()) / 86_400_000)
}

export function isExpired(target: string | Date | null, now: Date = new Date()): boolean {
  if (!target) return false
  const t = typeof target === 'string' ? new Date(target) : target
  return t.getTime() <= now.getTime()
}

/**
 * Yeni davet için varsayılan saklama tarihi.
 * Org `default_retention_days` NULL ise otomatik silme istenmiyor demektir.
 */
export function defaultRetentionFor(orgDefaultDays: number | null | undefined): Date | null {
  if (orgDefaultDays == null) return null
  return retentionDateFromDays(orgDefaultDays)
}

/** Direktörün girdiği tarihi doğrular. Geçmiş ve aşırı uzak tarihleri reddeder. */
export function validateRetentionDate(
  date: Date | null,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: 'past' | 'too_far' } {
  if (!date) return { ok: true }               // NULL = otomatik silme yok, geçerli
  if (date.getTime() <= now.getTime()) return { ok: false, reason: 'past' }
  if (daysUntil(date, now) > MAX_RETENTION_DAYS) return { ok: false, reason: 'too_far' }
  return { ok: true }
}
