import { z } from 'zod';

/** Regex giờ HH:mm (00:00 – 23:59) */
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Regex ngày YYYY-MM-DD */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema validate tạo booking mới
 * - roomId, date (YYYY-MM-DD), startTime/endTime (HH:mm): bắt buộc
 * - mode: hourly/daily/overnight/combo3h/combo6h1h (mặc định hourly)
 * - combo6h1hOption: chỉ dùng khi mode='combo6h1h' — 'bonus_hour' (mặc định) | 'discount'
 * - category: guest/internal (mặc định guest)
 * - foodItems: danh sách đồ ăn kèm theo
 * - totalPrice: tổng tiền (tính sẵn từ frontend)
 */
export const createBookingSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'End time must be HH:mm'),
  mode: z.enum(['hourly', 'daily', 'overnight', 'combo3h', 'combo6h1h']).default('hourly'),
  combo6h1hOption: z.enum(['bonus_hour', 'discount']).optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']).default('pending'),
  category: z.enum(['guest', 'internal']).default('guest'),
  internalTag: z.enum(['cleaning', 'maintenance', 'locked', 'custom']).optional(),
  internalNote: z.string().optional(),
  note: z.string().optional(),
  adults: z.number().int().min(1).default(2),
  foodItems: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    price: z.number().optional(),
    qty: z.number().int().min(1).optional(),
  })).default([]),
  // totalPrice from client là gợi ý hiển thị, bị ignore — server tự tính từ room rates + foodItems (DB) + promo.
  totalPrice: z.number().int().min(0).optional(),
  voucher: z.string().optional(),
});

/** Schema cập nhật booking — tất cả trường optional */
export const updateBookingSchema = createBookingSchema.partial();

/** Schema chuyển trạng thái booking */
export const statusTransitionSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']),
});

/** Schema kiểm tra trùng lịch phòng */
export const checkOverlapSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(dateRegex),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  mode: z.enum(['hourly', 'daily', 'overnight', 'combo3h', 'combo6h1h']).optional(),
  excludeId: z.string().optional(),
});
