import { pgTable, text, integer, boolean, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { branches } from './branches';

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'standard' | 'vip' | 'supervip'
  branchId: text('branch_id').references(() => branches.id),
  description: text('description'),
  images: jsonb('images').$type<string[]>().default([]),
  maxGuests: integer('max_guests').default(2),
  amenities: jsonb('amenities').$type<string[]>().default([]),
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
