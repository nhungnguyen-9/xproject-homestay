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

/**
 * Middleware kiểm tra permission module-level.
 * Admin bypass tất cả. Staff phải có permission cụ thể.
 * @param permission - Tên permission cần kiểm tra (vd: 'bookings', 'customers')
 */
export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JwtPayload | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    // Admin bypass — luôn có full access
    if (user.role === 'admin') {
      return next();
    }
    // Staff phải có permission
    if (!user.permissions?.includes(permission)) {
      return c.json({ error: 'Forbidden: Bạn không có quyền truy cập tính năng này' }, 403);
    }
    await next();
  };
}
