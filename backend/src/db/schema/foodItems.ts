import { pgTable, text, integer, boolean, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Bảng food_items — Thức ăn và đồ uống phục vụ tại phòng
 *
 * Columns chính:
 * - id: khóa chính (nanoid)
 * - name: tên món
 * - price: giá bán (VND, integer)
 * - category: phân loại ('item' | 'combo'), có CHECK constraint
 * - isActive: trạng thái hiển thị (ẩn món mà không cần xóa)
 * - sortOrder: thứ tự hiển thị
 */
export const foodItems = pgTable('food_items', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  image: text('image'),
  category: text('category').default('item').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [
  check('food_items_category_check', sql`${table.category} IN ('item', 'combo')`),
]);
