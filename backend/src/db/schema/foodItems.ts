import { pgTable, text, integer, boolean, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const foodItems = pgTable('food_items', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  price: integer('price').notNull(), // VND
  image: text('image'),
  category: text('category').default('item').notNull(), // 'item' | 'combo'
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [
  check('food_items_category_check', sql`${table.category} IN ('item', 'combo')`),
]);
