import { Context, Next } from 'hono';
import type { JwtPayload } from './auth.js';

/**
 * Middleware phân quyền theo vai trò (RBAC).
 * Kiểm tra user đã xác thực có role nằm trong danh sách cho phép không.
 * @param roles - Danh sách role được phép truy cập (ví dụ: 'admin', 'staff')
 */
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

/** Middleware chỉ cho phép admin truy cập */
export const adminOnly = requireRole('admin');
