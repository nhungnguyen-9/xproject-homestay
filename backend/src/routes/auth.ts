import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as authService from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import type { JwtPayload } from '../middleware/auth.js';

const auth = new Hono();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /auth/login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const result = await authService.login(username, password);
  return c.json(result);
});

// POST /auth/refresh
auth.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const result = await authService.refreshAccessToken(refreshToken);
  return c.json(result);
});

// POST /auth/logout (stateless — client just discards tokens)
auth.post('/logout', (c) => {
  return c.json({ message: 'Logged out' });
});

// GET /auth/me
auth.get('/me', authMiddleware, async (c) => {
  const user = (c as any).get('user') as JwtPayload;
  const me = await authService.getMe(user.userId);
  return c.json(me);
});

export { auth as authRoutes };
