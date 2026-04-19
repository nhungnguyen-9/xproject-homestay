import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { branches } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

/** Lấy tất cả chi nhánh */
export async function getAll() {
  return db.select().from(branches);
}

/** Lấy chi tiết chi nhánh theo ID */
export async function getById(id: string) {
  const [branch] = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  if (!branch) throw new AppError(404, 'Branch not found');
  return branch;
}

/** Tạo chi nhánh mới */
export async function create(data: typeof branches.$inferInsert) {
  const [branch] = await db.insert(branches).values(data).returning();
  return branch;
}

/** Cập nhật thông tin chi nhánh */
export async function update(id: string, data: Partial<typeof branches.$inferInsert>) {
  const [branch] = await db
    .update(branches)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(branches.id, id))
    .returning();
  if (!branch) throw new AppError(404, 'Branch not found');
  return branch;
}

/** Xoá chi nhánh */
export async function remove(id: string) {
  const [branch] = await db.delete(branches).where(eq(branches.id, id)).returning();
  if (!branch) throw new AppError(404, 'Branch not found');
  return branch;
}
