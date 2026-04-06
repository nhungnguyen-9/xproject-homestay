import { pgTable, text, timestamp, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

/**
 * Bảng customers — Thông tin khách hàng đặt phòng
 *
 * Columns chính:
 * - id: khóa chính (nanoid)
 * - name: họ tên khách
 * - phone: số điện thoại (unique, có unique index)
 * - email: email liên hệ (không bắt buộc)
 * - note: ghi chú nội bộ (VIP, sở thích phòng, v.v.)
 */
export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  email: text('email'),
  note: text('note'),
  idImageUrls: jsonb('id_image_urls').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_customers_phone').on(table.phone),
]);
