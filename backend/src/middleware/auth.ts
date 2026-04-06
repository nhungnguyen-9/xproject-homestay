import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Payload được mã hóa trong JWT access token */
export interface JwtPayload {
  userId: string;
  username: string;
  role: 'admin' | 'staff';
  permissions: string[];
}

/**
 * Middleware xác thực JWT — kiểm tra Bearer token trong header Authorization
 * Nếu hợp lệ: gắn thông tin user vào context
 * Nếu token hết hạn: trả 401 "Token expired" (giúp frontend phân biệt cần refresh)
 * Nếu token không hợp lệ: trả 401 "Invalid token"
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  const token = authHeader.slice(7);
  if (!token) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    c.set('user', payload);
    await next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: 'Unauthorized: Token expired' }, 401);
    }
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}
