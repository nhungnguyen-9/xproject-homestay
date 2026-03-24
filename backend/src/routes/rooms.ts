import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as roomService from '../services/roomService.js';
import { createRoomSchema, updateRoomSchema } from '../validators/room.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

const rooms = new Hono();

// All room routes require auth
rooms.use('*', authMiddleware);

// GET /rooms — list rooms (optionally filter by branchId, type)
rooms.get('/', async (c) => {
  const branchId = c.req.query('branchId');
  const type = c.req.query('type');
  const result = await roomService.getAll({ branchId, type });
  return c.json(result);
});

// GET /rooms/:id
rooms.get('/:id', async (c) => {
  const room = await roomService.getById(c.req.param('id'));
  return c.json(room);
});

// POST /rooms — admin only
rooms.post('/', adminOnly, zValidator('json', createRoomSchema), async (c) => {
  const data = c.req.valid('json');
  const room = await roomService.create(data);
  return c.json(room, 201);
});

// PUT /rooms/:id — admin only
rooms.put('/:id', adminOnly, zValidator('json', updateRoomSchema), async (c) => {
  const data = c.req.valid('json');
  const room = await roomService.update(c.req.param('id'), data);
  return c.json(room);
});

// DELETE /rooms/:id — soft delete, admin only
rooms.delete('/:id', adminOnly, async (c) => {
  await roomService.softDelete(c.req.param('id')!);
  return c.json({ message: 'Room deactivated' });
});

export { rooms as roomRoutes };
