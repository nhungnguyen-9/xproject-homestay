/** Loại phòng */
export type RoomType = 'standard' | 'vip' | 'supervip';
/** Trạng thái booking */
export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
/** Phân loại booking: khách hàng hoặc nội bộ */
export type BookingCategory = 'guest' | 'internal';
/** Nhãn booking nội bộ */
export type InternalTag = 'cleaning' | 'maintenance' | 'locked' | 'custom';
/** Chế độ tính giá booking */
export type BookingMode = 'hourly' | 'daily' | 'overnight' | 'combo3h' | 'combo6h1h';
/** Lựa chọn cho combo 6H+1H: 'bonus_hour' (mặc định, khách lấy 1 giờ tặng) | 'discount' (khách nhận tiền giảm thay thế) */
export type Combo6h1hOption = 'bonus_hour' | 'discount';
/** Vai trò người dùng hệ thống */
export type UserRole = 'admin' | 'staff';

/**
 * Ma trận chuyển trạng thái hợp lệ của booking.
 * Ví dụ: pending → confirmed hoặc cancelled.
 */
export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['checked-in', 'cancelled'],
  'checked-in': ['checked-out'],
  'checked-out': [],
  'cancelled': [],
};

/** Response phân trang chuẩn cho API */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
