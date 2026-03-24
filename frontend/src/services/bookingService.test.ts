import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as bookingService from './bookingService'
import type { Booking } from '@/types/schedule'

vi.mock('@/data/demo-schedule', () => ({
  demoBookings: [
    {
      id: '1',
      roomId: 'g01',
      date: '2026-03-20',
      startTime: '09:00',
      endTime: '11:00',
      status: 'confirmed',
      totalPrice: 338000,
      category: 'guest',
    },
    {
      id: '2',
      roomId: 'g01',
      date: '2026-03-20',
      startTime: '13:00',
      endTime: '15:00',
      status: 'confirmed',
      totalPrice: 338000,
      category: 'guest',
    },
    {
      id: '3',
      roomId: 'p102',
      date: '2026-03-21',
      startTime: '10:00',
      endTime: '12:00',
      status: 'confirmed',
      totalPrice: 338000,
      category: 'guest',
    },
  ] as Booking[],
  demoRooms: [],
}))

const STORAGE_KEY = 'nhacam_bookings'

beforeEach(() => {
  localStorage.clear()
})

describe('init()', () => {
  it('saves demo data when localStorage is empty', () => {
    bookingService.init()
    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(3)
  })

  it('does not overwrite existing data', () => {
    const existing: Booking[] = [
      {
        id: '99',
        roomId: 'g01',
        date: '2026-03-01',
        startTime: '10:00',
        endTime: '12:00',
        status: 'confirmed',
        totalPrice: 200000,
        category: 'guest',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    bookingService.init()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('99')
  })
})

describe('getByDate()', () => {
  beforeEach(() => {
    bookingService.init()
  })

  it('returns bookings for the correct date', () => {
    const results = bookingService.getByDate('2026-03-20')
    expect(results).toHaveLength(2)
    results.forEach((b) => expect(b.date).toBe('2026-03-20'))
  })

  it('returns bookings for a different date', () => {
    const results = bookingService.getByDate('2026-03-21')
    expect(results).toHaveLength(1)
    expect(results[0].roomId).toBe('p102')
  })

  it('returns empty array for a date with no bookings', () => {
    const results = bookingService.getByDate('2025-01-01')
    expect(results).toHaveLength(0)
  })
})

describe('create()', () => {
  beforeEach(() => {
    bookingService.init()
  })

  it('adds a new booking and assigns a numeric string id', () => {
    const newBooking: Omit<Booking, 'id'> = {
      roomId: 'g01',
      date: '2026-03-22',
      startTime: '08:00',
      endTime: '10:00',
      status: 'confirmed',
      totalPrice: 338000,
      category: 'guest',
    }
    const created = bookingService.create(newBooking)
    expect(created.id).toBeDefined()
    expect(Number(created.id)).toBeGreaterThan(0)
    const all = bookingService.getAll()
    expect(all.some((b) => b.id === created.id)).toBe(true)
  })

  it('assigns id higher than the current max', () => {
    const booking: Omit<Booking, 'id'> = {
      roomId: 'g01',
      date: '2026-03-22',
      startTime: '08:00',
      endTime: '09:00',
      status: 'confirmed',
      totalPrice: 169000,
      category: 'guest',
    }
    const created = bookingService.create(booking)
    // Demo data has ids 1, 2, 3 — new should be 4
    expect(Number(created.id)).toBe(4)
  })

  it('persists the new booking in localStorage', () => {
    const booking: Omit<Booking, 'id'> = {
      roomId: 'p102',
      date: '2026-03-25',
      startTime: '14:00',
      endTime: '16:00',
      status: 'pending',
      totalPrice: 338000,
      category: 'guest',
    }
    const created = bookingService.create(booking)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.some((b: Booking) => b.id === created.id)).toBe(true)
  })
})

describe('hasConflict()', () => {
  beforeEach(() => {
    bookingService.init()
  })

  it('returns false when no bookings exist for the room+date', () => {
    const result = bookingService.hasConflict('g01', '2099-01-01', '10:00', '12:00')
    expect(result).toBe(false)
  })

  it('returns false for non-overlapping time before existing booking', () => {
    // Existing: g01, 2026-03-20, 09:00–11:00
    const result = bookingService.hasConflict('g01', '2026-03-20', '07:00', '09:00')
    expect(result).toBe(false)
  })

  it('returns false for non-overlapping time after existing booking', () => {
    // Existing: g01, 2026-03-20, 09:00–11:00
    const result = bookingService.hasConflict('g01', '2026-03-20', '11:00', '13:00')
    expect(result).toBe(false)
  })

  it('returns true for overlapping time (new starts during existing)', () => {
    // Existing: g01, 2026-03-20, 09:00–11:00
    // New: 10:00–12:00 overlaps
    const result = bookingService.hasConflict('g01', '2026-03-20', '10:00', '12:00')
    expect(result).toBe(true)
  })

  it('returns true for overlapping time (new fully contains existing)', () => {
    // Existing: g01, 2026-03-20, 09:00–11:00
    // New: 08:00–12:00 fully contains it
    const result = bookingService.hasConflict('g01', '2026-03-20', '08:00', '12:00')
    expect(result).toBe(true)
  })

  it('returns true for overlapping time (new ends during existing)', () => {
    // Existing: g01, 2026-03-20, 09:00–11:00
    // New: 08:00–10:00 overlaps
    const result = bookingService.hasConflict('g01', '2026-03-20', '08:00', '10:00')
    expect(result).toBe(true)
  })

  it('does not count a cancelled booking as a conflict', () => {
    // Add a cancelled booking
    const cancelled: Omit<Booking, 'id'> = {
      roomId: 'g01',
      date: '2026-03-20',
      startTime: '07:00',
      endTime: '08:30',
      status: 'cancelled',
      totalPrice: 0,
      category: 'guest',
    }
    bookingService.create(cancelled)
    const result = bookingService.hasConflict('g01', '2026-03-20', '07:00', '08:30')
    expect(result).toBe(false)
  })

  it('excludes a specific booking id from conflict check', () => {
    // id '1' is g01, 09:00–11:00
    const result = bookingService.hasConflict('g01', '2026-03-20', '09:00', '11:00', '1')
    expect(result).toBe(false)
  })
})
