import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as userService from '../services/userService.js';
import { createUserSchema, updateUserSchema } from '../validators/user.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

/** Router quản lý users — chỉ admin được truy cập tất cả endpoints */
const usersRouter = new Hono();

usersRouter.use('*', authMiddleware, adminOnly);

/** GET /users — danh sách users */
usersRouter.get('/', async (c) => {
  const users = await userService.getAll();
  return c.json(users);
});

/** POST /users — tạo staff mới */
usersRouter.post('/', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  const user = await userService.createStaff(data);
  return c.json(user, 201);
});

/** PUT /users/:id — cập nhật user */
usersRouter.put('/:id', zValidator('json', updateUserSchema), async (c) => {
  const data = c.req.valid('json');
  const user = await userService.update(c.req.param('id'), data);
  return c.json(user);
});

/** PUT /users/:id/toggle-active — bật/tắt tài khoản */
usersRouter.put('/:id/toggle-active', async (c) => {
  const user = await userService.toggleActive(c.req.param('id'));
  return c.json(user);
});

/** DELETE /users/:id — xóa staff (không cho xóa admin) */
usersRouter.delete('/:id', async (c) => {
  await userService.remove(c.req.param('id'));
  return c.json({ message: 'User deleted' });
});

export { usersRouter };
