import { describe, it, expect } from 'vitest'
import {
  formatPrice, formatDate, formatDateInput, timeToMinutes, calculateDuration, calculateBookingPrice,
} from './helpers'
import type { DiscountSlot } from '@/types/room'

describe('formatPrice', () => {
  it('formats zero', () => {
    expect(formatPrice(0)).toBe('0')
  })

  it('formats a small VND amount', () => {
    expect(formatPrice(169000)).toBe('169.000')
  })

  it('formats a large VND amount with multiple dot separators', () => {
    expect(formatPrice(1500000)).toBe('1.500.000')
  })

  it('formats 50000', () => {
    expect(formatPrice(50000)).toBe('50.000')
  })

  it('formats 1000', () => {
    expect(formatPrice(1000)).toBe('1.000')
  })
})

describe('formatDate', () => {
  it('formats a date with zero-padded day and month', () => {
    const d = new Date(2026, 2, 5) // March 5, 2026
    expect(formatDate(d)).toBe('05/03/2026')
  })

  it('formats a date with two-digit day and month', () => {
    const d = new Date(2026, 11, 25) // Dec 25, 2026
    expect(formatDate(d)).toBe('25/12/2026')
  })

  it('formats January 1st correctly', () => {
    const d = new Date(2026, 0, 1)
    expect(formatDate(d)).toBe('01/01/2026')
  })

  it('formats the last day of a month correctly', () => {
    const d = new Date(2026, 2, 31) // March 31
    expect(formatDate(d)).toBe('31/03/2026')
  })
})

describe('formatDateInput (timezone-safe YYYY-MM-DD for API payload)', () => {
  it('formats a regular mid-day date to local YYYY-MM-DD', () => {
    // Noon local → not affected by TZ either way, sanity check
    const d = new Date(2026, 3, 20, 12, 0, 0) // 2026-04-20 12:00 local
    expect(formatDateInput(d)).toBe('2026-04-20')
  })

  it('returns LOCAL date even when UTC date would differ (midnight local in VN UTC+7)', () => {
    // Simulate: user in VN (UTC+7) picks "2026-04-20" from a date picker.
    // Internally Date is 2026-04-20T00:00:00 local = 2026-04-19T17:00:00 UTC.
    // toISOString().split('T')[0] would return '2026-04-19' (WRONG).
    // formatDateInput must return '2026-04-20' (CORRECT — local date).
    const d = new Date(2026, 3, 20, 0, 0, 0) // midnight local → UTC-7h in VN
    expect(formatDateInput(d)).toBe('2026-04-20')
  })

  it('returns LOCAL date for very early morning (00:30 local)', () => {
    // Reproduces the bug in ticket #11: user books between 00:00-07:00 local VN.
    const d = new Date(2026, 3, 20, 0, 30, 0)
    expect(formatDateInput(d)).toBe('2026-04-20')
  })

  it('handles single-digit day and month with padding', () => {
    const d = new Date(2026, 0, 5, 9, 0, 0) // Jan 5, 2026
    expect(formatDateInput(d)).toBe('2026-01-05')
  })

  it('handles end-of-year date correctly', () => {
    const d = new Date(2026, 11, 31, 23, 0, 0)
    expect(formatDateInput(d)).toBe('2026-12-31')
  })
})

describe('timeToMinutes', () => {
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
})

describe('calculateDuration', () => {
  it('returns 0 when check-out is same time as check-in (same day)', () => {
    const d = new Date(2026, 2, 10)
    expect(calculateDuration(d, '10:00', d, '10:00')).toBe(0)
  })

  it('calculates same-day duration in hours', () => {
    const d = new Date(2026, 2, 10)
    expect(calculateDuration(d, '10:00', d, '12:00')).toBe(2)
  })

  it('calculates same-day partial hour duration', () => {
    const d = new Date(2026, 2, 10)
    expect(calculateDuration(d, '10:00', d, '11:30')).toBe(1.5)
  })

  it('returns 0 if check-out is before check-in (same day)', () => {
    const d = new Date(2026, 2, 10)
    expect(calculateDuration(d, '12:00', d, '10:00')).toBe(0)
  })

  it('calculates multi-day duration', () => {
    const checkIn = new Date(2026, 2, 10)
    const checkOut = new Date(2026, 2, 11)
    // check in 10:00, check out 10:00 next day = 24 hours
    expect(calculateDuration(checkIn, '10:00', checkOut, '10:00')).toBe(24)
  })

  it('calculates overnight duration with different times', () => {
    const checkIn = new Date(2026, 2, 10)
    const checkOut = new Date(2026, 2, 11)
    // 22:00 → 08:00 next day = 10 hours
    expect(calculateDuration(checkIn, '22:00', checkOut, '08:00')).toBe(10)
  })

  it('calculates two-day stay', () => {
    const checkIn = new Date(2026, 2, 10)
    const checkOut = new Date(2026, 2, 12)
    // 12:00 → 12:00 two days later = 48 hours
    expect(calculateDuration(checkIn, '12:00', checkOut, '12:00')).toBe(48)
  })
})

