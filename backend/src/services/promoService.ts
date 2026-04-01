import { eq, sql, and, lt, gte } from 'drizzle-orm';
import { db } from '../config/database.js';
import { promoCodes } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { RoomType } from '../types/index.js';

/** Debounce: chỉ refresh tối đa 1 lần/60 giây */
let lastRefreshTime = 0;
const REFRESH_INTERVAL_MS = 60_000;

/**
 * Tự động chuyển mã khuyến mãi hết hạn sang status='expired'.
 * Chạy debounced — tối đa 1 lần mỗi 60 giây.
 */
async function refreshStatuses() {
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_INTERVAL_MS) return;
  lastRefreshTime = now;

  const today = new Date().toISOString().split('T')[0];
  await db
    .update(promoCodes)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(promoCodes.status, 'active'),
        sql`(${promoCodes.endDate} < ${today} OR ${promoCodes.usedCount} >= ${promoCodes.maxUses})`,
      ),
    );
}

/** Lấy danh sách mã khuyến mãi — tự động refresh status trước khi trả kết quả */
export async function getAll(statusFilter?: string) {
  await refreshStatuses();
  if (statusFilter) {
    return db.select().from(promoCodes).where(eq(promoCodes.status, statusFilter));
  }
  return db.select().from(promoCodes);
}

/** Lấy mã khuyến mãi theo ID */
export async function getById(id: string) {
  const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  if (!promo) throw new AppError(404, 'Promo code not found');
  return promo;
}

/** Tìm mã khuyến mãi theo code (tự động uppercase) */
export async function getByCode(code: string) {
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code.toUpperCase()))
    .limit(1);
  return promo || null;
}

/** Tạo mã khuyến mãi mới — tự động uppercase code */
export async function create(data: typeof promoCodes.$inferInsert) {
  const [promo] = await db.insert(promoCodes).values({
    ...data,
    code: data.code.toUpperCase(),
    usedCount: 0,
  }).returning();
  return promo;
}

/** Cập nhật mã khuyến mãi */
export async function update(id: string, data: Partial<typeof promoCodes.$inferInsert>) {
  if (data.code) data.code = data.code.toUpperCase();
  const [promo] = await db
    .update(promoCodes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(promoCodes.id, id))
    .returning();
  if (!promo) throw new AppError(404, 'Promo code not found');
  return promo;
}

/** Xóa vĩnh viễn mã khuyến mãi */
export async function remove(id: string) {
  const [promo] = await db.delete(promoCodes).where(eq(promoCodes.id, id)).returning();
  if (!promo) throw new AppError(404, 'Promo code not found');
  return promo;
}

/**
 * Kiểm tra tính hợp lệ của mã khuyến mãi
 * Xác minh: tồn tại, đang active, còn lượt, trong thời hạn, đúng loại phòng
 * @param code - Mã khuyến mãi
 * @param roomType - Loại phòng cần áp dụng
 * @returns { valid: boolean, error?: string, promo?: object }
 */
export async function validate(code: string, roomType: RoomType) {
  await refreshStatuses();

  const promo = await getByCode(code);
  if (!promo) {
    return { valid: false, error: 'Ma khuyen mai khong ton tai' };
  }
  if (promo.status !== 'active') {
    return { valid: false, error: 'Ma khuyen mai da het han hoac bi vo hieu' };
  }
  if (promo.usedCount >= promo.maxUses) {
    return { valid: false, error: 'Ma khuyen mai da het luot su dung' };
  }

  const today = new Date().toISOString().split('T')[0];
  if (today < promo.startDate || today > promo.endDate) {
    return { valid: false, error: 'Ma khuyen mai ngoai thoi gian hieu luc' };
  }

  const applicableTypes = promo.applicableRoomTypes as string[];
  if (applicableTypes.length > 0 && !applicableTypes.includes(roomType)) {
    return { valid: false, error: 'Ma khuyen mai khong ap dung cho loai phong nay' };
  }

  return { valid: true, promo };
}

/**
 * Áp dụng mã khuyến mãi — tính giảm giá và tăng usedCount atomically
 * Hỗ trợ giảm theo phần trăm hoặc số tiền cố định
 * @param code - Mã khuyến mãi
 * @param roomType - Loại phòng
 * @param originalPrice - Giá gốc (VNĐ)
 * @returns { discountAmount, finalTotal }
 * @throws AppError 400 nếu mã không hợp lệ
 */
export async function applyDiscount(code: string, roomType: RoomType, originalPrice: number) {
  const result = await validate(code, roomType);
  if (!result.valid || !result.promo) {
    throw new AppError(400, result.error || 'Invalid promo code');
  }

  const promo = result.promo;
  let discountAmount: number;

  if (promo.discountType === 'percent') {
    discountAmount = Math.round(originalPrice * promo.discountValue / 100);
  } else {
    discountAmount = promo.discountValue;
  }

  discountAmount = Math.min(discountAmount, originalPrice);
  const finalTotal = originalPrice - discountAmount;

  await db
    .update(promoCodes)
    .set({ usedCount: sql`${promoCodes.usedCount} + 1`, updatedAt: new Date() })
    .where(eq(promoCodes.id, promo.id));

  return { discountAmount, finalTotal };
}
