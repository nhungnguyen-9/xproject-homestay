import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as customerService from '../services/customerService.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly, requirePermission } from '../middleware/rbac.js';
import { saveCustomerIdImage, deleteCustomerIdImage } from '../services/uploadService.js';

/** Router quản lý khách hàng */
const customersRouter = new Hono();

/** GET /customers/by-phone/:phone — tra cứu khách theo SĐT (public, dùng cho booking form) */
customersRouter.get('/by-phone/:phone', async (c) => {
  const customer = await customerService.getByPhone(c.req.param('phone'));
  if (!customer) return c.json(null);
  return c.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    hasIdImages: (customer.idImageUrls?.length ?? 0) > 0,
    idImageUrls: customer.idImageUrls ?? [],
  });
});

/** Tất cả routes còn lại yêu cầu xác thực + permission 'customers' */
customersRouter.use('*', authMiddleware, requirePermission('customers'));

/** GET /customers — danh sách khách hàng (tìm kiếm, phân trang, kèm thống kê) */
customersRouter.get('/', async (c) => {
  const search = c.req.query('search');
  const withStats = c.req.query('stats') === 'true';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));

  if (withStats) {
    const result = await customerService.getAllWithStats(page, limit);
    return c.json(result);
  }

  const result = await customerService.getAll(search, page, limit);
  return c.json(result);
});

/** GET /customers/:id — chi tiết khách hàng */
customersRouter.get('/:id', async (c) => {
  const customer = await customerService.getById(c.req.param('id'));
  return c.json(customer);
});

/** GET /customers/:id/stats — thống kê chi tiêu và số lần ghé */
customersRouter.get('/:id/stats', async (c) => {
  const stats = await customerService.getStats(c.req.param('id'));
  return c.json(stats);
});

/** POST /customers — tạo khách hàng mới */
customersRouter.post('/', zValidator('json', createCustomerSchema), async (c) => {
  const data = c.req.valid('json');
  const customer = await customerService.create(data);
  return c.json(customer, 201);
});

/** PUT /customers/:id — cập nhật khách hàng (chỉ admin) */
customersRouter.put('/:id', adminOnly, zValidator('json', updateCustomerSchema), async (c) => {
  const data = c.req.valid('json');
  const customer = await customerService.update(c.req.param('id'), data);
  return c.json(customer);
});

/** POST /customers/:id/id-images — upload ảnh CCCD (multipart form, field "images") */
customersRouter.post('/:id/id-images', async (c) => {
  const customerId = c.req.param('id');
  const customer = await customerService.getById(customerId);

  const body = await c.req.parseBody({ all: true });
  const files = body['images'];
  const fileArray = Array.isArray(files) ? files : files ? [files] : [];

  if (fileArray.length === 0) return c.json({ error: 'Không có file nào được upload' }, 400);
  if (fileArray.length > 3) return c.json({ error: 'Tối đa 3 ảnh CCCD' }, 400);

  const filenames: string[] = [];
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    if (!(file instanceof File)) return c.json({ error: 'File không hợp lệ' }, 400);
    const filename = await saveCustomerIdImage(file, customerId, i);
    filenames.push(filename);
  }

  const newUrls = filenames.map(f => `/uploads/customers/${customerId}/${f}`);
  const allUrls = [...(customer.idImageUrls ?? []), ...newUrls];
  const updated = await customerService.updateIdImages(customerId, allUrls);
  return c.json(updated);
});

/** DELETE /customers/:id/id-images/:filename — xóa 1 ảnh CCCD (admin only) */
customersRouter.delete('/:id/id-images/:filename', adminOnly, async (c) => {
  const { id, filename } = c.req.param();
  const customer = await customerService.getById(id);

  const deleted = await deleteCustomerIdImage(id, filename);
  if (!deleted) return c.json({ error: 'File không tồn tại' }, 404);

  const updatedUrls = (customer.idImageUrls ?? []).filter(url => !url.endsWith(filename));
  const updated = await customerService.updateIdImages(id, updatedUrls);
  return c.json(updated);
});

export { customersRouter as customerRoutes };
