import type { Booking } from '@/types/schedule';
import { demoBookings } from '@/data/demo-schedule';

const STORAGE_KEY = 'nhacam_bookings';

function save(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function load(): Booking[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    save(demoBookings);
  }
}

export function getAll(): Booking[] {
  return load();
}

export function getByDate(date: string): Booking[] {
  return load().filter((b) => b.date === date);
}

export function getByRoom(roomId: string, date: string): Booking[] {
  return load().filter((b) => b.roomId === roomId && b.date === date);
}

export function getById(id: string): Booking | undefined {
  return load().find((b) => b.id === id);
}

export function create(booking: Omit<Booking, 'id'>): Booking {
  const bookings = load();
  const maxId = bookings.reduce((max, b) => {
    const num = parseInt(b.id, 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const newBooking: Booking = {
    ...booking,
    id: String(maxId + 1),
  };
  bookings.push(newBooking);
  save(bookings);
  return newBooking;
}

export function update(id: string, data: Partial<Booking>): Booking {
  const bookings = load();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error(`Booking ${id} not found`);
  }
  bookings[index] = { ...bookings[index], ...data };
  save(bookings);
  return bookings[index];
}

export function remove(id: string): void {
  const bookings = load().filter((b) => b.id !== id);
  save(bookings);
}

export function hasConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): boolean {
  const bookings = getByRoom(roomId, date).filter(
    (b) => b.id !== excludeId && b.status !== 'cancelled',
  );

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  return bookings.some((b) => {
    const bStart = toMinutes(b.startTime);
    const bEnd = toMinutes(b.endTime);
    // Two ranges overlap if one starts before the other ends
    return newStart < bEnd && newEnd > bStart;
  });
}
