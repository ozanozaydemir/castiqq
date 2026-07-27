// Sliding-window in-memory rate limiter.
// Works per serverless instance — acceptable for MVP; swap for Upstash Redis later if needed.

interface Window {
  count: number
  resetAt: number
}

// Stored on globalThis instead of a plain module-level const — dev-mode
// module re-evaluation (Fast Refresh / Turbopack recompiling server actions
// per request) otherwise wipes a fresh Map on every single call, silently
// disabling the limiter entirely.
declare global {
  // eslint-disable-next-line no-var
  var __castiqqRateLimitStore: Map<string, Window> | undefined
}

const store = globalThis.__castiqqRateLimitStore ?? new Map<string, Window>()
if (!globalThis.__castiqqRateLimitStore) {
  globalThis.__castiqqRateLimitStore = store

  // Clean up expired entries every 5 minutes to avoid unbounded growth
  setInterval(() => {
    const now = Date.now()
    for (const [key, w] of store) {
      if (w.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
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
