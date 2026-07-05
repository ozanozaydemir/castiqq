// Sliding-window in-memory rate limiter.
// Works per serverless instance — acceptable for MVP; swap for Upstash Redis later if needed.

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Clean up expired entries every 5 minutes to avoid unbounded growth
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now()
    for (const [key, w] of store) {
      if (w.resetAt < now) store.delete(key)
    }
  }
  setInterval(cleanup, 5 * 60 * 1000)
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfter?: number // seconds
}

/**
 * Check and increment the rate limit for a given key.
 * @param key    Unique identifier — typically `${ip}:${route}`
 * @param limit  Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  let w = store.get(key)

  if (!w || w.resetAt < now) {
    w = { count: 1, resetAt: now + windowMs }
    store.set(key, w)
    return { ok: true, remaining: limit - 1 }
  }

  w.count++
  const remaining = Math.max(0, limit - w.count)

  if (w.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((w.resetAt - now) / 1000) }
  }

  return { ok: true, remaining }
}
