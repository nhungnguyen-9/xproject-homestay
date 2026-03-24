import { pgTable, text, integer, boolean, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { rooms } from './rooms';
import { customers } from './customers';
import { users } from './users';

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  roomId: text('room_id').notNull().references(() => rooms.id),
  customerId: text('customer_id').references(() => customers.id),
  date: text('date').notNull(), // "YYYY-MM-DD"
  startTime: text('start_time').notNull(), // "HH:mm"
  endTime: text('end_time').notNull(), // "HH:mm"
  mode: text('mode').default('hourly'), // 'hourly' | 'daily' | 'overnight'
  guestName: text('guest_name'),
  guestPhone: text('guest_phone'),
  status: text('status').notNull().default('pending'),
  // 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
  category: text('category').notNull().default('guest'), // 'guest' | 'internal'
  internalTag: text('internal_tag'), // 'cleaning' | 'maintenance' | 'locked' | 'custom'
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
