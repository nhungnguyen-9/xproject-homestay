import type { Booking, RoomType } from '@/types/schedule';
import type { Customer } from '@/types/customer';

const BOOKINGS_KEY = 'nhacam_bookings';
const CUSTOMERS_KEY = 'nhacam_customers';

export interface RevenueSummary {
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  avgPerBooking: number;
  revenueDelta: number;
  bookingsDelta: number;
}

export interface RoomOccupancy {
  roomId: string;
  roomName: string;
  roomType: RoomType;
  occupancyPercent: number;
}

export interface TopCustomer {
  name: string;
  totalSpent: number;
  visitCount: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

const ROOMS: { id: string; name: string; type: RoomType }[] = [
  { id: 'g01', name: 'G01', type: 'standard' },
  { id: 'p102', name: 'P102', type: 'standard' },
  { id: 'p103', name: 'P103', type: 'standard' },
  { id: 'p104', name: 'P104', type: 'vip' },
  { id: 'p105', name: 'P105', type: 'vip' },
  { id: 'p106', name: 'P106', type: 'supervip' },
];

function loadBookings(): Booking[] {
  const stored = localStorage.getItem(BOOKINGS_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

function loadCustomers(): Customer[] {
  const stored = localStorage.getItem(CUSTOMERS_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getBookingHours(booking: Booking): number {
  const start = toMinutes(booking.startTime);
  const end = toMinutes(booking.endTime);
  return Math.max(0, (end - start) / 60);
}

function getPeriodRange(period: 'today' | 'week' | 'month'): {
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
} {
  const now = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  if (period === 'today') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      start: formatDate(now),
      end: formatDate(now),
      prevStart: formatDate(yesterday),
      prevEnd: formatDate(yesterday),
    };
  }

  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

    return {
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
      prevStart: formatDate(prevWeekStart),
      prevEnd: formatDate(prevWeekEnd),
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    start: formatDate(monthStart),
    end: formatDate(monthEnd),
    prevStart: formatDate(prevMonthStart),
    prevEnd: formatDate(prevMonthEnd),
  };
}

function filterByDateRange(
  bookings: Booking[],
  start: string,
  end: string,
): Booking[] {
  return bookings.filter((b) => b.date >= start && b.date <= end);
}

/**
 * Tính tổng hợp doanh thu theo kỳ, so sánh với kỳ trước
 * @param period - Kỳ thống kê: 'today', 'week' hoặc 'month'
 * @returns Tổng hợp doanh thu gồm tổng tiền, số booking, công suất, trung bình và biến động
 */
export function getRevenueByPeriod(
  period: 'today' | 'week' | 'month',
): RevenueSummary {
  const allBookings = loadBookings();
  const { start, end, prevStart, prevEnd } = getPeriodRange(period);

  const current = filterByDateRange(allBookings, start, end);
  const previous = filterByDateRange(allBookings, prevStart, prevEnd);

  const guestCurrent = current.filter((b) => b.category === 'guest');
  const guestPrevious = previous.filter((b) => b.category === 'guest');

  const totalRevenue = guestCurrent.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0,
  );
  const prevRevenue = guestPrevious.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0,
  );

  const totalBookings = guestCurrent.length;
  const prevBookings = guestPrevious.length;

  // Công suất = tổng giờ đặt trên tất cả phòng / tổng giờ khả dụng
  const daysInPeriod = Math.max(
    1,
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );
  const totalAvailableHours = ROOMS.length * 24 * daysInPeriod;
  const totalBookedHours = current.reduce(
    (sum, b) => sum + getBookingHours(b),
    0,
  );
  const occupancyRate =
    totalAvailableHours > 0
      ? Math.round((totalBookedHours / totalAvailableHours) * 100)
      : 0;

  const avgPerBooking =
    totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  const revenueDelta =
    prevRevenue > 0
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
      : 0;
  const bookingsDelta = totalBookings - prevBookings;

  return {
    totalRevenue,
    totalBookings,
    occupancyRate,
    avgPerBooking,
    revenueDelta,
    bookingsDelta,
  };
}

/**
 * Tính phần trăm công suất sử dụng của từng phòng theo kỳ
 * @param period - Kỳ thống kê: 'today', 'week' hoặc 'month'
 * @returns Mảng công suất từng phòng
 */
export function getOccupancyByRoom(
  period: 'today' | 'week' | 'month',
): RoomOccupancy[] {
  const allBookings = loadBookings();
  const { start, end } = getPeriodRange(period);
  const current = filterByDateRange(allBookings, start, end);

  const daysInPeriod = Math.max(
    1,
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );

  return ROOMS.map((room) => {
    const roomBookings = current.filter((b) => b.roomId === room.id);
    const bookedHours = roomBookings.reduce(
      (sum, b) => sum + getBookingHours(b),
      0,
    );
    const availableHours = 24 * daysInPeriod;
    const occupancyPercent =
      availableHours > 0
        ? Math.round((bookedHours / availableHours) * 100)
        : 0;

    return {
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      occupancyPercent,
    };
  });
}

/**
 * Lấy danh sách khách hàng chi tiêu nhiều nhất theo kỳ
 * @param period - Kỳ thống kê: 'today', 'week' hoặc 'month'
 * @param limit - Số lượng khách hàng tối đa trả về (mặc định 5)
 * @returns Mảng khách hàng hàng đầu kèm tổng chi tiêu và số lần ghé
 */
export function getTopCustomers(
  period: 'today' | 'week' | 'month',
  limit: number = 5,
): TopCustomer[] {
  const allBookings = loadBookings();
  const customers = loadCustomers();
  const { start, end } = getPeriodRange(period);

  const current = filterByDateRange(allBookings, start, end).filter(
    (b) => b.category === 'guest' && b.guestPhone,
  );

  const phoneMap = new Map<
    string,
    { totalSpent: number; visitCount: number; name: string }
  >();

  for (const booking of current) {
    const phone = booking.guestPhone!;
    const existing = phoneMap.get(phone) || {
      totalSpent: 0,
      visitCount: 0,
      name: booking.guestName || 'N/A',
    };

    existing.totalSpent += booking.totalPrice || 0;
    existing.visitCount += 1;

    const customer = customers.find((c) => c.phone === phone);
    if (customer) {
      existing.name = customer.name;
    }

    phoneMap.set(phone, existing);
  }

  return Array.from(phoneMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit)
    .map((entry) => ({
      name: entry.name,
      totalSpent: entry.totalSpent,
      visitCount: entry.visitCount,
    }));
}

/**
 * Lấy doanh thu theo từng ngày trong khoảng thời gian
 * @param startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param endDate - Ngày kết thúc (YYYY-MM-DD)
 * @returns Mảng doanh thu theo ngày
 */
export function getDailyRevenue(
  startDate: string,
  endDate: string,
): DailyRevenue[] {
  const allBookings = loadBookings();
  const filtered = filterByDateRange(allBookings, startDate, endDate).filter(
    (b) => b.category === 'guest',
  );

  const result: DailyRevenue[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayRevenue = filtered
      .filter((b) => b.date === dateStr)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    result.push({
      date: dateStr,
      revenue: dayRevenue,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}
