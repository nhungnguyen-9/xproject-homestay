import { eq, and, ne, sql, desc, asc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bookings, customers } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { normalizePhone } from '../utils/phone.js';
import { STATUS_TRANSITIONS, type BookingStatus } from '../types/index.js';

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
 * @param roomId - ID phòng
 * @param date - Ngày kiểm tra (YYYY-MM-DD)
 * @param startTime - Giờ bắt đầu (HH:mm)
 * @param endTime - Giờ kết thúc (HH:mm)
 * @param excludeId - Bỏ qua booking này (dùng khi cập nhật)
 * @returns true nếu có trùng lịch
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
 * Tạo booking mới
 * Kiểm tra trùng lịch, tự động tạo khách hàng từ SĐT nếu là booking guest
 * @param data - Dữ liệu booking
 * @param userId - ID user tạo booking
 * @returns Booking vừa tạo
 * @throws AppError 409 nếu trùng lịch
 */
export async function create(
  data: typeof bookings.$inferInsert,
  userId?: string,
) {
  if (data.startTime && data.endTime && data.date && data.roomId) {
    const hasConflict = await checkOverlap(data.roomId, data.date, data.startTime, data.endTime);
    if (hasConflict) {
      throw new AppError(409, 'Time slot conflicts with an existing booking');
    }
  }

  // Auto-create customer for guest bookings
  let customerId: string | null = null;
  if (data.category === 'guest' && data.guestPhone) {
    customerId = await ensureCustomer(data.guestName ?? undefined, data.guestPhone ?? undefined);
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      ...data,
      customerId: customerId ?? data.customerId ?? undefined,
      createdBy: userId,
    })
    .returning();

  return booking;
}

/**
 * Cập nhật booking — kiểm tra trùng lịch nếu thay đổi thời gian.
 * Chỉ admin mới được gọi (route đã enforce).
 */
export async function update(id: string, data: Partial<typeof bookings.$inferInsert>) {
  if (data.startTime && data.endTime && data.date && data.roomId) {
    const hasConflict = await checkOverlap(data.roomId, data.date, data.startTime, data.endTime, id);
    if (hasConflict) {
      throw new AppError(409, 'Time slot conflicts with an existing booking');
    }
  }

  const [booking] = await db
    .update(bookings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  if (!booking) throw new AppError(404, 'Booking not found');
  return booking;
}

/**
 * Chuyển trạng thái booking theo ma trận STATUS_TRANSITIONS
 * @param id - ID booking
 * @param newStatus - Trạng thái mới
 * @returns Booking đã cập nhật
 * @throws AppError 400 nếu chuyển trạng thái không hợp lệ
 * @throws AppError 404 nếu booking không tồn tại
 */
export async function transitionStatus(id: string, newStatus: BookingStatus) {
  const booking = await getById(id);
  const currentStatus = booking.status as BookingStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(400, `Cannot transition from '${currentStatus}' to '${newStatus}'`);
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  return updated;
}

/** Xóa booking = chuyển trạng thái sang cancelled (soft delete) */
export async function remove(id: string) {
  return transitionStatus(id, 'cancelled');
}
