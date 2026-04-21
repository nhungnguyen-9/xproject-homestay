import { describe, it, expect } from 'vitest'
import { getBookingPosition } from './room-schedule'

const HOUR_WIDTH = 80

describe('getBookingPosition (public schedule — overnight-aware)', () => {
  it('calculates standard same-day booking (10:00 → 12:00, startHour=0)', () => {
    const { left, width } = getBookingPosition('10:00', '12:00', 0)
    expect(left).toBe(10 * HOUR_WIDTH)
    expect(width).toBe(2 * HOUR_WIDTH)
  })

  it('calculates booking with non-zero startHour offset', () => {
    const { left, width } = getBookingPosition('10:00', '12:00', 8)
    expect(left).toBe(2 * HOUR_WIDTH)
    expect(width).toBe(2 * HOUR_WIDTH)
  })

  it('handles overnight booking (22:00 → 06:00) with 8h width (before bug fix: width was -16h)', () => {
    const { left, width } = getBookingPosition('22:00', '06:00', 0)
    expect(left).toBe(22 * HOUR_WIDTH)
    expect(width).toBe(8 * HOUR_WIDTH)
  })

  it('handles overnight booking (23:30 → 05:30) with 6h width', () => {
    const { width } = getBookingPosition('23:30', '05:30', 0)
    expect(width).toBe(6 * HOUR_WIDTH)
  })

  it('treats end === start as overnight 24h (edge case)', () => {
    const { width } = getBookingPosition('10:00', '10:00', 0)
    expect(width).toBe(24 * HOUR_WIDTH)
  })

  it('never returns negative width for overnight', () => {
    const cases: [string, string][] = [
      ['22:00', '06:00'],
      ['18:00', '02:00'],
      ['23:45', '00:15'],
    ]
    for (const [s, e] of cases) {
      const { width } = getBookingPosition(s, e, 0)
      expect(width).toBeGreaterThan(0)
    }
  })
})
