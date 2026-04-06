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

/**
 * Khởi tạo dữ liệu khuyến mãi mẫu nếu localStorage chưa có
 */
export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    save(demoPromos);
  }
}

/**
 * Lấy toàn bộ danh sách mã khuyến mãi
 * @returns Mảng tất cả mã khuyến mãi
 */
export function getAll(): PromoCode[] {
  return load();
}

/**
 * Tìm mã khuyến mãi theo ID
 * @param id - Mã định danh khuyến mãi
 * @returns Mã khuyến mãi tìm thấy hoặc undefined
 */
export function getById(id: string): PromoCode | undefined {
  return load().find((p) => p.id === id);
}

/**
 * Tìm mã khuyến mãi theo mã code (không phân biệt hoa thường)
 * @param code - Mã khuyến mãi dạng chuỗi
 * @returns Mã khuyến mãi tìm thấy hoặc undefined
 */
export function getByCode(code: string): PromoCode | undefined {
  return load().find((p) => p.code.toUpperCase() === code.toUpperCase());
}

/**
 * Tạo mã khuyến mãi mới với ID tự động tăng
 * @param promo - Dữ liệu khuyến mãi (không bao gồm id, usedCount, createdAt)
 * @returns Mã khuyến mãi đã tạo
 */
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

/**
 * Cập nhật thông tin mã khuyến mãi theo ID
 * @param id - Mã định danh khuyến mãi cần cập nhật
 * @param data - Các trường cần thay đổi
 * @returns Mã khuyến mãi sau khi cập nhật
 */
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

/**
 * Xoá mã khuyến mãi theo ID
 * @param id - Mã định danh khuyến mãi cần xoá
 */
export function remove(id: string): void {
  const promos = load().filter((p) => p.id !== id);
  save(promos);
}

/**
 * Kiểm tra tính hợp lệ của mã khuyến mãi cho loại phòng cụ thể
 * @param code - Mã khuyến mãi cần kiểm tra
 * @param roomType - Loại phòng áp dụng
 * @returns Kết quả xác thực gồm valid, error (nếu có) và promo (nếu hợp lệ)
 */
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

/**
 * Áp dụng giảm giá và tăng số lần sử dụng của mã khuyến mãi
 * @param promoId - Mã định danh khuyến mãi
 * @param originalPrice - Giá gốc trước khi giảm
 * @returns Giá sau khi giảm (tối thiểu 0)
 */
export function applyDiscount(promoId: string, originalPrice: number): number {
  const promo = getById(promoId);
  if (!promo) return originalPrice;

  let discounted: number;
  if (promo.discountType === 'percent') {
    discounted = originalPrice * (1 - promo.discountValue / 100);
  } else {
    discounted = originalPrice - promo.discountValue;
  }

  update(promoId, { usedCount: promo.usedCount + 1 });

  return Math.max(0, Math.round(discounted));
}

/**
 * Cập nhật trạng thái tất cả mã khuyến mãi dựa trên ngày hiện tại và số lần sử dụng
 */
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
