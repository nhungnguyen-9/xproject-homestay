import type { PromoCode } from '@/types/promo';
import type { RoomType } from '@/types/schedule';
import { apiFetch } from './apiClient';

/** Payload tạo mã khuyến mãi — khớp createPromoSchema backend */
export type CreatePromoPayload = Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>;

/** Kết quả kiểm tra mã khuyến mãi */
export interface ValidateResult {
  valid: boolean;
  error?: string;
  promo?: PromoCode;
}

/** Kết quả áp dụng mã khuyến mãi — backend tự tăng usedCount */
export interface ApplyResult {
  discountAmount: number;
  finalTotal: number;
}

/** Lấy toàn bộ danh sách mã khuyến mãi (có thể lọc theo status) */
export async function getAll(status?: PromoCode['status']): Promise<PromoCode[]> {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<PromoCode[]>(`/promos${qs}`);
}

/** Tìm mã khuyến mãi theo ID */
export async function getById(id: string): Promise<PromoCode> {
  return apiFetch<PromoCode>(`/promos/${id}`);
}

/** Tìm mã khuyến mãi theo code — duyệt danh sách (backend không có endpoint riêng) */
export async function getByCode(code: string): Promise<PromoCode | undefined> {
  const all = await getAll();
  const upper = code.toUpperCase();
  return all.find((p) => p.code.toUpperCase() === upper);
}

/** Tạo mã khuyến mãi mới (admin only) */
export async function create(data: CreatePromoPayload): Promise<PromoCode> {
  return apiFetch<PromoCode>('/promos', {
    method: 'POST',
    body: { ...data, code: data.code.toUpperCase() },
  });
}

/** Cập nhật mã khuyến mãi (admin only) */
export async function update(id: string, data: Partial<CreatePromoPayload>): Promise<PromoCode> {
  const body: Partial<CreatePromoPayload> = { ...data };
  if (body.code) body.code = body.code.toUpperCase();
  return apiFetch<PromoCode>(`/promos/${id}`, {
    method: 'PUT',
    body,
  });
}

/** Xoá mã khuyến mãi (admin only) */
export async function remove(id: string): Promise<void> {
  await apiFetch<{ message: string }>(`/promos/${id}`, { method: 'DELETE' });
}

/**
 * Kiểm tra tính hợp lệ của mã khuyến mãi cho loại phòng cụ thể
 * Không tăng usedCount — chỉ kiểm tra
 */
export async function validate(code: string, roomType: RoomType): Promise<ValidateResult> {
  return apiFetch<ValidateResult>('/promos/validate', {
    method: 'POST',
    body: { code: code.toUpperCase(), roomType },
  });
}

/**
 * Áp dụng mã khuyến mãi — tăng usedCount atomically ở backend
 * Throws nếu code không hợp lệ (400)
 */
export async function apply(
  code: string,
  roomType: RoomType,
  originalPrice: number,
): Promise<ApplyResult> {
  return apiFetch<ApplyResult>('/promos/apply', {
    method: 'POST',
    body: { code: code.toUpperCase(), roomType, originalPrice },
  });
}
