import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as authService from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { loginSchema, refreshSchema } from '../validators/auth.js';
import type { JwtPayload } from '../middleware/auth.js';

type AuthEnv = { Variables: { user: JwtPayload } };

/** Router xác thực: đăng nhập, refresh token, đăng xuất, thông tin user */
const auth = new Hono<AuthEnv>();

/** Hook xác thực Zod — trả lỗi dạng { error: string } thống nhất */
const validationHook = (result: { success: boolean; error?: { issues: { message: string }[] } }, c: any) => {
  if (!result.success) {
    const message = result.error!.issues.map((i) => i.message).join(', ');
    return c.json({ error: message }, 400);
  }
};

/**
 * POST /auth/login — Đăng nhập và trả về JWT tokens
 * Rate limit 10 lần/15 phút/IP, validate input bằng Zod
 */
auth.post(
  '/login',
  rateLimiter(10, 15 * 60 * 1000),
  zValidator('json', loginSchema, validationHook),
  async (c) => {
    const { username, password } = c.req.valid('json');
    const result = await authService.login(username, password);
    return c.json(result);
  },
);

/**
 * POST /auth/refresh — Làm mới access token từ refresh token
 * Rate limit 30 lần/15 phút/IP
 */
auth.post(
  '/refresh',
  rateLimiter(30, 15 * 60 * 1000),
  zValidator('json', refreshSchema, validationHook),
  async (c) => {
    const { refreshToken } = c.req.valid('json');
    const result = await authService.refreshAccessToken(refreshToken);
    return c.json(result);
  },
);

/** POST /auth/logout — đăng xuất (yêu cầu xác thực) */
auth.post('/logout', authMiddleware, (c) => {
  return c.json({ message: 'Logged out' });
});

/** GET /auth/me — lấy thông tin user đang đăng nhập */
auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const me = await authService.getMe(user.userId);
  return c.json(me);
});

export { auth as authRoutes };
