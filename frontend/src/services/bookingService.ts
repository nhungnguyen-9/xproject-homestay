import type { Booking } from '@/types/schedule';
import { demoBookings } from '@/data/demo-schedule';

const STORAGE_KEY = 'nhacam_bookings';

function save(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function load(): Booking[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

/**
 * Khởi tạo dữ liệu đặt phòng mẫu nếu localStorage chưa có
 */
export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    save(demoBookings);
  }
}

/**
 * Lấy toàn bộ danh sách đặt phòng
 * @returns Mảng tất cả booking
 */
export function getAll(): Booking[] {
  return load();
}

/**
 * Lấy danh sách đặt phòng theo ngày
 * @param date - Ngày cần lọc (định dạng YYYY-MM-DD)
 * @returns Mảng booking trong ngày đó
 */
export function getByDate(date: string): Booking[] {
  return load().filter((b) => b.date === date);
}

/**
 * Lấy danh sách đặt phòng theo phòng và ngày
 * @param roomId - Mã phòng
 * @param date - Ngày cần lọc (định dạng YYYY-MM-DD)
 * @returns Mảng booking khớp phòng và ngày
 */
export function getByRoom(roomId: string, date: string): Booking[] {
  return load().filter((b) => b.roomId === roomId && b.date === date);
}

/**
 * Tìm một booking theo ID
 * @param id - Mã booking
 * @returns Booking tìm thấy hoặc undefined
 */
export function getById(id: string): Booking | undefined {
  return load().find((b) => b.id === id);
}

/**
 * Tạo booking mới với ID tự động tăng
 * @param booking - Dữ liệu booking (không bao gồm id)
 * @returns Booking đã tạo kèm ID
 */
export function create(booking: Omit<Booking, 'id'>): Booking {
  const bookings = load();
  const maxId = bookings.reduce((max, b) => {
    const num = parseInt(b.id, 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const newBooking: Booking = {
    ...booking,
    id: String(maxId + 1),
  };
  bookings.push(newBooking);
  save(bookings);
  return newBooking;
}

/**
 * Cập nhật thông tin booking theo ID
 * @param id - Mã booking cần cập nhật
 * @param data - Các trường cần thay đổi
 * @returns Booking sau khi cập nhật
 */
export function update(id: string, data: Partial<Booking>): Booking {
  const bookings = load();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error(`Booking ${id} not found`);
  }
  bookings[index] = { ...bookings[index], ...data };
  save(bookings);
  return bookings[index];
}

/**
 * Xoá booking theo ID
 * @param id - Mã booking cần xoá
 */
export function remove(id: string): void {
  const bookings = load().filter((b) => b.id !== id);
  save(bookings);
}

/**
 * Kiểm tra xung đột thời gian đặt phòng
 * @param roomId - Mã phòng
 * @param date - Ngày đặt (định dạng YYYY-MM-DD)
 * @param startTime - Giờ bắt đầu (HH:mm)
 * @param endTime - Giờ kết thúc (HH:mm)
 * @param excludeId - ID booking cần loại trừ (dùng khi chỉnh sửa)
 * @returns true nếu có xung đột thời gian
 */
export function hasConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): boolean {
  const bookings = getByRoom(roomId, date).filter(
    (b) => b.id !== excludeId && b.status !== 'cancelled',
  );

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  return bookings.some((b) => {
    const bStart = toMinutes(b.startTime);
    const bEnd = toMinutes(b.endTime);
    // Hai khoảng thời gian trùng nhau khi một cái bắt đầu trước khi cái kia kết thúc
    return newStart < bEnd && newEnd > bStart;
  });
}