describe('calculateBookingPrice — discount slots', () => {
  // hourlyRate=60000 → 1000 VND/minute for clean arithmetic
  const cfg = {
    hourlyRate: 60000,
    dailyRate: 500000,
    overnightRate: 350000,
    extraHourRate: 40000,
    combo3hRate: 400000,
    combo6h1hRate: 700000,
    combo6h1hDiscount: 100000,
  }

  it('empty slots array → no discount', () => {
    expect(calculateBookingPrice('hourly', 1, { ...cfg, discountSlots: [] }, 'bonus_hour', { startTime: '10:00', endTime: '11:00' })).toBe(60000)
  })

  it('fully inside a 20% slot', () => {
    const slots: DiscountSlot[] = [{ startTime: '14:00', endTime: '17:00', discountPercent: 20 }]
    expect(calculateBookingPrice('hourly', 1, { ...cfg, discountSlots: slots }, 'bonus_hour', { startTime: '14:00', endTime: '15:00' })).toBe(48000)
  })

  it('overlapping slots — highest wins', () => {
    const slots: DiscountSlot[] = [
      { startTime: '14:00', endTime: '16:00', discountPercent: 20 },
      { startTime: '15:00', endTime: '17:00', discountPercent: 50 },
    ]
    // 14-15 @ 20% = 48000, 15-16 @ 50% = 30000, 16-17 @ 50% = 30000 = 108000
    expect(calculateBookingPrice('hourly', 3, { ...cfg, discountSlots: slots }, 'bonus_hour', { startTime: '14:00', endTime: '17:00' })).toBe(108000)
  })

  it('no overlap → no discount', () => {
    const slots: DiscountSlot[] = [{ startTime: '20:00', endTime: '22:00', discountPercent: 50 }]
    expect(calculateBookingPrice('hourly', 2, { ...cfg, discountSlots: slots }, 'bonus_hour', { startTime: '10:00', endTime: '12:00' })).toBe(120000)
  })

  it('daily mode without overage returns dailyRate', () => {
    const slots: DiscountSlot[] = [{ startTime: '10:00', endTime: '20:00', discountPercent: 50 }]
    expect(calculateBookingPrice('daily', 10, { ...cfg, discountSlots: slots }, 'bonus_hour', { startTime: '10:00', endTime: '20:00' })).toBe(cfg.dailyRate)
  })

  it('combo6h1h bonus_hour — 8h with slot covering overage hour', () => {
    // 7h base @ combo rate + 1h overage @ extraHourRate 50% off
    // overageStart = 14:00 + 7h = 21:00 (min 1260), overageEnd = 22:00 (min 1320)
    // Slot 21:00-22:00 @ 50% fully covers. 60 min * (40000/60) * 0.5 = 20000.
    const slots: DiscountSlot[] = [{ startTime: '21:00', endTime: '22:00', discountPercent: 50 }]
    expect(calculateBookingPrice('combo6h1h', 8, { ...cfg, discountSlots: slots }, 'bonus_hour', { startTime: '14:00', endTime: '22:00' })).toBe(720000)
  })

  it('combo6h1h discount option — 7h with slot covering overage hour', () => {
    // base = combo6h1hRate - combo6h1hDiscount = 700000 - 100000 = 600000
    // overage = 7 - 6 = 1h. overageStart = 14:00 + 6h = 20:00 (1200), end = 21:00 (1260)
    // Slot 20:00-21:00 @ 40% → discount 60*(40000/60)*0.4 = 16000. overageCost = 24000.
    const slots: DiscountSlot[] = [{ startTime: '20:00', endTime: '21:00', discountPercent: 40 }]
    expect(calculateBookingPrice('combo6h1h', 7, { ...cfg, discountSlots: slots }, 'discount', { startTime: '14:00', endTime: '21:00' })).toBe(624000)
  })

  it('overnight 13h with slot covering extra hours', () => {
    // base = overnightRate = 350000. extraHours = 2. overageStart = 10:00 + 11h = 21:00 (1260)
    // overageEnd = 23:00 (1380). Slot 21:00-23:00 @ 50% → 120*(40000/60)*0.5 = 40000.
    // Total = 350000 + 40000 = 390000, capped at dailyRate=500000 → 390000.
    const slots: DiscountSlot[] = [{ startTime: '21:00', endTime: '23:00', discountPercent: 50 }]
    expect(calculateBookingPrice('overnight', 13, { ...cfg, discountSlots: slots }, 'bonus_hour', { startTime: '10:00', endTime: '23:00' })).toBe(390000)
  })

  it('daily 26h with overage — slot outside time-of-day range billed at full rate', () => {
    // fullDays=1, extraHours=2. basePrice = 500000.
    // overageStart = 10:00 + 24h = minute 2040 (= day 2 10:00 in absolute minutes).
    // Minute-walk compares `m` against 0..1439 HH:mm slots without wrap, so day-2 slots
    // defined as "10:00-12:00" don't match. Overage billed at full extraRate: 2*40000=80000.
    // Total = 580000, capped at 2*dailyRate=1000000.
    const slots: DiscountSlot[] = [{ startTime: '10:00', endTime: '12:00', discountPercent: 50 }]
    expect(calculateBookingPrice('daily', 26, { ...cfg, discountSlots: slots }, 'bonus_hour', { startTime: '10:00', endTime: '12:00' })).toBe(580000)
  })
})
