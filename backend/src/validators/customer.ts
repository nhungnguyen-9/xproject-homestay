import { z } from 'zod';

/**
 * Schema validate tạo khách hàng
 * - name: bắt buộc
 * - phone: 10-11 số
 * - email: tùy chọn, phải đúng format email
 * - note: ghi chú tùy chọn
 */
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(11),
  email: z.string().email().optional().or(z.literal('')),
  note: z.string().optional(),
});

/** Schema cập nhật khách hàng — tất cả trường optional */
export const updateCustomerSchema = createCustomerSchema.partial();
