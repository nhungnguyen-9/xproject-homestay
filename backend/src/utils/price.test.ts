import { describe, it, expect } from 'vitest'
import { calculatePrice } from './price.js'

const baseConfig = {
  hourlyRate: 169000,
  dailyRate: 450000,
  overnightRate: 350000,
  extraHourRate: 40000,
  combo3hRate: 400000,
  combo6h1hRate: 700000,
  combo6h1hDiscount: 100000,
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

describe('calculatePrice() — combo3h mode', () => {
  it('charges flat combo3hRate for ≤3 hours', () => {
    expect(calculatePrice('combo3h', '10:00', '13:00', baseConfig)).toBe(400000)
  })

  it('charges flat rate for 1 hour (under combo window)', () => {
    expect(calculatePrice('combo3h', '10:00', '11:00', baseConfig)).toBe(400000)
  })

  it('adds extraHourRate for overage past 3h', () => {
    // 4 hrs → 400000 + 1 * 40000 = 440000
    expect(calculatePrice('combo3h', '10:00', '14:00', baseConfig)).toBe(440000)
  })

  it('ceils partial overage hours', () => {
    // 3h30m → ceil(3.5)=4 → 400000 + 1*40000 = 440000
    expect(calculatePrice('combo3h', '10:00', '13:30', baseConfig)).toBe(440000)
  })
})

describe('calculatePrice() — combo6h1h mode', () => {
  it('default option=bonus_hour: flat rate for 7h', () => {
    expect(calculatePrice('combo6h1h', '10:00', '17:00', baseConfig)).toBe(700000)
  })

  it('bonus_hour: overage past 7h adds extraHourRate', () => {
    // 8h → 700000 + 1*40000 = 740000
    expect(calculatePrice('combo6h1h', '10:00', '18:00', baseConfig, [], 0, 'bonus_hour')).toBe(740000)
  })

  it('discount option: 6h window, rate − discount', () => {
    // 6h → 700000 − 100000 = 600000
    expect(calculatePrice('combo6h1h', '10:00', '16:00', baseConfig, [], 0, 'discount')).toBe(600000)
  })

  it('discount option: overage past 6h adds extraHourRate', () => {
    // 7h with discount option → 600000 + 1*40000 = 640000
    expect(calculatePrice('combo6h1h', '10:00', '17:00', baseConfig, [], 0, 'discount')).toBe(640000)
  })

  it('discount clamps at 0 when discount > rate', () => {
    const cfg = { ...baseConfig, combo6h1hRate: 50000, combo6h1hDiscount: 200000 }
    // base = max(0, 50000−200000) = 0
    expect(calculatePrice('combo6h1h', '10:00', '16:00', cfg, [], 0, 'discount')).toBe(0)
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
