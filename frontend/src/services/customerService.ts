import type { Customer, CustomerWithStats, CustomerLookup } from '@/types/customer';
import type { Booking } from '@/types/schedule';
import { demoCustomers } from '@/data/demo-customers';
import { apiFetch } from './apiClient';

const STORAGE_KEY = 'nhacam_customers';
const BOOKINGS_KEY = 'nhacam_bookings';

function save(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function load(): Customer[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

function loadBookings(): Booking[] {
  const stored = localStorage.getItem(BOOKINGS_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

/**
 * Khởi tạo dữ liệu khách hàng mẫu nếu localStorage chưa có
 */
export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    save(demoCustomers);
  }
}

/**
 * Chuẩn hoá số điện thoại: bỏ khoảng trắng, dấu gạch ngang và chuyển +84 thành 0
 * @param phone - Số điện thoại gốc
 * @returns Số điện thoại đã chuẩn hoá
 */
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  return normalized;
}

/**
 * Lấy toàn bộ danh sách khách hàng
 * @returns Mảng tất cả khách hàng
 */
export function getAll(): Customer[] {
  return load();
}

/**
 * Tìm khách hàng theo ID
 * @param id - Mã khách hàng
 * @returns Khách hàng tìm thấy hoặc undefined
 */
export function getById(id: string): Customer | undefined {
  return load().find((c) => c.id === id);
}

/**
 * Tìm kiếm khách hàng theo tên, số điện thoại hoặc email
 * @param query - Từ khoá tìm kiếm
 * @returns Mảng khách hàng khớp điều kiện
 */
export function search(query: string): Customer[] {
  const q = query.toLowerCase().trim();
  if (!q) return load();
  return load().filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)),
  );
}

/**
 * Tính thống kê cho một khách hàng dựa trên lịch sử đặt phòng
 * @param customer - Đối tượng khách hàng
 * @returns Khách hàng kèm thống kê (tổng chi tiêu, số lần ghé, lần ghé cuối)
 */
export function getWithStats(customer: Customer): CustomerWithStats {
  const bookings = loadBookings();
  const normalizedPhone = normalizePhone(customer.phone);

  const matched = bookings.filter(
    (b) =>
      b.category === 'guest' &&
      b.guestPhone &&
      normalizePhone(b.guestPhone) === normalizedPhone,
  );

  const totalSpent = matched.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const checkedOut = matched.filter((b) => b.status === 'checked-out');
  const visitCount = checkedOut.length;

  const dates = matched
    .map((b) => b.date)
    .filter(Boolean)
    .sort();
  const lastVisit = dates.length > 0 ? dates[dates.length - 1] : '';

  return {
    ...customer,
    totalSpent,
    visitCount,
    lastVisit,
  };
}

/**
 * Lấy toàn bộ khách hàng kèm thống kê
 * @returns Mảng khách hàng có thêm dữ liệu thống kê
 */
export function getAllWithStats(): CustomerWithStats[] {
  return load().map((c) => getWithStats(c));
}

/**
 * Đảm bảo khách hàng tồn tại: tìm theo SĐT hoặc tạo mới nếu chưa có
 * @param name - Tên khách hàng
 * @param phone - Số điện thoại
 * @returns Khách hàng đã tồn tại hoặc mới tạo
 */
export function ensureCustomerExists(name: string, phone: string): Customer {
  const normalizedPhone = normalizePhone(phone);
  const customers = load();
  const existing = customers.find(
    (c) => normalizePhone(c.phone) === normalizedPhone,
  );
  if (existing) return existing;

  const maxId = customers.reduce((max, c) => {
    const num = parseInt(c.id.replace('c', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);

  const newCustomer: Customer = {
    id: `c${maxId + 1}`,
    name,
    phone: normalizedPhone,
    createdAt: new Date().toISOString().split('T')[0],
  };

  customers.push(newCustomer);
  save(customers);
  return newCustomer;
}

/**
 * Cập nhật thông tin khách hàng theo ID
 * @param id - Mã khách hàng cần cập nhật
 * @param data - Các trường cần thay đổi
 * @returns Khách hàng sau khi cập nhật
 */
export function update(id: string, data: Partial<Customer>): Customer {
  const customers = load();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error(`Customer ${id} not found`);
  }
  customers[index] = { ...customers[index], ...data };
  save(customers);
  return customers[index];
}

/**
 * Tra cứu khách hàng theo số điện thoại qua API (dùng cho booking form auto-fill)
 * Endpoint này là public — không cần auth
 */
export async function getByPhone(phone: string): Promise<CustomerLookup | null> {
  try {
    const normalized = normalizePhone(phone);
    return await apiFetch<CustomerLookup | null>(`/customers/by-phone/${normalized}`, { skipAuth: true });
  } catch {
    return null;
  }
}

/**
 * Upload ảnh CCCD cho khách hàng (dùng sau khi tạo booking)
 */
export async function uploadIdImages(customerId: string, files: File[]): Promise<void> {
  const form = new FormData();
  files.forEach(f => form.append('images', f));
  await apiFetch(`/customers/${customerId}/id-images`, {
    method: 'POST',
    body: form,
  });
}

/**
 * Xóa ảnh CCCD của khách hàng (admin)
 */
export async function deleteIdImage(customerId: string, filename: string): Promise<CustomerLookup> {
  return apiFetch<CustomerLookup>(`/customers/${customerId}/id-images/${filename}`, {
    method: 'DELETE',
  });
}
