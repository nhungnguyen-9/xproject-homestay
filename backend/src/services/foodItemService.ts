import { eq, asc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { foodItems } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

/** Lấy danh sách đồ ăn/thức uống — lọc theo category, sắp xếp theo sortOrder */
export async function getAll(category?: string) {
  if (category) {
    return db.select().from(foodItems)
      .where(eq(foodItems.category, category))
      .orderBy(asc(foodItems.sortOrder));
  }
  return db.select().from(foodItems).orderBy(asc(foodItems.sortOrder));
}

/** Lấy chi tiết món ăn theo ID */
export async function getById(id: string) {
  const [item] = await db.select().from(foodItems).where(eq(foodItems.id, id)).limit(1);
  if (!item) throw new AppError(404, 'Food item not found');
  return item;
}

/** Tạo món ăn/thức uống mới */
export async function create(data: typeof foodItems.$inferInsert) {
  const [item] = await db.insert(foodItems).values(data).returning();
  return item;
}

/** Cập nhật thông tin món ăn */
export async function update(id: string, data: Partial<typeof foodItems.$inferInsert>) {
  const [item] = await db
    .update(foodItems)
    .set(data)
    .where(eq(foodItems.id, id))
    .returning();
  if (!item) throw new AppError(404, 'Food item not found');
  return item;
}

/** Xóa vĩnh viễn món ăn/thức uống */
export async function remove(id: string) {
  const [item] = await db
    .delete(foodItems)
    .where(eq(foodItems.id, id))
    .returning();
  if (!item) throw new AppError(404, 'Food item not found');
  return item;
}
