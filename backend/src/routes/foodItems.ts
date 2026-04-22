import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, asc, and } from 'drizzle-orm';
import * as foodItemService from '../services/foodItemService.js';
import { saveFoodItemImage, deleteFoodItemImage } from '../services/uploadService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { AppError } from '../middleware/errorHandler.js';
import { db } from '../config/database.js';
import { foodItems } from '../db/schema/index.js';

/** Router quản lý dịch vụ thêm — public GET + admin CUD */
const foodItemsRouter = new Hono();

/** Schema dịch vụ thêm */
const foodItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  image: z.string().nullable().optional(),
  category: z.enum(['item', 'combo', 'drink', 'service']).default('item'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

/** GET /food-items/public — danh sách active, không cần auth (booking page) */
foodItemsRouter.get('/public', async (c) => {
  const category = c.req.query('category');
  const conditions = category
    ? and(eq(foodItems.isActive, true), eq(foodItems.category, category))
    : eq(foodItems.isActive, true);
  const items = await db.select().from(foodItems)
    .where(conditions)
    .orderBy(asc(foodItems.sortOrder));
  return c.json(items);
});

foodItemsRouter.use('*', authMiddleware);

/** GET /food-items — danh sách (lọc theo category, bao gồm inactive, yêu cầu auth) */
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

/** POST /food-items/:id/image — upload ảnh dịch vụ (chỉ admin, single file) */
foodItemsRouter.post('/:id/image', adminOnly, async (c) => {
  const itemId = c.req.param('id')!;
  const item = await foodItemService.getById(itemId);

  const body = await c.req.parseBody();
  const file = body['file'];

  if (!(file instanceof File)) {
    throw new AppError(400, 'Thiếu file ảnh. Gửi multipart form với field "file".');
  }

  if (item.image) {
    await deleteFoodItemImage(item.image);
  }

  try {
    const filename = await saveFoodItemImage(file, itemId, 0);
    const imageUrl = `/uploads/food-items/${filename}`;
    const updated = await foodItemService.update(itemId, { image: imageUrl });
    return c.json(updated, 201);
  } catch (err: any) {
    throw new AppError(400, err.message);
  }
});

export { foodItemsRouter as foodItemRoutes };
