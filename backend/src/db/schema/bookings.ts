import { pgTable, text, integer, boolean, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { rooms } from './rooms';
import { customers } from './customers';
import { users } from './users';

/**
 * Bảng bookings — Đặt phòng, bảng trung tâm của hệ thống
 *
 * Columns chính:
 * - id: khóa chính (nanoid)
 * - roomId: FK tới rooms
 * - customerId: FK tới customers (null nếu booking nội bộ)
 * - date: ngày đặt phòng ("YYYY-MM-DD")
 * - startTime, endTime: giờ bắt đầu/kết thúc ("HH:mm")
 * - mode: chế độ tính giá ('hourly' | 'daily' | 'overnight'), có CHECK constraint
 * - status: trạng thái ('pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'), có CHECK constraint
 * - category: phân loại ('guest' | 'internal'), có CHECK constraint
 * - internalTag: nhãn nội bộ ('cleaning' | 'maintenance' | 'locked' | 'custom') — chỉ dùng khi category = 'internal'
 * - foodItems: danh sách đồ ăn/uống kèm theo (JSONB array)
 * - totalPrice: tổng giá (VND, integer)
 * - createdBy: FK tới users — ai tạo booking
 *
 * Indexes: room+date (composite), date, customer, status, created_by
 */
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  roomId: text('room_id').notNull().references(() => rooms.id),
  customerId: text('customer_id').references(() => customers.id),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  mode: text('mode').default('hourly'),
  guestName: text('guest_name'),
  guestPhone: text('guest_phone'),
  status: text('status').notNull().default('pending'),
  category: text('category').notNull().default('guest'),
  internalTag: text('internal_tag'),
  internalNote: text('internal_note'),
  note: text('note'),
  adults: integer('adults').default(2),
  foodItems: jsonb('food_items').$type<Array<{ id: string; name: string; price: number; qty?: number }>>().default([]),
  totalPrice: integer('total_price').notNull().default(0),
  voucher: text('voucher'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_bookings_room_date').on(table.roomId, table.date),
  index('idx_bookings_date').on(table.date),
  index('idx_bookings_customer').on(table.customerId),
  index('idx_bookings_status').on(table.status),
  index('idx_bookings_created_by').on(table.createdBy),
  check('status_check', sql`${table.status} IN ('pending','confirmed','checked-in','checked-out','cancelled')`),
  check('category_check', sql`${table.category} IN ('guest','internal')`),
  check('mode_check', sql`${table.mode} IN ('hourly', 'daily', 'overnight')`),
]);
