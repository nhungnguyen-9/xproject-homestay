import { Context } from 'hono';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

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
