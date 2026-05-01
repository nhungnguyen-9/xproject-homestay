import { z } from 'zod';

/** Regex HH:mm (00:00–23:59). Zero-padded, 24-hour. */
const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Khung giờ khuyến mãi theo phòng.
 * - startTime/endTime: "HH:mm", zero-padded, cùng ngày (endTime > startTime).
 * - percent: 1–100 (phần trăm giảm giá theo giờ).
 *
 * Note: không hỗ trợ slot qua đêm — khác với booking overnight convention.
 * Overnight discount cần tách thành 2 slot (ví dụ 22:00-23:59 và 00:00-06:00).
 */
export const discountSlotSchema = z
  .object({
    startTime: z.string().regex(HHMM_REGEX, 'startTime must be HH:mm'),
    endTime: z.string().regex(HHMM_REGEX, 'endTime must be HH:mm'),
    discountPercent: z.number().int().min(1).max(100),
  })
  .refine((slot) => slot.endTime > slot.startTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

/**
 * Schema validate tạo phòng mới
 * - name: bắt buộc
 * - type: standard/vip/supervip
 * - hourlyRate/dailyRate/overnightRate/extraHourRate: bảng giá (VNĐ)
 * - images: tối đa 5 ảnh, amenities: tiện nghi
 * - discountSlots: các khung giờ giảm giá (tùy chọn)
 */
export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.enum(['standard', 'vip', 'supervip']),
  branchId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).max(5).default([]),
  maxGuests: z.number().int().min(1).default(2),
  amenities: z.array(z.string()).default([]),
  hourlyRate: z.number().int().min(0),
  dailyRate: z.number().int().min(0),
  overnightRate: z.number().int().min(0),
  extraHourRate: z.number().int().min(0),
  combo3hRate: z.number().int().min(0).default(0),
  combo6h1hRate: z.number().int().min(0).default(0),
  combo6h1hDiscount: z.number().int().min(0).default(0),
  discountSlots: z.array(discountSlotSchema).default([]),
});

/** Schema cập nhật phòng — tất cả trường optional */
export const updateRoomSchema = createRoomSchema.partial();

/**
 * Schema validate xóa ảnh phòng
 * - imageUrl: URL ảnh cần xóa (dạng /uploads/rooms/filename)
 */
export const deleteImageSchema = z.object({
  imageUrl: z.string().min(1, 'Image URL is required'),
});

/**
 * Schema validate sắp xếp lại thứ tự ảnh phòng
 * - images: mảng URL ảnh theo thứ tự mới (phải cùng set với ảnh hiện tại)
 */
export const reorderImagesSchema = z.object({
  images: z.array(z.string()).max(5),
});
