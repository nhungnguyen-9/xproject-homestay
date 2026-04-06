import { Context } from 'hono';
import { env } from '../config/env.js';

/**
 * Lớp lỗi tùy chỉnh của ứng dụng.
 * Cho phép throw lỗi kèm HTTP status code để errorHandler trả về đúng format.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Middleware xử lý lỗi toàn cục cho Hono.
 * AppError → trả status code tương ứng.
 * Lỗi khác → 500 (ẩn chi tiết ở production).
 */
export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.statusCode as any);
  }

  const message = env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return c.json({ error: message }, 500);
}
