import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { rooms } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

/** Lấy danh sách phòng đang hoạt động — lọc theo chi nhánh và/hoặc loại phòng */
export async function getAll(filters?: { branchId?: string; type?: string }) {
  const conditions = [eq(rooms.isActive, true)];
  if (filters?.branchId) conditions.push(eq(rooms.branchId, filters.branchId));
  if (filters?.type) conditions.push(eq(rooms.type, filters.type));

  return db.select().from(rooms).where(and(...conditions));
}

/** Lấy chi tiết phòng theo ID */
export async function getById(id: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  if (!room) throw new AppError(404, 'Room not found');
  return room;
}

/** Tạo phòng mới */
export async function create(data: typeof rooms.$inferInsert) {
  const [room] = await db.insert(rooms).values(data).returning();
  return room;
}

/** Cập nhật thông tin phòng */
export async function update(id: string, data: Partial<typeof rooms.$inferInsert>) {
  const [room] = await db
    .update(rooms)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(rooms.id, id))
    .returning();
  if (!room) throw new AppError(404, 'Room not found');
  return room;
}

/** Vô hiệu hóa phòng (soft delete — đặt isActive = false) */
export async function softDelete(id: string) {
  const [room] = await db
    .update(rooms)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(rooms.id, id))
    .returning();
  if (!room) throw new AppError(404, 'Room not found');
  return room;
}
