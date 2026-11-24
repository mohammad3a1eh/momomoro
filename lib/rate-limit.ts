type Bucket = { count: number; resetAt: number }

const g = globalThis as unknown as { __rl?: Map<string, Bucket> }
const store = (g.__rl ??= new Map<string, Bucket>())

/** true = اجازه دارد، false = بیش از حد */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.resetAt < now) store.delete(k)
  }
  const b = store.get(key)
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  b.count += 1
  return b.count <= max
}

export function rateLimitReset(key: string) {
  store.delete(key)
}
