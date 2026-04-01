import { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** Bộ nhớ in-memory lưu số lần request theo IP + path */
const store = new Map<string, RateLimitEntry>();

/** Dọn dẹp entry hết hạn mỗi 5 phút */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Middleware giới hạn tần suất request (rate limiting) theo IP.
 * Trả 429 kèm header Retry-After khi vượt ngưỡng.
 * @param maxAttempts - Số request tối đa trong 1 cửa sổ thời gian
 * @param windowMs - Độ dài cửa sổ thời gian (milliseconds)
 */
export function rateLimiter(maxAttempts: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, maxAttempts - entry.count);
    c.header('X-RateLimit-Limit', String(maxAttempts));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    await next();
  };
}
