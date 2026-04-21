import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as bookingService from '../services/bookingService.js';
import { createBookingSchema, updateBookingSchema, statusTransitionSchema } from '../validators/booking.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { adminOnly, requirePermission } from '../middleware/rbac.js';
import type { JwtPayload } from '../middleware/auth.js';

/**
 * Router quản lý đặt phòng.
 * - GET / công khai (ẩn PII cho khách vãng lai, trả đầy đủ cho admin/staff có quyền).
 * - Các endpoint CUD và chi tiết yêu cầu xác thực + permission 'bookings'.
 */
const bookingsRouter = new Hono();

/** Chỉ whitelist các trường an toàn cho khách vãng lai — dùng để hiển thị grid lịch phòng. */
const PUBLIC_BOOKING_FIELDS = [
  'id',
  'roomId',
  'date',
  'startTime',
  'endTime',
  'status',
  'category',
  'internalTag',
] as const;

/** GET /bookings — danh sách booking có phân trang và lọc (công khai, ẩn PII nếu không đăng nhập) */
bookingsRouter.get('/', optionalAuth, async (c) => {
  const filters = {
    date: c.req.query('date'),
    roomId: c.req.query('roomId'),
    status: c.req.query('status'),
    customerId: c.req.query('customerId'),
    page: c.req.query('page') ? Number(c.req.query('page')) : undefined,
    limit: c.req.query('limit') ? Number(c.req.query('limit')) : undefined,
  };
  const result = await bookingService.getAll(filters);

  const user = (c as any).get('user') as JwtPayload | undefined;
  if (user) {
    return c.json(result);
  }

  // Khách vãng lai → project chỉ các trường an toàn
  const projected = result.data.map((b) => {
    const out: Record<string, unknown> = {};
    for (const key of PUBLIC_BOOKING_FIELDS) {
      out[key] = (b as Record<string, unknown>)[key];
    }
    return out;
  });

  return c.json({ ...result, data: projected });
});

/** GET /bookings/check-overlap — kiểm tra trùng lịch (admin helper, đặt trước /:id) */
bookingsRouter.get('/check-overlap', authMiddleware, requirePermission('bookings'), async (c) => {
  const roomId = c.req.query('roomId')!;
  const date = c.req.query('date')!;
  const startTime = c.req.query('startTime')!;
  const endTime = c.req.query('endTime')!;
  const mode = c.req.query('mode') || 'hourly';
  const excludeId = c.req.query('excludeId');
  const hasConflict = await bookingService.checkOverlap(roomId, date, startTime, endTime, mode, excludeId);
  return c.json({ hasConflict });
});

/** GET /bookings/:id — chi tiết booking (leak PII → chỉ admin/staff có quyền) */
bookingsRouter.get('/:id', authMiddleware, requirePermission('bookings'), async (c) => {
  const booking = await bookingService.getById(c.req.param('id')!);
  return c.json(booking);
});

/** POST /bookings — tạo booking mới (công khai cho khách vãng lai; internal booking yêu cầu admin) */
bookingsRouter.post('/', optionalAuth, zValidator('json', createBookingSchema), async (c) => {
  const data = c.req.valid('json');
  const user = (c as any).get('user') as JwtPayload | undefined;

  if (data.category === 'internal') {
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Only admins can create internal bookings' }, 403);
    }
  }

  const booking = await bookingService.create(data, user?.userId);
  return c.json(booking, 201);
});

/** PUT /bookings/:id — cập nhật booking (chỉ admin) */
bookingsRouter.put('/:id', authMiddleware, requirePermission('bookings'), adminOnly, zValidator('json', updateBookingSchema), async (c) => {
  const data = c.req.valid('json');
  const booking = await bookingService.update(c.req.param('id'), data);
  return c.json(booking);
});

/** DELETE /bookings/:id — hủy booking (chỉ admin, soft delete) */
bookingsRouter.delete('/:id', authMiddleware, requirePermission('bookings'), adminOnly, async (c) => {
  const booking = await bookingService.remove(c.req.param('id')!);
  return c.json(booking);
});

/** POST /bookings/:id/status — chuyển trạng thái booking */
bookingsRouter.post('/:id/status', authMiddleware, requirePermission('bookings'), zValidator('json', statusTransitionSchema), async (c) => {
  const { status } = c.req.valid('json');
  const booking = await bookingService.transitionStatus(c.req.param('id'), status);
  return c.json(booking);
});

export { bookingsRouter as bookingRoutes };
