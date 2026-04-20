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
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
  combo3hRate: number;
  combo6h1hRate: number;
  /** Số tiền giảm khi khách không lấy 1H bonus trong combo 6H+1H */
  combo6h1hDiscount: number;
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
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
  combo3hRate: number;
  combo6h1hRate: number;
  combo6h1hDiscount: number;
}
