import { pgTable, text, integer, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

/**
 * Bảng promo_codes — Mã khuyến mãi giảm giá
 *
 * Columns chính:
 * - id: khóa chính (nanoid)
 * - code: mã nhập (vd: "SUMMER20"), unique với unique index
 * - discountType: loại giảm giá ('percent' | 'fixed')
 * - discountValue: giá trị giảm — phần trăm hoặc số tiền VND
 * - applicableRoomTypes: danh sách loại phòng áp dụng (JSONB array, rỗng = tất cả), có GIN index
 * - maxUses, usedCount: giới hạn và đếm số lần sử dụng
 * - startDate, endDate: thời gian hiệu lực ("YYYY-MM-DD")
 * - status: trạng thái ('active' | 'expired' | 'disabled')
 */
export const promoCodes = pgTable('promo_codes', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),
  applicableRoomTypes: jsonb('applicable_room_types').$type<string[]>().default([]),
  maxUses: integer('max_uses').notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_promos_code').on(table.code),
  index('idx_promos_room_types').using('gin', table.applicableRoomTypes),
]);
