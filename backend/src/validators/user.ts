import { z } from 'zod';

/** Danh sách permission hợp lệ cho module-level RBAC */
const VALID_PERMISSIONS = ['bookings', 'customers', 'revenue', 'promos', 'rooms', 'telegram', 'settings'] as const;

/**
 * Schema validate tạo staff mới
 * - username: 3-50 ký tự
 * - password: tối thiểu 6 ký tự
 * - displayName: bắt buộc
 * - email: optional, phải đúng format
 * - permissions: mảng permission, mặc định ['bookings']
 */
export const createUserSchema = z.object({
  username: z.string().min(3, 'Username tối thiểu 3 ký tự').max(50),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  displayName: z.string().min(1, 'Tên hiển thị bắt buộc'),
  email: z.string().email().optional(),
  permissions: z.array(z.enum(VALID_PERMISSIONS)).default(['bookings']),
});

/**
 * Schema validate cập nhật user
 * - displayName: optional
 * - email: optional, nullable
 * - permissions: optional, mảng permission hợp lệ
 */
export const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  permissions: z.array(z.enum(VALID_PERMISSIONS)).optional(),
});
