import { describe, it, expect } from 'vitest'
import { getBookingPosition } from './room-schedule'

const HOUR_WIDTH = 80
const D = '2026-04-20'
const D_NEXT = '2026-04-21'

const mk = (date: string, startTime: string, endTime: string) => ({ date, startTime, endTime })

describe('getBookingPosition — same-day render', () => {
  it('calculates standard same-day booking (10:00 → 12:00, startHour=0)', () => {
    const { left, width } = getBookingPosition(mk(D, '10:00', '12:00'), D, 0)
    expect(left).toBe(10 * HOUR_WIDTH)
    expect(width).toBe(2 * HOUR_WIDTH)
  })

  it('calculates booking with non-zero startHour offset', () => {
    const { left, width } = getBookingPosition(mk(D, '10:00', '12:00'), D, 8)
    expect(left).toBe(2 * HOUR_WIDTH)
    expect(width).toBe(2 * HOUR_WIDTH)
  })

  it('handles overnight booking on its own date (22:00 → 06:00, 8h width, may overflow right)', () => {
    const { left, width } = getBookingPosition(mk(D, '22:00', '06:00'), D, 0)
    expect(left).toBe(22 * HOUR_WIDTH)
    expect(width).toBe(8 * HOUR_WIDTH)
  })

  it('handles overnight booking on its own date (23:30 → 05:30, 6h width)', () => {
    const { width } = getBookingPosition(mk(D, '23:30', '05:30'), D, 0)
    expect(width).toBe(6 * HOUR_WIDTH)
  })

  it('treats end === start as overnight 24h (edge case)', () => {
    const { width } = getBookingPosition(mk(D, '10:00', '10:00'), D, 0)
    expect(width).toBe(24 * HOUR_WIDTH)
  })

  it('never returns negative width for overnight same-day', () => {
    const cases: [string, string][] = [
      ['22:00', '06:00'],
      ['18:00', '02:00'],
      ['23:45', '00:15'],
    ]
    for (const [s, e] of cases) {
      const { width } = getBookingPosition(mk(D, s, e), D, 0)
      expect(width).toBeGreaterThan(0)
    }
  })
})

describe('getBookingPosition — cross-day wrap-in (previous-day overnight on next-day timeline)', () => {
  it('renders slice [00:00, 06:00) when viewing next day (8h total overnight, 6h wraps in)', () => {
    const { left, width } = getBookingPosition(mk(D, '22:00', '06:00'), D_NEXT, 0)
    expect(left).toBe(0)
    expect(width).toBe(6 * HOUR_WIDTH)
  })

  it('respects startHour offset on cross-day slice', () => {
    const { left, width } = getBookingPosition(mk(D, '22:00', '06:00'), D_NEXT, 2)
    expect(left).toBe(-2 * HOUR_WIDTH)
    expect(width).toBe(6 * HOUR_WIDTH)
  })

  it('renders narrow overnight slice (23:45 → 00:15 = 15min wrap-in)', () => {
    const { width } = getBookingPosition(mk(D, '23:45', '00:15'), D_NEXT, 0)
    expect(width).toBe((15 / 60) * HOUR_WIDTH)
  })
})

describe('getBookingPosition — unrelated dates', () => {
  it('returns zero width when booking is same-day but viewingDate is unrelated', () => {
    const { width } = getBookingPosition(mk(D, '14:00', '16:00'), D_NEXT, 0)
    expect(width).toBe(0)
  })

  it('returns zero width when booking is from a totally unrelated past day', () => {
    const { width } = getBookingPosition(mk('2026-04-18', '14:00', '16:00'), D_NEXT, 0)
    expect(width).toBe(0)
  })
})
