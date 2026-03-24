import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { branches } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getAll() {
  return db.select().from(branches);
}

export async function getById(id: string) {
  const [branch] = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  if (!branch) throw new AppError(404, 'Branch not found');
  return branch;
}

export async function create(data: typeof branches.$inferInsert) {
  const [branch] = await db.insert(branches).values(data).returning();
  return branch;
}

export async function update(id: string, data: Partial<typeof branches.$inferInsert>) {
  const [branch] = await db
    .update(branches)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(branches.id, id))
    .returning();
  if (!branch) throw new AppError(404, 'Branch not found');
  return branch;
}
