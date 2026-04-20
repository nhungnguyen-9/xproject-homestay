import { timeToMinutes } from './time.js';

/** Cấu hình bảng giá phòng */
interface PriceConfig {
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
  /** Giá combo 3 giờ (flat). Overage giờ > 3 tính extraHourRate. */
  combo3hRate?: number;
  /** Giá combo 6 giờ + 1 giờ bonus. Nếu option='bonus_hour' → trọn gói 7h, nếu 'discount' → 6h với giá giảm thêm combo6h1hDiscount. Overage tính extraHourRate. */
  combo6h1hRate?: number;
  /** Số tiền giảm áp dụng khi khách chọn option='discount' thay cho 1H bonus */
  combo6h1hDiscount?: number;
}

/** Snapshot món ăn/thức uống kèm theo booking */
interface FoodItemSnapshot {
  price: number;
  qty?: number;
}

/**
 * Tính giá booking phía server.
 * Hỗ trợ 5 chế độ: hourly, daily, overnight, combo3h, combo6h1h.
 * Bao gồm cộng tiền đồ ăn và trừ khuyến mãi.
 *
 * Combo semantics:
 * - combo3h: flat combo3hRate trong 3 giờ đầu, overage (giờ > 3) tính extraHourRate.
 * - combo6h1h (option='bonus_hour', default): flat combo6h1hRate cho tối đa 7 giờ, overage > 7h tính extraHourRate.
 * - combo6h1h (option='discount'): (combo6h1hRate − combo6h1hDiscount) cho tối đa 6 giờ, overage > 6h tính extraHourRate.
 *
 * @param mode - Chế độ tính giá
 * @param startTime - Giờ nhận phòng "HH:mm"
 * @param endTime - Giờ trả phòng "HH:mm"
 * @param priceConfig - Bảng giá phòng
 * @param foodItems - Danh sách đồ ăn kèm theo
 * @param discountAmount - Số tiền giảm giá
 * @param combo6h1hOption - Chỉ dùng khi mode='combo6h1h'; mặc định 'bonus_hour'
 */
export function calculatePrice(
  mode: string,
  startTime: string,
  endTime: string,
  priceConfig: PriceConfig,
  foodItems: FoodItemSnapshot[] = [],
  discountAmount: number = 0,
  combo6h1hOption: 'bonus_hour' | 'discount' = 'bonus_hour',
): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const durationMin = endMin - startMin;
  const durationHrs = durationMin / 60;

  let roomPrice: number;
  switch (mode) {
    case 'daily':
      roomPrice = Math.ceil(durationHrs / 24) * priceConfig.dailyRate;
      break;
    case 'overnight':
      roomPrice = Math.ceil(durationHrs / 24) * priceConfig.overnightRate;
      break;
    case 'combo3h': {
      const base = priceConfig.combo3hRate ?? 0;
      const overage = Math.max(0, Math.ceil(durationHrs) - 3);
      roomPrice = base + overage * priceConfig.extraHourRate;
      break;
    }
    case 'combo6h1h': {
      const rate = priceConfig.combo6h1hRate ?? 0;
      if (combo6h1hOption === 'discount') {
        const base = Math.max(0, rate - (priceConfig.combo6h1hDiscount ?? 0));
        const overage = Math.max(0, Math.ceil(durationHrs) - 6);
        roomPrice = base + overage * priceConfig.extraHourRate;
      } else {
        const overage = Math.max(0, Math.ceil(durationHrs) - 7);
        roomPrice = rate + overage * priceConfig.extraHourRate;
      }
      break;
    }
    default: // hourly
      roomPrice = Math.ceil(durationHrs) * priceConfig.hourlyRate;
      break;
  }

  const foodTotal = foodItems.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0,
  );

  return Math.max(0, roomPrice + foodTotal - discountAmount);
}
