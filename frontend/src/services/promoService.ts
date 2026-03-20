import type { PromoCode } from '@/types/promo';
import type { RoomType } from '@/types/schedule';
import { demoPromos } from '@/data/demo-promos';

const STORAGE_KEY = 'nhacam_promos';

function save(promos: PromoCode[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(promos));
}

function load(): PromoCode[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    save(demoPromos);
  }
}

export function getAll(): PromoCode[] {
  return load();
}

export function getById(id: string): PromoCode | undefined {
  return load().find((p) => p.id === id);
}

export function getByCode(code: string): PromoCode | undefined {
  return load().find((p) => p.code.toUpperCase() === code.toUpperCase());
}

export function create(
  promo: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>,
): PromoCode {
  const promos = load();
  const maxId = promos.reduce((max, p) => {
    const num = parseInt(p.id.replace('pr', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);

  const newPromo: PromoCode = {
    ...promo,
    id: `pr${maxId + 1}`,
    usedCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };

  promos.push(newPromo);
  save(promos);
  return newPromo;
}

export function update(id: string, data: Partial<PromoCode>): PromoCode {
  const promos = load();
  const index = promos.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Promo ${id} not found`);
  }
  promos[index] = { ...promos[index], ...data };
  save(promos);
  return promos[index];
}

export function remove(id: string): void {
  const promos = load().filter((p) => p.id !== id);
  save(promos);
}

export function validate(
  code: string,
  roomType: RoomType,
): { valid: boolean; error?: string; promo?: PromoCode } {
  const promo = getByCode(code);
  if (!promo) {
    return { valid: false, error: 'Mã khuyến mãi không tồn tại' };
  }
  if (promo.status !== 'active') {
    return { valid: false, error: 'Mã khuyến mãi đã hết hạn hoặc bị vô hiệu' };
  }
  if (promo.usedCount >= promo.maxUses) {
    return { valid: false, error: 'Mã khuyến mãi đã hết lượt sử dụng' };
  }
  const today = new Date().toISOString().split('T')[0];
  if (today < promo.startDate || today > promo.endDate) {
    return { valid: false, error: 'Mã khuyến mãi ngoài thời gian hiệu lực' };
  }
  if (
    promo.applicableRoomTypes.length > 0 &&
    !promo.applicableRoomTypes.includes(roomType)
  ) {
    return { valid: false, error: 'Mã khuyến mãi không áp dụng cho loại phòng này' };
  }
  return { valid: true, promo };
}

export function applyDiscount(promoId: string, originalPrice: number): number {
  const promo = getById(promoId);
  if (!promo) return originalPrice;

  let discounted: number;
  if (promo.discountType === 'percent') {
    discounted = originalPrice * (1 - promo.discountValue / 100);
  } else {
    discounted = originalPrice - promo.discountValue;
  }

  // Increment usedCount
  update(promoId, { usedCount: promo.usedCount + 1 });

  return Math.max(0, Math.round(discounted));
}

export function refreshStatuses(): void {
  const promos = load();
  const today = new Date().toISOString().split('T')[0];
  let changed = false;

  for (const promo of promos) {
    if (promo.status === 'disabled') continue;

    const shouldExpire =
      today > promo.endDate || promo.usedCount >= promo.maxUses;

    if (shouldExpire && promo.status !== 'expired') {
      promo.status = 'expired';
      changed = true;
    } else if (
      !shouldExpire &&
      promo.status === 'expired' &&
      today >= promo.startDate &&
      today <= promo.endDate &&
      promo.usedCount < promo.maxUses
    ) {
      promo.status = 'active';
      changed = true;
    }
  }

  if (changed) {
    save(promos);
  }
}
