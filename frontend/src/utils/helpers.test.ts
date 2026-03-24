import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, timeToMinutes, calculateDuration } from './helpers'

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
