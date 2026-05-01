import type { Booking, BookingStatus } from '@/types/schedule';
import { apiFetch } from './apiClient';

/** Shape backend trả về cho GET /bookings (có pagination) */
interface PaginatedBookings {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Payload tạo booking — khớp createBookingSchema backend. Server sẽ tự tính totalPrice, kiểm tra overlap, và áp voucher */
export type CreateBookingPayload = Omit<Booking, 'id'> & { mode?: 'hourly' | 'daily' | 'overnight' };

/** Query params cho GET /bookings */
export interface ListBookingsParams {
  date?: string;
  roomId?: string;
  status?: BookingStatus;
  customerId?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/** Dịch ngày lùi 1 ngày (YYYY-MM-DD) để catch overnight bookings */
function previousDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const prev = new Date(y, m - 1, d);
  prev.setDate(prev.getDate() - 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
}

function toTimestamp(date: string, time: string): number {
  const [y, M, d] = date.split('-').map(Number);
  const [h, m] = time.split(':').map(Number);
  return new Date(y, M - 1, d, h, m, 0, 0).getTime();
}

function getBookingRange(booking: Booking): { start: number; end: number } {
  const start = toTimestamp(booking.date, booking.startTime);
  let end = toTimestamp(booking.date, booking.endTime);
  if (end <= start) end += 24 * 60 * 60 * 1000;
  return { start, end };
}

/**
 * Lấy toàn bộ danh sách booking — auto-paginate đến khi hết trang.
 * Dùng cho các view cần full dataset (ví dụ customer detail lọc theo SĐT)
 */
export async function getAll(params: ListBookingsParams = {}): Promise<Booking[]> {
  const limit = params.limit ?? 100;
  let page = params.page ?? 1;
  const all: Booking[] = [];
  while (true) {
    const res = await apiFetch<PaginatedBookings>(`/bookings${buildQuery({ ...params, page, limit })}`);
    all.push(...res.data);
    if (page >= res.totalPages || res.data.length === 0) break;
    page += 1;
  }
  return all;
}

/**
 * Lấy danh sách booking trong một ngày — bao gồm cả booking qua đêm từ ngày hôm trước.
 * Query 2 ngày (hôm trước + hôm nay) rồi lọc theo overlap thời gian
 */
export async function getByDate(dateStr: string): Promise<Booking[]> {
  const prev = previousDate(dateStr);
  const [today, yesterday] = await Promise.all([
    getAll({ date: dateStr }),
    getAll({ date: prev }),
  ]);

  const dayStart = toTimestamp(dateStr, '00:00');
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  const merged = [...today, ...yesterday];
  return merged.filter((b) => {
    const { start, end } = getBookingRange(b);
    return start < dayEnd && end > dayStart;
  });
}

/** Lấy danh sách booking theo phòng và ngày */
export async function getByRoom(roomId: string, dateStr: string): Promise<Booking[]> {
  const all = await getByDate(dateStr);
  return all.filter((b) => b.roomId === roomId);
}

/** Lấy một booking theo ID */
export async function getById(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`);
}

/**
 * Tạo booking mới. Server tự tính totalPrice, validate overlap (409), áp voucher và tăng usedCount atomic.
 */
export async function create(booking: CreateBookingPayload): Promise<Booking> {
  return apiFetch<Booking>('/bookings', {
    method: 'POST',
    body: booking,
  });
}

/** Cập nhật thông tin booking (admin only) */
export async function update(id: string, data: Partial<CreateBookingPayload>): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Chuyển trạng thái booking — backend validate transition matrix.
 * Khi chuyển sang 'cancelled', backend tự refund voucher usedCount.
 */
export async function updateStatus(id: string, status: BookingStatus): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}/status`, {
    method: 'POST',
    body: { status },
  });
}

/** Xoá booking — backend soft delete (chuyển status về cancelled). Admin only */
export async function remove(id: string): Promise<void> {
  await apiFetch<Booking>(`/bookings/${id}`, { method: 'DELETE' });
}

/**
 * Kiểm tra xung đột thời gian đặt phòng qua endpoint /check-overlap.
 * Lưu ý: POST /bookings cũng tự validate, dùng hàm này chỉ để UX preview.
 */
export async function hasConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  const res = await apiFetch<{ hasConflict: boolean }>(
    `/bookings/check-overlap${buildQuery({ roomId, date, startTime, endTime, excludeId })}`,
  );
  return res.hasConflict;
}
