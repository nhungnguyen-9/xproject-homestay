import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as promoService from '../services/promoService.js';
import { createPromoSchema, updatePromoSchema, validatePromoSchema, applyPromoSchema } from '../validators/promo.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly, requirePermission } from '../middleware/rbac.js';

/** Router quản lý mã khuyến mãi — yêu cầu xác thực + permission 'promos' */
const promos = new Hono();

promos.use('*', authMiddleware, requirePermission('promos'));

/** GET /promos — danh sách mã khuyến mãi (lọc theo status) */
promos.get('/', async (c) => {
  const status = c.req.query('status');
  const result = await promoService.getAll(status);
  return c.json(result);
});

/** POST /promos/validate — kiểm tra mã khuyến mãi hợp lệ (đặt trước /:id) */
promos.post('/validate', zValidator('json', validatePromoSchema), async (c) => {
  const { code, roomType } = c.req.valid('json');
  const result = await promoService.validate(code, roomType);
  return c.json(result);
});

/** POST /promos/apply — áp dụng mã khuyến mãi vào booking */
promos.post('/apply', zValidator('json', applyPromoSchema), async (c) => {
  const { code, roomType, originalPrice } = c.req.valid('json');
  const result = await promoService.applyDiscount(code, roomType, originalPrice);
  return c.json(result);
});

/** GET /promos/:id — chi tiết mã khuyến mãi */
promos.get('/:id', async (c) => {
  const promo = await promoService.getById(c.req.param('id'));
  return c.json(promo);
});

/** POST /promos — tạo mã khuyến mãi (chỉ admin) */
promos.post('/', adminOnly, zValidator('json', createPromoSchema), async (c) => {
  const data = c.req.valid('json');
  const promo = await promoService.create(data);
  return c.json(promo, 201);
});

/** PUT /promos/:id — cập nhật mã khuyến mãi (chỉ admin) */
promos.put('/:id', adminOnly, zValidator('json', updatePromoSchema), async (c) => {
  const data = c.req.valid('json');
  const promo = await promoService.update(c.req.param('id'), data);
  return c.json(promo);
});

/** DELETE /promos/:id — xóa mã khuyến mãi (chỉ admin) */
promos.delete('/:id', adminOnly, async (c) => {
  await promoService.remove(c.req.param('id')!);
  return c.json({ message: 'Promo code deleted' });
});

export { promos as promoRoutes };
