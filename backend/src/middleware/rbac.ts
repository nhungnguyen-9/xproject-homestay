import { Context, Next } from 'hono';
import type { JwtPayload } from './auth.js';

export function requireRole(...roles: Array<'admin' | 'staff'>) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JwtPayload | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }
    await next();
  };
}

// Shorthand
export const adminOnly = requireRole('admin');
