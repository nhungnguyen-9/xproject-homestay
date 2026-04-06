import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

/**
 * Bảng branches — Chi nhánh homestay
 *
 * Columns chính:
 * - id: khóa chính (nanoid)
 * - name: tên chi nhánh (vd: Cần Thơ, TP.HCM)
 * - address: địa chỉ chi tiết (bắt buộc)
 * - district: quận/huyện
 * - phone: số điện thoại liên hệ
 */
export const branches = pgTable('branches', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address').notNull(),
  district: text('district'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
