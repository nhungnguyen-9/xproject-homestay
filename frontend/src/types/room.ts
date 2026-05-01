import type { RoomType } from './schedule';

/** Khung giờ giảm giá theo giờ — mirror backend DiscountSlot shape */
export interface DiscountSlot {
  /** HH:mm, 00:00–23:59 */
  startTime: string;
  /** HH:mm, strictly > startTime */
  endTime: string;
  /** integer 1..100 */
  discountPercent: number;
}

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
  discountSlots: DiscountSlot[];
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
  discountSlots: DiscountSlot[];
}
