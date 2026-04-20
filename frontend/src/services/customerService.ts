import type { Customer, CustomerWithStats, CustomerLookup } from '@/types/customer';
import { apiFetch } from './apiClient';

/**
 * Chuẩn hoá số điện thoại: bỏ khoảng trắng, dấu gạch ngang và chuyển +84 thành 0
 */
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  return normalized;
}

/** Dữ liệu tạo khách hàng — khớp với createCustomerSchema backend */
export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  note?: string;
}

/**
 * Lấy danh sách khách hàng (có search + paginate)
 * Mặc định limit=100 (tối đa backend cho phép mỗi trang) để các trang admin nhỏ dùng được
 */
export async function getAll(search?: string, page = 1, limit = 100): Promise<Customer[]> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  return apiFetch<Customer[]>(`/customers?${params.toString()}`);
}

/** Lấy chi tiết một khách hàng theo ID */
export async function getById(id: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`);
}

/** Lấy danh sách khách hàng kèm thống kê (totalSpent, visitCount, lastVisit) */
export async function getAllWithStats(page = 1, limit = 100): Promise<CustomerWithStats[]> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), stats: 'true' });
  return apiFetch<CustomerWithStats[]>(`/customers?${params.toString()}`);
}

/** Lấy khách hàng kèm thống kê theo ID */
export async function getStats(id: string): Promise<CustomerWithStats> {
  return apiFetch<CustomerWithStats>(`/customers/${id}/stats`);
}

/** Tạo khách hàng mới */
export async function create(data: CreateCustomerPayload): Promise<Customer> {
  return apiFetch<Customer>('/customers', {
    method: 'POST',
    body: { ...data, phone: normalizePhone(data.phone) },
  });
}

/** Cập nhật thông tin khách hàng (admin only) */
export async function update(id: string, data: Partial<CreateCustomerPayload>): Promise<Customer> {
  const payload: Partial<CreateCustomerPayload> = { ...data };
  if (payload.phone) payload.phone = normalizePhone(payload.phone);
  return apiFetch<Customer>(`/customers/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Đảm bảo khách hàng tồn tại: tìm theo SĐT, tạo mới nếu chưa có
 * Dùng khi tạo booking guest — fire-and-forget an toàn
 */
export async function ensureCustomerExists(name: string, phone: string): Promise<Customer> {
  const lookup = await getByPhone(phone);
  if (lookup) return await getById(lookup.id);
  return await create({ name, phone });
}

/**
 * Tra cứu khách hàng theo số điện thoại (public — không cần auth)
 * Dùng cho booking form auto-fill
 */
export async function getByPhone(phone: string): Promise<CustomerLookup | null> {
  try {
    const normalized = normalizePhone(phone);
    return await apiFetch<CustomerLookup | null>(`/customers/by-phone/${normalized}`, { skipAuth: true });
  } catch {
    return null;
  }
}

/** Upload ảnh CCCD cho khách hàng */
export async function uploadIdImages(customerId: string, files: File[]): Promise<Customer> {
  const form = new FormData();
  files.forEach(f => form.append('images', f));
  return apiFetch<Customer>(`/customers/${customerId}/id-images`, {
    method: 'POST',
    body: form,
  });
}

/** Xóa ảnh CCCD (admin only) */
export async function deleteIdImage(customerId: string, filename: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${customerId}/id-images/${filename}`, {
    method: 'DELETE',
  });
}
