import { eq, and, ne, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bookings, customers, rooms, foodItems, promoCodes } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { normalizePhone } from '../utils/phone.js';
import { calculatePrice } from '../utils/price.js';
import { STATUS_TRANSITIONS, type BookingStatus, type RoomType } from '../types/index.js';
import * as promoService from './promoService.js';

/** Input type nới lỏng so với $inferInsert: foodItems có name/price optional (server sẽ re-fetch từ DB). */
type BookingCreateInput = Omit<typeof bookings.$inferInsert, 'foodItems'> & {
  foodItems?: Array<{ id: string; name?: string; price?: number; qty?: number }> | null;
};
type BookingUpdateInput = Partial<BookingCreateInput>;

/**
 * Lấy danh sách booking có phân trang và lọc.
 * Hỗ trợ lọc theo ngày, phòng, trạng thái, khách hàng.
 */
export async function getAll(filters: {
  date?: string;
  roomId?: string;
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}) {
  const conditions = [];
  if (filters.date) conditions.push(eq(bookings.date, filters.date));
  if (filters.roomId) conditions.push(eq(bookings.roomId, filters.roomId));
  if (filters.status) conditions.push(eq(bookings.status, filters.status));
  if (filters.customerId) conditions.push(eq(bookings.customerId, filters.customerId));

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(bookings).where(where).orderBy(desc(bookings.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(where),
  ]);

  const total = Number(countResult[0].count);
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Lấy chi tiết booking theo ID
 * @param id - ID booking
 * @throws AppError 404 nếu không tìm thấy
 */
export async function getById(id: string) {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking) throw new AppError(404, 'Booking not found');
  return booking;
}

/**
 * Kiểm tra trùng lịch phòng
 * Tìm booking chưa hủy có thời gian chồng chéo trên cùng phòng + ngày
 */
export async function checkOverlap(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  const conditions = [
    eq(bookings.roomId, roomId),
    eq(bookings.date, date),
    ne(bookings.status, 'cancelled'),
    sql`${bookings.startTime} < ${endTime}`,
    sql`${bookings.endTime} > ${startTime}`,
  ];
  if (excludeId) {
    conditions.push(ne(bookings.id, excludeId));
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(and(...conditions));

  return Number(result.count) > 0;
}

/**
 * Đảm bảo khách hàng tồn tại trong hệ thống.
 * Tìm theo SĐT — nếu chưa có thì tự động tạo mới.
 */
async function ensureCustomer(guestName?: string, guestPhone?: string): Promise<string | null> {
  if (!guestPhone) return null;

  const normalized = normalizePhone(guestPhone);
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, normalized))
    .limit(1);

  if (existing) return existing.id;

  const [newCustomer] = await db
    .insert(customers)
    .values({ name: guestName || 'Unknown', phone: normalized })
    .returning();

  return newCustomer.id;
}

/**
 * Re-fetch food items từ DB để lấy price/name đáng tin cậy.
 * Client có thể gửi price sai — server trust DB.
 */
