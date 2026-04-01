import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema validate tạo mã khuyến mãi
 * - code: 3-20 ký tự, chỉ chữ hoa + số
 * - discountType: percent hoặc fixed
 * - discountValue: giá trị giảm (% hoặc VNĐ)
 * - applicableRoomTypes: loại phòng áp dụng (rỗng = tất cả)
 * - startDate/endDate: thời gian hiệu lực (YYYY-MM-DD)
 */
export const createPromoSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and digits'),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().int().min(1),
  applicableRoomTypes: z.array(z.enum(['standard', 'vip', 'supervip'])).default([]),
  maxUses: z.number().int().min(1),
  startDate: z.string().regex(dateRegex),
  endDate: z.string().regex(dateRegex),
  status: z.enum(['active', 'expired', 'disabled']).default('active'),
});

/** Schema cập nhật mã khuyến mãi */
export const updatePromoSchema = createPromoSchema.partial();

/** Schema kiểm tra tính hợp lệ của mã khuyến mãi */
export const validatePromoSchema = z.object({
  code: z.string().min(1),
  roomType: z.enum(['standard', 'vip', 'supervip']),
});

/** Schema áp dụng mã khuyến mãi vào đơn booking */
export const applyPromoSchema = z.object({
  code: z.string().min(1),
  roomType: z.enum(['standard', 'vip', 'supervip']),
  originalPrice: z.number().int().min(0),
});
