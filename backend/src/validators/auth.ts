import { z } from 'zod';

/**
 * Schema validate dữ liệu đăng nhập
 * - username: bắt buộc, trim, tối đa 50 ký tự
 * - password: bắt buộc, tối đa 128 ký tự
 */
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(50, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
});

/**
 * Schema validate refresh token
 * - refreshToken: bắt buộc, tối đa 2048 ký tự
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').max(2048, 'Token too long'),
});
