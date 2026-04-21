import { eq, and, ne, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bookings, customers, rooms, foodItems, promoCodes } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { normalizePhone } from '../utils/phone.js';
import { calculatePrice } from '../utils/price.js';
import { addDaysISO } from '../utils/time.js';
import { findOverlappingBooking } from '../utils/bookingOverlap.js';
import { computeCleaningSlot } from '../utils/cleaningSlot.js';
import { STATUS_TRANSITIONS, type BookingStatus, type RoomType } from '../types/index.js';
import * as promoService from './promoService.js';

/** Input type nới lỏng so với $inferInsert: foodItems có name/price optional (server sẽ re-fetch từ DB). */
type BookingCreateInput = Omit<typeof bookings.$inferInsert, 'foodItems'> & {
  foodItems?: Array<{ id: string; name?: string; price?: number; qty?: number }> | null;
};
type BookingUpdateInput = Partial<BookingCreateInput>;

/**
 * Nhận diện lỗi Postgres 23P01 (exclusion_violation) từ EXCLUDE constraint overlap.
 * Race-safety: in-app checkOverlap bắt 99% overlap, nhưng 2 request đồng thời
 * có thể cùng lọt qua → DB constraint chặn lần sau; dịch sang 409 để client hiểu.
 */
function isOverlapViolation(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: string }).code === '23P01';
}

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
 * Kiểm tra trùng lịch phòng — overnight-aware.
 *
 * Query candidate bookings trong cửa sổ date ± 1 ngày (để bắt booking qua đêm
 * từ hôm trước vẫn còn active sang hôm sau), sau đó so sánh bằng timestamp
 * numeric trong JS thay vì text compare SQL.
 *
 * @param mode - Chế độ booking ('overnight' ép +24h vào endTime). Mặc định 'hourly'.
 */
export async function checkOverlap(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  mode: string = 'hourly',
  excludeId?: string,
): Promise<boolean> {
  const conditions = [
    eq(bookings.roomId, roomId),
    inArray(bookings.date, [addDaysISO(date, -1), date, addDaysISO(date, 1)]),
    ne(bookings.status, 'cancelled'),
  ];
  if (excludeId) {
    conditions.push(ne(bookings.id, excludeId));
  }

  const candidates = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      mode: bookings.mode,
    })
    .from(bookings)
    .where(and(...conditions));

  return findOverlappingBooking({ date, startTime, endTime, mode }, candidates) !== null;
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
 * Auto-tạo booking dọn phòng 30 phút sau một booking khách.
 *
 * Best-effort: overlap → bỏ qua (không fail guest); DB error → log + swallow.
 * Không dùng transaction chung với guest insert — cleaning hỏng KHÔNG được rollback guest.
 *
 * Link với guest theo soft-match: (roomId, date, startTime == guest.endTime, category='internal', internalTag='cleaning').
 */
