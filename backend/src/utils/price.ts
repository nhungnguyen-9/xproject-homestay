import { timeToMinutes } from './time.js';
import type { DiscountSlot } from '../db/schema/rooms.js';

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
  /** Khung giờ giảm giá áp dụng cho mode hourly và extraHourRate overage trong combo. */
  discountSlots?: DiscountSlot[];
}

/**
 * Tính chi phí cho khoảng [startMin, endMin) ở mức hourlyRate, áp dụng discount slots.
 * Quy tắc khi slots chồng lên nhau: slot có discountPercent cao nhất thắng (max-wins).
 * O(duration_minutes × slots) — ổn với <10 slot và booking <24h; nếu profiling cần, đổi sang sweep-line.
 */
function computeHourlyCost(
  startMin: number,
  endMin: number,
  hourlyRate: number,
  slots: DiscountSlot[] | undefined,
): number {
  if (endMin <= startMin) return 0;
  const perMinute = hourlyRate / 60;
  const totalMinutes = endMin - startMin;

  if (!slots || slots.length === 0) {
    return Math.round(perMinute * totalMinutes);
  }

  let sum = 0;
  for (let m = startMin; m < endMin; m++) {
    let maxPct = 0;
    for (const s of slots) {
      const sStart = timeToMinutes(s.startTime);
      const sEnd = timeToMinutes(s.endTime);
      if (m >= sStart && m < sEnd && s.discountPercent > maxPct) {
        maxPct = s.discountPercent;
      }
    }
    sum += perMinute * (1 - maxPct / 100);
  }
  return Math.round(sum);
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
    case 'daily': {
      const fullDays = Math.max(1, Math.floor(durationHrs / 24) || 1);
      const remainingHours = durationHrs - fullDays * 24;
      const extraHours = Math.max(0, Math.ceil(remainingHours));
      const basePrice = fullDays * priceConfig.dailyRate;
      const overageStart = startMin + fullDays * 24 * 60;
      const overageEnd = overageStart + extraHours * 60;
      const overageCost = computeHourlyCost(
        overageStart,
        overageEnd,
        priceConfig.extraHourRate,
        priceConfig.discountSlots,
      );
      roomPrice = Math.min(basePrice + overageCost, (fullDays + 1) * priceConfig.dailyRate);
      break;
    }
    case 'overnight': {
      const OVERNIGHT_BASE_HOURS = 11;
      const base = priceConfig.overnightRate;
      const overage = Math.max(0, Math.ceil(durationHrs) - OVERNIGHT_BASE_HOURS);
      const overageStart = startMin + OVERNIGHT_BASE_HOURS * 60;
      const overageEnd = overageStart + overage * 60;
      const overageCost = computeHourlyCost(
        overageStart,
        overageEnd,
        priceConfig.extraHourRate,
        priceConfig.discountSlots,
      );
      roomPrice = Math.min(base + overageCost, priceConfig.dailyRate);
      break;
    }
    case 'combo3h': {
      const base = priceConfig.combo3hRate ?? 0;
      const overage = Math.max(0, Math.ceil(durationHrs) - 3);
      const overageStart = startMin + 3 * 60;
      const overageEnd = overageStart + overage * 60;
      const overageCost = computeHourlyCost(
        overageStart,
        overageEnd,
        priceConfig.extraHourRate,
        priceConfig.discountSlots,
      );
      roomPrice = base + overageCost;
      break;
    }
    case 'combo6h1h': {
      const rate = priceConfig.combo6h1hRate ?? 0;
      if (combo6h1hOption === 'discount') {
        const base = Math.max(0, rate - (priceConfig.combo6h1hDiscount ?? 0));
        const overage = Math.max(0, Math.ceil(durationHrs) - 6);
        const overageStart = startMin + 6 * 60;
        const overageEnd = overageStart + overage * 60;
        const overageCost = computeHourlyCost(
          overageStart,
          overageEnd,
          priceConfig.extraHourRate,
          priceConfig.discountSlots,
        );
        roomPrice = base + overageCost;
      } else {
        const overage = Math.max(0, Math.ceil(durationHrs) - 7);
        const overageStart = startMin + 7 * 60;
        const overageEnd = overageStart + overage * 60;
        const overageCost = computeHourlyCost(
          overageStart,
          overageEnd,
          priceConfig.extraHourRate,
          priceConfig.discountSlots,
        );
        roomPrice = rate + overageCost;
      }
      break;
    }
    default: { // hourly
      const billedMinutes = Math.ceil(durationHrs) * 60;
      roomPrice = computeHourlyCost(
        startMin,
        startMin + billedMinutes,
        priceConfig.hourlyRate,
        priceConfig.discountSlots,
      );
      break;
    }
  }

  const foodTotal = foodItems.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0,
  );

  return Math.max(0, roomPrice + foodTotal - discountAmount);
}
