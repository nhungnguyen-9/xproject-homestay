import type { RoomType } from './schedule';

/** Mã khuyến mãi cho đặt phòng */
export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  applicableRoomTypes: RoomType[];
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
}
