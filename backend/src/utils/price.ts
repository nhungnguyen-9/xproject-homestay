import { timeToMinutes } from './time.js';

interface PriceConfig {
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
}

interface FoodItemSnapshot {
  price: number;
  qty?: number;
}

/**
 * Calculate booking price server-side.
 * mode: 'hourly' | 'daily' | 'overnight'
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
