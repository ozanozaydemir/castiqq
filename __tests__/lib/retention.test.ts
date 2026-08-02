import { describe, it, expect } from 'vitest'
import {
  DEFAULT_RETENTION_DAYS, MAX_RETENTION_DAYS,
  retentionDateFromDays, parseRetentionInput, toDateInputValue,
  daysUntil, isExpired, defaultRetentionFor, validateRetentionDate,
} from '../../lib/retention'

describe('retentionDateFromDays', () => {
  it('gün ekler', () => {
    const from = new Date(2026, 0, 1, 10, 0, 0)
    const out = retentionDateFromDays(30, from)
    expect(out.getMonth()).toBe(0)
    expect(out.getDate()).toBe(31)
  })

  // Gün başına yuvarlasaydık "1 Eylül" diyen kullanıcı o günü hiç yaşamazdı:
  // video 1 Eylül 00:00'da silinirdi.
  it('seçilen günün sonuna sabitler', () => {
    const out = retentionDateFromDays(1, new Date(2026, 0, 1, 10, 0, 0))
    expect(out.getHours()).toBe(23)
    expect(out.getMinutes()).toBe(59)
  })

  it('ay ve yıl sınırını doğru geçer', () => {
    const out = retentionDateFromDays(1, new Date(2026, 11, 31, 10, 0, 0))
    expect(out.getFullYear()).toBe(2027)
    expect(out.getMonth()).toBe(0)
    expect(out.getDate()).toBe(1)
  })
})

describe('parseRetentionInput', () => {
  it('YYYY-MM-DD değerini günün sonuna çevirir', () => {
    const d = parseRetentionInput('2026-09-01')!
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(23)
  })

  it('boş veya bozuk girdide null', () => {
    expect(parseRetentionInput('')).toBeNull()
    expect(parseRetentionInput('abc')).toBeNull()
  })
})

describe('toDateInputValue', () => {
  // toISOString kullansaydık UTC'ye kayma günü değiştirebilirdi (TR'de gece
  // yarısına yakın saatlerde bir gün geri gider).
  it('yerel günü korur', () => {
    expect(toDateInputValue(new Date(2026, 8, 1, 23, 59))).toBe('2026-09-01')
  })

  it('tek haneli ay ve günü sıfırla doldurur', () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('daysUntil / isExpired', () => {
  const now = new Date(2026, 0, 1, 12, 0, 0)

  it('gelecek tarih için pozitif', () => {
    expect(daysUntil(new Date(2026, 0, 11, 12, 0, 0), now)).toBe(10)
  })

  it('geçmiş tarih için negatif', () => {
    expect(daysUntil(new Date(2025, 11, 22, 12, 0, 0), now)).toBeLessThan(0)
  })

  it('geçmiş tarih süresi dolmuş sayılır', () => {
    expect(isExpired(new Date(2025, 11, 31), now)).toBe(true)
  })

  it('gelecek tarih dolmamış', () => {
    expect(isExpired(new Date(2026, 5, 1), now)).toBe(false)
  })

  it('null hiçbir zaman dolmuş değil — otomatik silme yok demek', () => {
    expect(isExpired(null, now)).toBe(false)
  })
})

describe('defaultRetentionFor', () => {
  it('gün sayısı verilince tarih üretir', () => {
    expect(defaultRetentionFor(DEFAULT_RETENTION_DAYS)).toBeInstanceOf(Date)
  })

  // NULL = "otomatik silme istemiyorum". Varsayılana düşmek, kullanıcının
  // açık tercihini sessizce ezmek olurdu.
  it('null gün sayısında null döner', () => {
    expect(defaultRetentionFor(null)).toBeNull()
    expect(defaultRetentionFor(undefined)).toBeNull()
  })
})

describe('validateRetentionDate', () => {
  const now = new Date(2026, 0, 1, 12, 0, 0)

  it('null geçerli — otomatik silme yok', () => {
    expect(validateRetentionDate(null, now).ok).toBe(true)
  })

  it('gelecek tarih geçerli', () => {
    expect(validateRetentionDate(new Date(2026, 5, 1), now).ok).toBe(true)
  })

  it('geçmiş tarih reddedilir', () => {
    const r = validateRetentionDate(new Date(2025, 11, 1), now)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('past')
  })

  it('şu an da reddedilir — video yüklenir yüklenmez silinemez', () => {
    expect(validateRetentionDate(new Date(now), now).ok).toBe(false)
  })

  it('üst sınırı aşan tarih reddedilir', () => {
    const tooFar = new Date(now.getTime() + (MAX_RETENTION_DAYS + 10) * 86_400_000)
    const r = validateRetentionDate(tooFar, now)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('too_far')
  })
})
