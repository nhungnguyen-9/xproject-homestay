import type { RoomType } from './schedule';

/** Thông tin phòng đầy đủ từ API backend */
export interface RoomDetail {
  id: string;
  name: string;
  type: RoomType;
  branchId: string | null;
  description: string | null;
  images: string[];
  maxGuests: number;
  amenities: string[];
  perMinuteRate: number;
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload cho form tạo/sửa phòng */
export interface CreateRoomPayload {
  name: string;
  type: RoomType;
  branchId: string | null;
  description: string | null;
  images: string[];
  maxGuests: number;
  amenities: string[];
  perMinuteRate: number;
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
}
