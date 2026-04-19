import { pgTable, text, integer, boolean, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { branches } from './branches';

/**
 * Bảng rooms — Phòng homestay với bảng giá và tiện ích
 *
 * Columns chính:
 * - id: khóa chính (nanoid)
 * - name: tên phòng (vd: G01, P102)
 * - type: loại phòng ('standard' | 'vip' | 'supervip'), có CHECK constraint
 * - branchId: FK tới branches — phòng thuộc chi nhánh nào
 * - hourlyRate, dailyRate, overnightRate, extraHourRate: bảng giá (VND, integer)
 * - amenities: danh sách tiện ích (JSONB array)
 * - images: ảnh phòng (JSONB array)
 * - isActive: trạng thái hoạt động
 *
 * Indexes: branchId, type
 */
export const rooms = pgTable('rooms', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  type: text('type').notNull(),
  branchId: text('branch_id').references(() => branches.id),
  description: text('description'),
  images: jsonb('images').$type<string[]>().default([]),
  maxGuests: integer('max_guests').default(2),
  amenities: jsonb('amenities').$type<string[]>().default([]),
  perMinuteRate: integer('per_minute_rate').notNull().default(0),
  hourlyRate: integer('hourly_rate').notNull(),
  dailyRate: integer('daily_rate').notNull(),
  overnightRate: integer('overnight_rate').notNull(),
  extraHourRate: integer('extra_hour_rate').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_rooms_branch').on(table.branchId),
  index('idx_rooms_type').on(table.type),
  check('rooms_type_check', sql`${table.type} IN ('standard', 'vip', 'supervip')`),
]);
