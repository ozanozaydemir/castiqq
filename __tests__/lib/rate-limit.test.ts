import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit } from '../../lib/rate-limit'

// Her test farklı key prefix kullandığından store temizlemeye gerek yok.
// Sadece fake timers'ı restore et.
afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('ilk istek her zaman geçmeli', () => {
    const result = rateLimit('rl-t1', 5, 60_000)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('limit dahilindeki istekler geçmeli', () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimit('rl-t2', 5, 60_000)
      expect(result.ok).toBe(true)
    }
  })

  it('limit aşıldığında reddedilmeli', () => {
    for (let i = 0; i < 5; i++) rateLimit('rl-t3', 5, 60_000)
    const result = rateLimit('rl-t3', 5, 60_000)
    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('farklı key\'ler birbirinden bağımsız olmalı', () => {
    for (let i = 0; i < 5; i++) rateLimit('rl-t4-x', 5, 60_000)
    // rl-t4-x dolu, rl-t4-y hâlâ boş
    const result = rateLimit('rl-t4-y', 5, 60_000)
    expect(result.ok).toBe(true)
  })

  it('window sıfırlandıktan sonra tekrar istek geçmeli', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    for (let i = 0; i < 5; i++) rateLimit('rl-t5', 5, 1_000)

    // 1 saniye ilerlet — window bitmeli
    vi.setSystemTime(now + 1_001)

    const result = rateLimit('rl-t5', 5, 1_000)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('limit=1 → ikinci istekte retryAfter döner', () => {
    rateLimit('rl-t6', 1, 30_000)
    const result = rateLimit('rl-t6', 1, 30_000)
    expect(result.ok).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
    expect(result.retryAfter).toBeLessThanOrEqual(30)
  })
})
