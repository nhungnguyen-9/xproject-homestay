import { pgTable, text, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Bảng users — Quản lý tài khoản admin và nhân viên
 *
 * Columns chính:
 * - id: khóa chính (nanoid)
 * - username: tên đăng nhập (unique, tự tạo B-tree index)
 * - passwordHash: mật khẩu đã mã hóa bcrypt (12 salt rounds)
 * - role: vai trò ('admin' | 'staff'), có CHECK constraint
 * - displayName: tên hiển thị
 * - email: email (không bắt buộc)
 */
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('staff'),
  displayName: text('display_name'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('users_role_check', sql`${table.role} IN ('admin', 'staff')`),
]);
