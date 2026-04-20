import { describe, it, expect } from 'vitest'
import {
  timeToMinutes,
  hasTimeOverlap,
  durationHours,
  addDaysISO,
  dateToEpochDays,
  computeAbsoluteMinutes,
} from './time.js'

describe('timeToMinutes()', () => {
  it('converts 00:00 to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0)
  })

  it('converts 01:00 to 60', () => {
    expect(timeToMinutes('01:00')).toBe(60)
  })

  it('converts 12:30 to 750', () => {
    expect(timeToMinutes('12:30')).toBe(750)
  })

  it('converts 23:59 to 1439', () => {
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('converts 08:15 to 495', () => {
    expect(timeToMinutes('08:15')).toBe(495)
  })

  it('converts 00:01 to 1', () => {
    expect(timeToMinutes('00:01')).toBe(1)
  })
})

describe('hasTimeOverlap()', () => {
  it('returns false for ranges that do not overlap (A before B)', () => {
    expect(hasTimeOverlap('08:00', '10:00', '10:00', '12:00')).toBe(false)
  })

  it('returns false for ranges that do not overlap (A after B)', () => {
    expect(hasTimeOverlap('12:00', '14:00', '10:00', '12:00')).toBe(false)
  })

  it('returns true when A starts before B ends and A ends after B starts', () => {
    expect(hasTimeOverlap('09:00', '11:00', '10:00', '12:00')).toBe(true)
  })

  it('returns true when A fully contains B', () => {
    expect(hasTimeOverlap('08:00', '14:00', '10:00', '12:00')).toBe(true)
  })

  it('returns true when B fully contains A', () => {
    expect(hasTimeOverlap('10:00', '12:00', '08:00', '14:00')).toBe(true)
  })

  it('returns true for identical ranges', () => {
    expect(hasTimeOverlap('10:00', '12:00', '10:00', '12:00')).toBe(true)
  })

  it('returns true when A ends at the start of B boundary (open end - A starts < B end, A end > B start)', () => {
    // 08:00-10:30 vs 10:00-12:00 → overlaps because 08:00 < 12:00 AND 10:30 > 10:00
    expect(hasTimeOverlap('08:00', '10:30', '10:00', '12:00')).toBe(true)
  })
})

describe('durationHours()', () => {
  it('returns 1 for a 60-minute range', () => {
    expect(durationHours('10:00', '11:00')).toBe(1)
  })

  it('returns ceiling for a partial hour (61 minutes → 2)', () => {
    expect(durationHours('10:00', '11:01')).toBe(2)
  })

  it('returns 2 for a 2-hour range', () => {
    expect(durationHours('10:00', '12:00')).toBe(2)
  })

  it('returns ceiling for 90 minutes (1.5 hrs → 2)', () => {
    expect(durationHours('10:00', '11:30')).toBe(2)
  })

  it('returns 0 for zero-duration range', () => {
    expect(durationHours('10:00', '10:00')).toBe(0)
  })

  it('calculates correctly across many hours', () => {
    expect(durationHours('08:00', '20:00')).toBe(12)
  })
})

describe('addDaysISO()', () => {
  it('adds one day across month boundary', () => {
    expect(addDaysISO('2026-04-30', 1)).toBe('2026-05-01')
  })
  it('subtracts one day across month boundary', () => {
    expect(addDaysISO('2026-05-01', -1)).toBe('2026-04-30')
  })
  it('handles leap year (Feb 28 → Feb 29)', () => {
    expect(addDaysISO('2024-02-28', 1)).toBe('2024-02-29')
  })
  it('handles non-leap year (Feb 28 → Mar 1)', () => {
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01')
  })
  it('returns same date when days = 0', () => {
    expect(addDaysISO('2026-04-21', 0)).toBe('2026-04-21')
  })
})

describe('dateToEpochDays()', () => {
  it('returns different values for consecutive days', () => {
    const a = dateToEpochDays('2026-04-20')
    const b = dateToEpochDays('2026-04-21')
    expect(b - a).toBe(1)
  })
})

describe('computeAbsoluteMinutes()', () => {
  it('same-day hourly: start < end, no wrap', () => {
    const r = computeAbsoluteMinutes('2026-04-21', '14:00', '16:00', 'hourly', '2026-04-21')
    expect(r).toEqual({ start: 14 * 60, end: 16 * 60 })
  })

  it('overnight mode: wraps endTime +24h even when textually earlier', () => {
    const r = computeAbsoluteMinutes('2026-04-21', '22:00', '06:00', 'overnight', '2026-04-21')
    expect(r).toEqual({ start: 22 * 60, end: 6 * 60 + 1440 })
  })

  it('endTime < startTime without overnight mode still detected as wrap', () => {
    const r = computeAbsoluteMinutes('2026-04-21', '22:00', '06:00', 'hourly', '2026-04-21')
    expect(r).toEqual({ start: 22 * 60, end: 6 * 60 + 1440 })
  })

  it('next-day booking relative to refDate (ref is earlier)', () => {
    const r = computeAbsoluteMinutes('2026-04-22', '06:00', '10:00', 'hourly', '2026-04-21')
    expect(r).toEqual({ start: 1440 + 6 * 60, end: 1440 + 10 * 60 })
  })

  it('previous-day booking relative to refDate produces negative start', () => {
    const r = computeAbsoluteMinutes('2026-04-20', '22:00', '06:00', 'overnight', '2026-04-21')
    expect(r).toEqual({ start: -1440 + 22 * 60, end: -1440 + 6 * 60 + 1440 })
  })

  it('zero-duration range (endTime == startTime) does not wrap', () => {
    const r = computeAbsoluteMinutes('2026-04-21', '10:00', '10:00', 'hourly', '2026-04-21')
    expect(r).toEqual({ start: 600, end: 600 })
  })
})
