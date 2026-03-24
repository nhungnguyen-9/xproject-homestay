import { sql, and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bookings, rooms, customers } from '../db/schema/index.js';

function getDateRange(startDate?: string, endDate?: string) {
  const now = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  if (startDate && endDate) return { start: startDate, end: endDate };

  // Default: current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDate(monthStart), end: formatDate(monthEnd) };
}

function getPreviousPeriod(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const duration = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return {
    prevStart: prevStart.toISOString().split('T')[0],
    prevEnd: prevEnd.toISOString().split('T')[0],
  };
}

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

    // Occupancy: count total booked hours vs available hours
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

  // Fill in missing dates with 0 revenue
  const result: { date: string; revenue: number }[] = [];
  const revenueMap = new Map(rows.map(r => [r.date, Number(r.revenue)]));
  const current = new Date(start);
  const endDt = new Date(end);
  while (current <= endDt) {
    const dateStr = current.toISOString().split('T')[0];
    result.push({ date: dateStr, revenue: revenueMap.get(dateStr) || 0 });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

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
