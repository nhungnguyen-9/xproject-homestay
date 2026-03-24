// Re-export useful types

export type RoomType = 'standard' | 'vip' | 'supervip';
export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
export type BookingCategory = 'guest' | 'internal';
export type InternalTag = 'cleaning' | 'maintenance' | 'locked' | 'custom';
export type BookingMode = 'hourly' | 'daily' | 'overnight';
export type UserRole = 'admin' | 'staff';

// Valid status transitions
export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['checked-in', 'cancelled'],
  'checked-in': ['checked-out'],
  'checked-out': [],
  'cancelled': [],
};

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
