import type { Customer, CustomerWithStats } from '@/types/customer';
import type { Booking } from '@/types/schedule';
import { demoCustomers } from '@/data/demo-customers';

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

export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    save(demoCustomers);
  }
}

export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  return normalized;
}

export function getAll(): Customer[] {
  return load();
}

export function getById(id: string): Customer | undefined {
  return load().find((c) => c.id === id);
}

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

export function getAllWithStats(): CustomerWithStats[] {
  return load().map((c) => getWithStats(c));
}

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
