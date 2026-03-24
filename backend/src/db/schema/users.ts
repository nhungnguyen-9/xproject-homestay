import { pgTable, text, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('staff'), // 'admin' | 'staff'
  displayName: text('display_name'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('users_role_check', sql`${table.role} IN ('admin', 'staff')`),
]);