async function resolveFoodItems(
  items: Array<{ id: string; name?: string; price?: number; qty?: number }>,
): Promise<Array<{ id: string; name: string; price: number; qty: number }>> {
  if (!items || items.length === 0) return [];
  const ids = items.map((i) => i.id);
  const rows = await db.select().from(foodItems).where(inArray(foodItems.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));

  return items
    .map((item) => {
      const dbItem = byId.get(item.id);
      if (!dbItem) return null;
      return {
        id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        qty: Math.max(1, item.qty ?? 1),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/**
 * Tạo booking mới — tính giá server-side, wrap promo usage + booking insert trong transaction.
 *
 * Quy trình:
 * 1. Check trùng lịch.
 * 2. Fetch room để lấy priceConfig (trusted).
 * 3. Re-fetch food items từ DB (client có thể gửi giá sai).
 * 4. Validate voucher nếu có → compute discount.
 * 5. Tính totalPrice server-side, bỏ qua totalPrice client gửi.
 * 6. Transaction: insert booking + increment promo.usedCount → rollback cả hai nếu fail.
 *
 * @throws AppError 404 nếu room không tồn tại
 * @throws AppError 409 nếu trùng lịch
 * @throws AppError 400 nếu voucher không hợp lệ
 */
export async function create(
  data: BookingCreateInput,
  userId?: string,
) {
  if (data.startTime && data.endTime && data.date && data.roomId) {
    const hasConflict = await checkOverlap(data.roomId, data.date, data.startTime, data.endTime);
    if (hasConflict) {
      throw new AppError(409, 'Time slot conflicts with an existing booking');
    }
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.id, data.roomId)).limit(1);
  if (!room) {
    throw new AppError(404, 'Room not found');
  }

  const resolvedFoodItems = await resolveFoodItems(
    (data.foodItems as Array<{ id: string; name?: string; price?: number; qty?: number }>) || [],
  );

  let discountAmount = 0;
  let promoToApply: { id: string; code: string; discountType: string; discountValue: number } | null = null;
  if (data.voucher) {
    const validation = await promoService.validate(data.voucher, room.type as RoomType);
    if (!validation.valid || !validation.promo) {
      throw new AppError(400, validation.error || 'Invalid promo code');
    }
    promoToApply = validation.promo;

    const roomPrice = calculatePrice(
      data.mode || 'hourly',
      data.startTime,
      data.endTime,
      {
        hourlyRate: room.hourlyRate,
        dailyRate: room.dailyRate,
        overnightRate: room.overnightRate,
        extraHourRate: room.extraHourRate,
      },
      resolvedFoodItems,
      0,
    );
    discountAmount = promoService.computeDiscount(promoToApply, roomPrice);
  }

  const totalPrice = calculatePrice(
    data.mode || 'hourly',
    data.startTime,
    data.endTime,
    {
      hourlyRate: room.hourlyRate,
      dailyRate: room.dailyRate,
      overnightRate: room.overnightRate,
      extraHourRate: room.extraHourRate,
    },
    resolvedFoodItems,
    discountAmount,
  );

  let customerId: string | null = null;
  if (data.category === 'guest' && data.guestPhone) {
    customerId = await ensureCustomer(data.guestName ?? undefined, data.guestPhone ?? undefined);
  }

  return db.transaction(async (tx) => {
    const [booking] = await tx
      .insert(bookings)
      .values({
        ...data,
        foodItems: resolvedFoodItems,
        totalPrice,
        customerId: customerId ?? data.customerId ?? undefined,
        createdBy: userId,
      })
      .returning();

    if (promoToApply) {
      await tx
        .update(promoCodes)
        .set({ usedCount: sql`${promoCodes.usedCount} + 1`, updatedAt: new Date() })
        .where(eq(promoCodes.id, promoToApply.id));
    }

    return booking;
  });
}

/**
 * Cập nhật booking — kiểm tra trùng lịch nếu thay đổi thời gian.
 * Chỉ admin mới được gọi (route đã enforce).
 * Note: không recompute totalPrice ở đây — update path dành cho admin chỉnh tay.
 */
export async function update(id: string, data: BookingUpdateInput) {
  if (data.startTime && data.endTime && data.date && data.roomId) {
    const hasConflict = await checkOverlap(data.roomId, data.date, data.startTime, data.endTime, id);
    if (hasConflict) {
      throw new AppError(409, 'Time slot conflicts with an existing booking');
    }
  }

  const { foodItems: rawFoodItems, ...rest } = data;
  const patch: Partial<typeof bookings.$inferInsert> = { ...rest, updatedAt: new Date() };
  if (rawFoodItems !== undefined) {
    patch.foodItems = await resolveFoodItems(rawFoodItems ?? []);
  }

  const [booking] = await db
    .update(bookings)
    .set(patch)
    .where(eq(bookings.id, id))
    .returning();

  if (!booking) throw new AppError(404, 'Booking not found');
  return booking;
}

/**
 * Chuyển trạng thái booking theo ma trận STATUS_TRANSITIONS.
 * Khi chuyển sang 'cancelled' và booking có voucher, hoàn lại 1 lượt sử dụng promo
 * (cùng transaction với update status).
 * @throws AppError 400 nếu chuyển trạng thái không hợp lệ
 */
export async function transitionStatus(id: string, newStatus: BookingStatus) {
  const booking = await getById(id);
  const currentStatus = booking.status as BookingStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(400, `Cannot transition from '${currentStatus}' to '${newStatus}'`);
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(bookings)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();

    if (newStatus === 'cancelled' && booking.voucher) {
      await promoService.refundUsage(booking.voucher, tx as unknown as typeof db);
    }

    return updated;
  });
}

/** Xóa booking = chuyển trạng thái sang cancelled (soft delete) */
export async function remove(id: string) {
  return transitionStatus(id, 'cancelled');
}
