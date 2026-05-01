import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { branches, rooms } from '../db/schema/index.js';
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

/**
 * Xoá chi nhánh — chặn xóa khi còn phòng thuộc chi nhánh này (trả 409).
 * Tránh để FK violation crash thành 500.
 */
export async function remove(id: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rooms)
    .where(eq(rooms.branchId, id));

  if (Number(count) > 0) {
    throw new AppError(409, `Không thể xóa chi nhánh: còn ${count} phòng đang thuộc chi nhánh này. Hãy chuyển hoặc xóa phòng trước.`);
  }

  const [branch] = await db.delete(branches).where(eq(branches.id, id)).returning();
  if (!branch) throw new AppError(404, 'Branch not found');
  return branch;
}
