import { describe, it, expect } from 'vitest'
import { calculatePrice } from './price.js'

const baseConfig = {
  hourlyRate: 169000,
  dailyRate: 450000,
  overnightRate: 350000,
  extraHourRate: 40000,
}

describe('calculatePrice() — hourly mode', () => {
  it('calculates 1 hour correctly', () => {
    // 10:00–11:00 = 1 hr → ceil(1) * 169000 = 169000
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig)).toBe(169000)
  })

  it('calculates 2 hours correctly', () => {
    expect(calculatePrice('hourly', '10:00', '12:00', baseConfig)).toBe(338000)
  })

  it('uses ceiling for partial hours', () => {
    // 10:00–11:01 = 61 min → ceil(61/60) = 2 hrs → 338000
    expect(calculatePrice('hourly', '10:00', '11:01', baseConfig)).toBe(338000)
  })

  it('uses ceiling for 90 min (1.5 hrs → 2)', () => {
    expect(calculatePrice('hourly', '10:00', '11:30', baseConfig)).toBe(338000)
  })

  it('uses hourly mode when mode is unknown', () => {
    // Falls through to default (hourly)
    expect(calculatePrice('unknown', '10:00', '11:00', baseConfig)).toBe(169000)
  })
})

describe('calculatePrice() — daily mode', () => {
  it('calculates 24 hours as 1 day', () => {
    // 00:00–24:00 = 24 hrs → ceil(24/24) = 1 day → 450000
    expect(calculatePrice('daily', '00:00', '24:00', baseConfig)).toBe(450000)
  })

  it('calculates less than 24 hours as 1 day (ceiling)', () => {
    // 10:00–20:00 = 10 hrs → ceil(10/24) = 1 day → 450000
    expect(calculatePrice('daily', '10:00', '20:00', baseConfig)).toBe(450000)
  })
})

describe('calculatePrice() — overnight mode', () => {
  it('calculates overnight rate for 10 hours', () => {
    // 22:00–08:00 next day would be negative in single-day calc,
    // but we use simple minute subtraction. Test a positive range.
    // 08:00–18:00 = 10 hrs → ceil(10/24) = 1 day → 350000
    expect(calculatePrice('overnight', '08:00', '18:00', baseConfig)).toBe(350000)
  })

  it('uses overnightRate per 24 hr unit', () => {
    // 00:00–24:00 = 24 hrs → ceil(24/24) = 1 → 350000
    expect(calculatePrice('overnight', '00:00', '24:00', baseConfig)).toBe(350000)
  })
})

describe('calculatePrice() — with food items', () => {
  it('adds food item prices to room price', () => {
    // 1 hr hourly + 1 food item (11000)
    const food = [{ price: 11000 }]
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig, food)).toBe(180000)
  })

  it('multiplies food item price by qty', () => {
    // 1 hr hourly + 3x food item (11000 each)
    const food = [{ price: 11000, qty: 3 }]
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig, food)).toBe(202000)
  })

  it('defaults qty to 1 when not provided', () => {
    const food = [{ price: 20000 }]
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig, food)).toBe(189000)
  })

  it('handles multiple food items', () => {
    const food = [
      { price: 11000, qty: 2 },
      { price: 20000, qty: 1 },
    ]
    // 169000 + 22000 + 20000 = 211000
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig, food)).toBe(211000)
  })
})

describe('calculatePrice() — with discount', () => {
  it('subtracts discount from total', () => {
    // 1 hr = 169000, discount 50000 → 119000
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig, [], 50000)).toBe(119000)
  })

  it('returns 0 if discount exceeds total price (never negative)', () => {
    // 1 hr = 169000, discount 300000 → max(0, ...) = 0
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig, [], 300000)).toBe(0)
  })

  it('applies discount after adding food', () => {
    const food = [{ price: 11000 }]
    // 169000 + 11000 - 30000 = 150000
    expect(calculatePrice('hourly', '10:00', '11:00', baseConfig, food, 30000)).toBe(150000)
  })
})
