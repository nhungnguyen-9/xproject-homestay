import { describe, it, expect } from 'vitest'
import { isSlotOccupied } from './bookingOccupancy'
import type { Booking } from '@/types/schedule'

const D = '2026-04-20'
const D_NEXT = '2026-04-21'

const mk = (
    date: string,
    startTime: string,
    endTime: string,
    status: Booking['status'] = 'confirmed',
): Pick<Booking, 'date' | 'startTime' | 'endTime' | 'status'> => ({ date, startTime, endTime, status })

const slot = (hour: number, lenHours = 1): [number, number] => [hour * 60, (hour + lenHours) * 60]

describe('isSlotOccupied — same-day bookings', () => {
    it('marks slot occupied when fully inside a booking', () => {
        const bookings = [mk(D, '14:00', '16:00')]
        const [s, e] = slot(15)
        expect(isSlotOccupied(bookings, D, s, e)).toBe(true)
    })

    it('marks slot free when outside booking and outside buffer', () => {
        const bookings = [mk(D, '14:00', '16:00')]
        const [s, e] = slot(18)
        expect(isSlotOccupied(bookings, D, s, e)).toBe(false)
    })

    it('marks slot free when exactly after booking end + buffer', () => {
        const bookings = [mk(D, '14:00', '16:00')] // end 16:00 + 10 = 16:10 buffer
        const [s, e] = slot(17) // 17:00-18:00 — past buffer
        expect(isSlotOccupied(bookings, D, s, e)).toBe(false)
    })

    it('still marks occupied within the 10-minute buffer', () => {
        const bookings = [mk(D, '14:00', '16:00')]
        const [s, e] = [16 * 60, 16 * 60 + 5] // 16:00-16:05 — inside buffer
        expect(isSlotOccupied(bookings, D, s, e)).toBe(true)
    })
})

describe('isSlotOccupied — overnight bookings (same-day view)', () => {
    it('marks evening slots occupied on the booking creation date (22:00 → 06:00)', () => {
        const bookings = [mk(D, '22:00', '06:00')]
        const [s, e] = slot(22)
        expect(isSlotOccupied(bookings, D, s, e)).toBe(true)
    })

    it('marks midnight-adjacent slot occupied on creation date (23:00 → 24:00)', () => {
        const bookings = [mk(D, '22:00', '06:00')]
        const [s, e] = slot(23)
        expect(isSlotOccupied(bookings, D, s, e)).toBe(true)
    })
})

describe('isSlotOccupied — overnight wrap-in (next-day view)', () => {
    it('marks early-morning slots occupied on next day (00:00, 05:00 within 22:00→06:00)', () => {
        const bookings = [mk(D, '22:00', '06:00')]
        const [s0, e0] = slot(0)
        const [s5, e5] = slot(5)
        expect(isSlotOccupied(bookings, D_NEXT, s0, e0)).toBe(true)
        expect(isSlotOccupied(bookings, D_NEXT, s5, e5)).toBe(true)
    })

    it('marks slot after wrap-end free on next day (07:00 past 06:00 + buffer)', () => {
        const bookings = [mk(D, '22:00', '06:00')]
        const [s, e] = slot(7)
        expect(isSlotOccupied(bookings, D_NEXT, s, e)).toBe(false)
    })

    it('does not cross-day wrap for same-day booking (14:00→16:00 on D, viewing D_NEXT)', () => {
        const bookings = [mk(D, '14:00', '16:00')]
        const [s, e] = slot(15)
        expect(isSlotOccupied(bookings, D_NEXT, s, e)).toBe(false)
    })
})

describe('isSlotOccupied — status filter', () => {
    it('ignores cancelled bookings', () => {
        const bookings = [mk(D, '14:00', '16:00', 'cancelled')]
        const [s, e] = slot(15)
        expect(isSlotOccupied(bookings, D, s, e)).toBe(false)
    })

    it('counts checked-in/checked-out as occupied', () => {
        const bookingsIn = [mk(D, '14:00', '16:00', 'checked-in')]
        const bookingsOut = [mk(D, '14:00', '16:00', 'checked-out')]
        const [s, e] = slot(15)
        expect(isSlotOccupied(bookingsIn, D, s, e)).toBe(true)
        expect(isSlotOccupied(bookingsOut, D, s, e)).toBe(true)
    })
})

describe('isSlotOccupied — free between two bookings', () => {
    it('returns false for a gap slot outside both bookings + buffers', () => {
        const bookings = [mk(D, '08:00', '10:00'), mk(D, '14:00', '16:00')]
        const [s, e] = slot(12) // 12:00-13:00, well outside both
        expect(isSlotOccupied(bookings, D, s, e)).toBe(false)
    })
})
