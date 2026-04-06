import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as branchService from '../services/branchService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

/** Router quản lý chi nhánh — yêu cầu xác thực */
const branches = new Hono();

branches.use('*', authMiddleware);

/** Schema chi nhánh */
const branchSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().min(1),
  district: z.string().optional(),
});

/** GET /branches — danh sách chi nhánh */
branches.get('/', async (c) => {
  const result = await branchService.getAll();
  return c.json(result);
});

/** GET /branches/:id — chi tiết chi nhánh */
branches.get('/:id', async (c) => {
  const branch = await branchService.getById(c.req.param('id'));
  return c.json(branch);
});

/** POST /branches — tạo chi nhánh mới (chỉ admin) */
branches.post('/', adminOnly, zValidator('json', branchSchema), async (c) => {
  const data = c.req.valid('json');
  const branch = await branchService.create(data);
  return c.json(branch, 201);
});

/** PUT /branches/:id — cập nhật chi nhánh (chỉ admin) */
branches.put('/:id', adminOnly, zValidator('json', branchSchema.partial()), async (c) => {
  const data = c.req.valid('json');
  const branch = await branchService.update(c.req.param('id'), data);
  return c.json(branch);
});

export { branches as branchRoutes };
