import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as bookingService from '../services/bookingService.js';
import { createBookingSchema, updateBookingSchema, statusTransitionSchema, checkOverlapSchema } from '../validators/booking.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import type { JwtPayload } from '../middleware/auth.js';

/** Router quản lý đặt phòng — yêu cầu xác thực cho tất cả endpoints */
const bookingsRouter = new Hono();

bookingsRouter.use('*', authMiddleware);

/** GET /bookings — danh sách booking có phân trang và lọc */
bookingsRouter.get('/', async (c) => {
  const filters = {
    date: c.req.query('date'),
    roomId: c.req.query('roomId'),
    status: c.req.query('status'),
    customerId: c.req.query('customerId'),
    page: c.req.query('page') ? Number(c.req.query('page')) : undefined,
    limit: c.req.query('limit') ? Number(c.req.query('limit')) : undefined,
  };
  const result = await bookingService.getAll(filters);
  return c.json(result);
});

/** GET /bookings/check-overlap — kiểm tra trùng lịch (đặt trước /:id) */
bookingsRouter.get('/check-overlap', async (c) => {
  const roomId = c.req.query('roomId')!;
  const date = c.req.query('date')!;
  const startTime = c.req.query('startTime')!;
  const endTime = c.req.query('endTime')!;
  const excludeId = c.req.query('excludeId');
  const hasConflict = await bookingService.checkOverlap(roomId, date, startTime, endTime, excludeId);
  return c.json({ hasConflict });
});

/** GET /bookings/:id — chi tiết booking */
bookingsRouter.get('/:id', async (c) => {
  const booking = await bookingService.getById(c.req.param('id'));
  return c.json(booking);
});

/** POST /bookings — tạo booking mới (staff không được tạo booking nội bộ) */
bookingsRouter.post('/', zValidator('json', createBookingSchema), async (c) => {
  const data = c.req.valid('json');
  const user = (c as any).get('user') as JwtPayload;

  if (data.category === 'internal' && user.role !== 'admin') {
    return c.json({ error: 'Only admins can create internal bookings' }, 403);
  }

  const booking = await bookingService.create(data, user.userId);
  return c.json(booking, 201);
});

/** PUT /bookings/:id — cập nhật booking (chỉ admin) */
bookingsRouter.put('/:id', adminOnly, zValidator('json', updateBookingSchema), async (c) => {
  const data = c.req.valid('json');
  const booking = await bookingService.update(c.req.param('id'), data);
  return c.json(booking);
});

/** DELETE /bookings/:id — hủy booking (chỉ admin, soft delete) */
bookingsRouter.delete('/:id', adminOnly, async (c) => {
  const booking = await bookingService.remove(c.req.param('id')!);
  return c.json(booking);
});

/** POST /bookings/:id/status — chuyển trạng thái booking */
bookingsRouter.post('/:id/status', zValidator('json', statusTransitionSchema), async (c) => {
  const { status } = c.req.valid('json');
  const booking = await bookingService.transitionStatus(c.req.param('id'), status);
  return c.json(booking);
});

export { bookingsRouter as bookingRoutes };
