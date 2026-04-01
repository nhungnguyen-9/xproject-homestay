import { timeToMinutes } from './time.js';

/** Cấu hình bảng giá phòng */
interface PriceConfig {
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
}

/** Snapshot món ăn/thức uống kèm theo booking */
interface FoodItemSnapshot {
  price: number;
  qty?: number;
}

/**
 * Tính giá booking phía server.
 * Hỗ trợ 3 chế độ: theo giờ (hourly), theo ngày (daily), qua đêm (overnight).
 * Bao gồm cộng tiền đồ ăn và trừ khuyến mãi.
 * @param mode - Chế độ tính giá
 * @param startTime - Giờ nhận phòng "HH:mm"
 * @param endTime - Giờ trả phòng "HH:mm"
 * @param priceConfig - Bảng giá phòng
 * @param foodItems - Danh sách đồ ăn kèm theo
 * @param discountAmount - Số tiền giảm giá
 */
export function calculatePrice(
  mode: string,
  startTime: string,
  endTime: string,
  priceConfig: PriceConfig,
  foodItems: FoodItemSnapshot[] = [],
  discountAmount: number = 0,
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
