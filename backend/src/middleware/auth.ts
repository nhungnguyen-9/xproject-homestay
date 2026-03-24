import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'admin' | 'staff';
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}
