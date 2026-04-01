import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as roomService from '../services/roomService.js';
import { createRoomSchema, updateRoomSchema } from '../validators/room.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

/** Router quản lý phòng — yêu cầu xác thực, thao tác CUD chỉ admin */
const rooms = new Hono();

rooms.use('*', authMiddleware);

/** GET /rooms — danh sách phòng (lọc theo chi nhánh, loại) */
rooms.get('/', async (c) => {
  const branchId = c.req.query('branchId');
  const type = c.req.query('type');
  const result = await roomService.getAll({ branchId, type });
  return c.json(result);
});

/** GET /rooms/:id — chi tiết phòng */
rooms.get('/:id', async (c) => {
  const room = await roomService.getById(c.req.param('id'));
  return c.json(room);
});

/** POST /rooms — tạo phòng mới (chỉ admin) */
rooms.post('/', adminOnly, zValidator('json', createRoomSchema), async (c) => {
  const data = c.req.valid('json');
  const room = await roomService.create(data);
  return c.json(room, 201);
});

/** PUT /rooms/:id — cập nhật phòng (chỉ admin) */
rooms.put('/:id', adminOnly, zValidator('json', updateRoomSchema), async (c) => {
  const data = c.req.valid('json');
  const room = await roomService.update(c.req.param('id'), data);
  return c.json(room);
});

/** DELETE /rooms/:id — vô hiệu hóa phòng (chỉ admin, soft delete) */
rooms.delete('/:id', adminOnly, async (c) => {
  await roomService.softDelete(c.req.param('id')!);
  return c.json({ message: 'Room deactivated' });
});

export { rooms as roomRoutes };