async function tryCreateCleaningBooking(
  guest: typeof bookings.$inferSelect,
): Promise<void> {
  try {
    const slot = computeCleaningSlot({
      date: guest.date,
      startTime: guest.startTime,
      endTime: guest.endTime,
    });

    const candidates = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        mode: bookings.mode,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, guest.roomId),
          inArray(bookings.date, [addDaysISO(slot.date, -1), slot.date, addDaysISO(slot.date, 1)]),
          ne(bookings.status, 'cancelled'),
        ),
      );

    const conflict = findOverlappingBooking(
      { date: slot.date, startTime: slot.startTime, endTime: slot.endTime, mode: 'hourly' },
      candidates,
    );
    if (conflict) {
      console.info('[cleaning] skipped due to overlap', {
        guestId: guest.id,
        roomId: guest.roomId,
        overlapId: conflict.id,
      });
      return;
    }

    const [inserted] = await db
      .insert(bookings)
      .values({
        roomId: guest.roomId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        mode: 'hourly',
        category: 'internal',
        internalTag: 'cleaning',
        status: 'confirmed',
        totalPrice: 0,
        internalNote: 'Auto-tạo sau booking khách',
        createdBy: guest.createdBy ?? null,
      })
      .returning({ id: bookings.id });
    console.info('[cleaning] created', {
      guestId: guest.id,
      cleaningId: inserted?.id,
      date: slot.date,
      startTime: slot.startTime,
    });
  } catch (err) {
    console.error('[cleaning] insert failed', { guestId: guest.id, err });
  }
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
    const hasConflict = await checkOverlap(
      data.roomId,
      data.date,
      data.startTime,
      data.endTime,
      data.mode || 'hourly',
    );
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
        combo3hRate: room.combo3hRate,
        combo6h1hRate: room.combo6h1hRate,
        combo6h1hDiscount: room.combo6h1hDiscount,
        discountSlots: room.discountSlots,
      },
      resolvedFoodItems,
      0,
      (data.combo6h1hOption as 'bonus_hour' | 'discount' | undefined) ?? 'bonus_hour',
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
      combo3hRate: room.combo3hRate,
      combo6h1hRate: room.combo6h1hRate,
      combo6h1hDiscount: room.combo6h1hDiscount,
      discountSlots: room.discountSlots,
    },
    resolvedFoodItems,
    discountAmount,
    (data.combo6h1hOption as 'bonus_hour' | 'discount' | undefined) ?? 'bonus_hour',
  );

  let customerId: string | null = null;
  if (data.category === 'guest' && data.guestPhone) {
    customerId = await ensureCustomer(data.guestName ?? undefined, data.guestPhone ?? undefined);
  }

  // Strip client-supplied totalPrice defensively — server owns pricing.
  const { totalPrice: _clientTotalIgnored, ...dataWithoutClientTotal } = data;

  let saved: typeof bookings.$inferSelect;
  try {
    saved = await db.transaction(async (tx) => {
      const [booking] = await tx
        .insert(bookings)
        .values({
          ...dataWithoutClientTotal,
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
  } catch (err) {
    if (isOverlapViolation(err)) {
      throw new AppError(409, 'Phòng đã có lịch đặt trong khung giờ này');
    }
    throw err;
  }

  // Post-commit, best-effort: auto-tạo cleaning slot 30p sau guest booking.
  // Không trigger cho category='internal' để tránh recursion.
  if (saved.category === 'guest') {
    await tryCreateCleaningBooking(saved);
  }

  return saved;
}

/**
 * Cập nhật booking — server-side pricing authority.
 *
 * Quy trình:
 * 1. Load current booking (để merge patch với state hiện tại).
 * 2. Nếu thay đổi thời gian/phòng/chế độ → check trùng lịch.
 * 3. Strip client totalPrice — server tự tính.
 * 4. Resolve food items: patch có thì re-fetch từ DB, không thì giữ nguyên.
 * 5. Fetch room rates cho price compute.
 * 6. Validate voucher (không increment — usage đã tăng ở create). Nếu voucher
 *    không còn valid (ví dụ hết hạn giữa chừng), discount = 0 nhưng giữ voucher field.
 * 7. Recompute totalPrice bằng calculatePrice trên merged state.
 *
 * Note: voucher swap (đổi mã khác) ở đây KHÔNG refund mã cũ / increment mã mới —
 * scope đó nằm ngoài task này, cần flow riêng.
 */
export async function update(id: string, data: BookingUpdateInput) {
  const current = await getById(id);

  const effective = {
    roomId: data.roomId ?? current.roomId,
    date: data.date ?? current.date,
    startTime: data.startTime ?? current.startTime,
    endTime: data.endTime ?? current.endTime,
    mode: (data.mode ?? current.mode ?? 'hourly') as string,
    combo6h1hOption: ((data.combo6h1hOption ?? current.combo6h1hOption ?? 'bonus_hour') as 'bonus_hour' | 'discount'),
    voucher: data.voucher !== undefined ? data.voucher : current.voucher,
  };

  const timeChanged =
    data.startTime !== undefined || data.endTime !== undefined ||
    data.date !== undefined || data.roomId !== undefined ||
    data.mode !== undefined;
  if (timeChanged) {
    const hasConflict = await checkOverlap(
      effective.roomId,
      effective.date,
      effective.startTime,
      effective.endTime,
      effective.mode,
      id,
    );
    if (hasConflict) {
      throw new AppError(409, 'Time slot conflicts with an existing booking');
    }
  }

  // Strip client-supplied totalPrice — server owns pricing.
  const { foodItems: rawFoodItems, totalPrice: _clientTotalIgnored, ...rest } = data;
  const patch: Partial<typeof bookings.$inferInsert> = { ...rest, updatedAt: new Date() };

  const effectiveFoodItems = rawFoodItems !== undefined
    ? await resolveFoodItems(rawFoodItems ?? [])
    : ((current.foodItems as Array<{ id: string; name: string; price: number; qty?: number }>) || []);
  if (rawFoodItems !== undefined) {
    patch.foodItems = effectiveFoodItems;
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.id, effective.roomId)).limit(1);
  if (!room) {
    throw new AppError(404, 'Room not found');
  }

  const priceConfig = {
    hourlyRate: room.hourlyRate,
    dailyRate: room.dailyRate,
    overnightRate: room.overnightRate,
    extraHourRate: room.extraHourRate,
    combo3hRate: room.combo3hRate,
    combo6h1hRate: room.combo6h1hRate,
    combo6h1hDiscount: room.combo6h1hDiscount,
    discountSlots: room.discountSlots,
  };

  let discountAmount = 0;
  if (effective.voucher) {
    const validation = await promoService.validate(effective.voucher, room.type as RoomType);
    if (validation.valid && validation.promo) {
      const priceNoDiscount = calculatePrice(
        effective.mode,
        effective.startTime,
        effective.endTime,
        priceConfig,
        effectiveFoodItems,
        0,
        effective.combo6h1hOption,
      );
      discountAmount = promoService.computeDiscount(validation.promo, priceNoDiscount);
    }
  }

  patch.totalPrice = calculatePrice(
    effective.mode,
    effective.startTime,
    effective.endTime,
    priceConfig,
    effectiveFoodItems,
    discountAmount,
    effective.combo6h1hOption,
  );

  let booking: typeof bookings.$inferSelect | undefined;
  try {
    [booking] = await db
      .update(bookings)
      .set(patch)
      .where(eq(bookings.id, id))
      .returning();
  } catch (err) {
    if (isOverlapViolation(err)) {
      throw new AppError(409, 'Phòng đã có lịch đặt trong khung giờ này');
    }
    throw err;
  }

  if (!booking) throw new AppError(404, 'Booking not found');
  return booking;
}

/**
 * Cascade cancel: khi guest booking bị hủy, hủy luôn cleaning booking tự-tạo
 * (soft-match theo roomId + date + startTime == guest.endTime + internalTag='cleaning').
 *
 * Silent & best-effort: không throw, không notification. Log info nếu có match.
 * Idempotent: `ne(status, 'cancelled')` filter giúp tránh double-cancel.
 */
async function tryCascadeCancelCleaning(
  guest: typeof bookings.$inferSelect,
): Promise<void> {
  try {
    const slot = computeCleaningSlot({
      date: guest.date,
      startTime: guest.startTime,
      endTime: guest.endTime,
    });

    const cancelled = await db
      .update(bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(
          eq(bookings.roomId, guest.roomId),
          eq(bookings.date, slot.date),
          eq(bookings.startTime, slot.startTime),
          eq(bookings.category, 'internal'),
          eq(bookings.internalTag, 'cleaning'),
          ne(bookings.status, 'cancelled'),
        ),
      )
      .returning({ id: bookings.id });

    if (cancelled.length > 0) {
      console.info('[cleaning] cascade cancelled', {
        guestId: guest.id,
        cleaningIds: cancelled.map((r) => r.id),
      });
    }
  } catch (err) {
    console.error('[cleaning] cascade cancel failed', { guestId: guest.id, err });
  }
}

/**
 * Chuyển trạng thái booking theo ma trận STATUS_TRANSITIONS.
 * Khi chuyển sang 'cancelled' và booking có voucher, hoàn lại 1 lượt sử dụng promo
 * (cùng transaction với update status).
 *
 * Cascade: khi hủy một guest booking, cleaning booking tự-tạo (nếu có) cũng bị hủy
 * sau khi transaction commit (silent, không rollback nếu cascade lỗi).
 *
 * @throws AppError 400 nếu chuyển trạng thái không hợp lệ
 */
export async function transitionStatus(id: string, newStatus: BookingStatus) {
  const booking = await getById(id);
  const currentStatus = booking.status as BookingStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(400, `Cannot transition from '${currentStatus}' to '${newStatus}'`);
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(bookings)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();

    if (newStatus === 'cancelled' && booking.voucher) {
      await promoService.refundUsage(booking.voucher, tx as unknown as typeof db);
    }

    return row;
  });

  if (newStatus === 'cancelled' && booking.category === 'guest') {
    await tryCascadeCancelCleaning(booking);
  }

  return updated;
}

/** Xóa booking = chuyển trạng thái sang cancelled (soft delete) */
export async function remove(id: string) {
  return transitionStatus(id, 'cancelled');
}
