import { pgTable, text, integer, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const promoCodes = pgTable('promo_codes', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull(), // 'percent' | 'fixed'
  discountValue: integer('discount_value').notNull(),
  applicableRoomTypes: jsonb('applicable_room_types').$type<string[]>().default([]),
  maxUses: integer('max_uses').notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  startDate: text('start_date').notNull(), // "YYYY-MM-DD"
  endDate: text('end_date').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'expired' | 'disabled'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_promos_code').on(table.code),
  index('idx_promos_room_types').using('gin', table.applicableRoomTypes),
]);
