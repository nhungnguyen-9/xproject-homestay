import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as foodItemService from '../services/foodItemService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

/** Router quản lý đồ ăn/thức uống — yêu cầu xác thực */
const foodItemsRouter = new Hono();

foodItemsRouter.use('*', authMiddleware);

/** Schema đồ ăn/thức uống */
const foodItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  image: z.string().optional(),
  category: z.enum(['item', 'combo']).default('item'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

/** GET /food-items — danh sách (lọc theo category: item/combo) */
foodItemsRouter.get('/', async (c) => {
  const category = c.req.query('category');
  const items = await foodItemService.getAll(category);
  return c.json(items);
});

/** POST /food-items — thêm mới (chỉ admin) */
foodItemsRouter.post('/', adminOnly, zValidator('json', foodItemSchema), async (c) => {
  const data = c.req.valid('json');
  const item = await foodItemService.create(data);
  return c.json(item, 201);
});

/** PUT /food-items/:id — cập nhật (chỉ admin) */
foodItemsRouter.put('/:id', adminOnly, zValidator('json', foodItemSchema.partial()), async (c) => {
  const data = c.req.valid('json');
  const item = await foodItemService.update(c.req.param('id'), data);
  return c.json(item);
});

/** DELETE /food-items/:id — xóa (chỉ admin) */
foodItemsRouter.delete('/:id', adminOnly, async (c) => {
  await foodItemService.remove(c.req.param('id')!);
  return c.json({ message: 'Food item deleted' });
});

export { foodItemsRouter as foodItemRoutes };
