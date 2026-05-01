import type { RoomType } from '@/types/schedule';
import { formatDateInput } from '@/utils/helpers';
import { apiFetch } from './apiClient';

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

function getPeriodRange(period: 'today' | 'week' | 'month'): {
  start: string;
  end: string;
} {
  const now = new Date();

  if (period === 'today') {
    return { start: formatDateInput(now), end: formatDateInput(now) };
  }

  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: formatDateInput(weekStart), end: formatDateInput(weekEnd) };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDateInput(monthStart), end: formatDateInput(monthEnd) };
}

/**
 * Tính tổng hợp doanh thu theo kỳ, so sánh với kỳ trước
 */
export async function getRevenueByPeriod(
  period: 'today' | 'week' | 'month',
): Promise<RevenueSummary> {
  const { start, end } = getPeriodRange(period);
  const params = new URLSearchParams({ startDate: start, endDate: end });
  return apiFetch<RevenueSummary>(`/revenue/summary?${params.toString()}`);
}

/**
 * Tính phần trăm công suất sử dụng của từng phòng theo kỳ
 */
export async function getOccupancyByRoom(
  period: 'today' | 'week' | 'month',
): Promise<RoomOccupancy[]> {
  const { start, end } = getPeriodRange(period);
  const params = new URLSearchParams({ startDate: start, endDate: end });
  return apiFetch<RoomOccupancy[]>(`/revenue/occupancy?${params.toString()}`);
}

/**
 * Lấy danh sách khách hàng chi tiêu nhiều nhất theo kỳ
 */
export async function getTopCustomers(
  period: 'today' | 'week' | 'month',
  limit: number = 5,
): Promise<TopCustomer[]> {
  const { start, end } = getPeriodRange(period);
  const params = new URLSearchParams({
    startDate: start,
    endDate: end,
    limit: String(limit),
  });
  return apiFetch<TopCustomer[]>(`/revenue/top-customers?${params.toString()}`);
}

/**
 * Lấy doanh thu theo từng ngày trong khoảng thời gian
 */
export async function getDailyRevenue(
  startDate: string,
  endDate: string,
): Promise<DailyRevenue[]> {
  const params = new URLSearchParams({ startDate, endDate });
  return apiFetch<DailyRevenue[]>(`/revenue/daily?${params.toString()}`);
}
