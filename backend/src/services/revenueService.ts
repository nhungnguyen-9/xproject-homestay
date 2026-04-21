import { sql, and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bookings, rooms, customers } from '../db/schema/index.js';
import { formatDateLocal } from '../utils/time.js';

/** Xác định khoảng ngày — mặc định là tháng hiện tại nếu không truyền */
function getDateRange(startDate?: string, endDate?: string) {
  if (startDate && endDate) return { start: startDate, end: endDate };

  // Default: current month (theo local timezone)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDateLocal(monthStart), end: formatDateLocal(monthEnd) };
}

/** Tính khoảng thời gian trước đó (cùng độ dài) để so sánh tăng trưởng */
function getPreviousPeriod(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const duration = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return {
    prevStart: formatDateLocal(prevStart),
    prevEnd: formatDateLocal(prevEnd),
  };
}

/**
 * Tổng hợp doanh thu: tổng tiền, số booking, công suất phòng, trung bình/booking.
 * So sánh với kỳ trước để tính delta tăng trưởng.
 */
export async function getSummary(startDate?: string, endDate?: string) {
  const { start, end } = getDateRange(startDate, endDate);
  const { prevStart, prevEnd } = getPreviousPeriod(start, end);

  const dateFilter = and(
    gte(bookings.date, start),
    lte(bookings.date, end),
    eq(bookings.category, 'guest'),
  );
  const prevDateFilter = and(
    gte(bookings.date, prevStart),
    lte(bookings.date, prevEnd),
    eq(bookings.category, 'guest'),
  );

  const [[current], [previous], [occupancy], [roomCount]] = await Promise.all([
    db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)`,
      totalBookings: sql<number>`COUNT(*)`,
    }).from(bookings).where(dateFilter),

    db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)`,
      totalBookings: sql<number>`COUNT(*)`,
    }).from(bookings).where(prevDateFilter),

    db.select({
      totalBookedMinutes: sql<number>`COALESCE(SUM(
        EXTRACT(HOUR FROM (${bookings.endTime}::time - ${bookings.startTime}::time)) * 60 +
        EXTRACT(MINUTE FROM (${bookings.endTime}::time - ${bookings.startTime}::time))
      ), 0)`,
    }).from(bookings).where(and(
      gte(bookings.date, start),
      lte(bookings.date, end),
    )),

    db.select({
      count: sql<number>`COUNT(*)`,
    }).from(rooms).where(eq(rooms.isActive, true)),
  ]);

  const daysInPeriod = Math.max(1, Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1);
  const totalAvailableMinutes = Number(roomCount.count) * 24 * 60 * daysInPeriod;
  const totalBookedMinutes = Number(occupancy.totalBookedMinutes);
  const occupancyRate = totalAvailableMinutes > 0
    ? Math.round((totalBookedMinutes / totalAvailableMinutes) * 100)
    : 0;

  const totalRevenue = Number(current.totalRevenue);
  const totalBookings = Number(current.totalBookings);
  const prevRevenue = Number(previous.totalRevenue);
  const prevBookings = Number(previous.totalBookings);

  return {
    totalRevenue,
    totalBookings,
    occupancyRate,
    avgPerBooking: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
    revenueDelta: prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0,
    bookingsDelta: totalBookings - prevBookings,
  };
}

/**
 * Doanh thu theo ngày — điền 0 cho ngày không có booking.
 * Dùng cho biểu đồ doanh thu trên dashboard.
 */
export async function getDailyRevenue(startDate?: string, endDate?: string) {
  const { start, end } = getDateRange(startDate, endDate);

  const rows = await db.select({
    date: bookings.date,
    revenue: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)`,
  })
  .from(bookings)
  .where(and(
    gte(bookings.date, start),
    lte(bookings.date, end),
    eq(bookings.category, 'guest'),
  ))
  .groupBy(bookings.date)
  .orderBy(bookings.date);

  const result: { date: string; revenue: number }[] = [];
  const revenueMap = new Map(rows.map(r => [r.date, Number(r.revenue)]));
  const current = new Date(start);
  const endDt = new Date(end);
  while (current <= endDt) {
    const dateStr = formatDateLocal(current);
    result.push({ date: dateStr, revenue: revenueMap.get(dateStr) || 0 });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

/** Công suất sử dụng từng phòng (% thời gian có booking so với 24h/ngày) */
export async function getOccupancy(startDate?: string, endDate?: string) {
  const { start, end } = getDateRange(startDate, endDate);
  const daysInPeriod = Math.max(1, Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1);

  const rows = await db.select({
    roomId: rooms.id,
    roomName: rooms.name,
    roomType: rooms.type,
    totalBookedMinutes: sql<number>`COALESCE(SUM(
      EXTRACT(HOUR FROM (${bookings.endTime}::time - ${bookings.startTime}::time)) * 60 +
      EXTRACT(MINUTE FROM (${bookings.endTime}::time - ${bookings.startTime}::time))
    ), 0)`,
  })
  .from(rooms)
  .leftJoin(bookings, and(
    eq(rooms.id, bookings.roomId),
    gte(bookings.date, start),
    lte(bookings.date, end),
  ))
  .where(eq(rooms.isActive, true))
  .groupBy(rooms.id, rooms.name, rooms.type);

  const availableMinutes = 24 * 60 * daysInPeriod;

  return rows.map(r => ({
    roomId: r.roomId,
    roomName: r.roomName,
    roomType: r.roomType,
    occupancyPercent: availableMinutes > 0
      ? Math.round((Number(r.totalBookedMinutes) / availableMinutes) * 100)
      : 0,
  }));
}

/** Top khách hàng chi tiêu nhiều nhất trong khoảng thời gian */
export async function getTopCustomers(startDate?: string, endDate?: string, limit = 5) {
  const { start, end } = getDateRange(startDate, endDate);

  const rows = await db.select({
    customerId: bookings.customerId,
    name: sql<string>`COALESCE(${customers.name}, ${bookings.guestName}, 'N/A')`,
    totalSpent: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)`,
    visitCount: sql<number>`COUNT(*)`,
  })
  .from(bookings)
  .leftJoin(customers, eq(bookings.customerId, customers.id))
  .where(and(
    gte(bookings.date, start),
    lte(bookings.date, end),
    eq(bookings.category, 'guest'),
  ))
  .groupBy(bookings.customerId, customers.name, bookings.guestName)
  .orderBy(sql`SUM(${bookings.totalPrice}) DESC`)
  .limit(limit);

  return rows.map(r => ({
    name: r.name,
    totalSpent: Number(r.totalSpent),
    visitCount: Number(r.visitCount),
  }));
}
