import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as promoService from './promoService'
import type { PromoCode } from '@/types/promo'

// Mock the demo data module so tests are isolated from it
vi.mock('@/data/demo-promos', () => ({
  demoPromos: [
    {
      id: 'pr1',
      code: 'SUMMER20',
      discountType: 'percent',
      discountValue: 20,
      maxUses: 50,
      usedCount: 5,
      startDate: '2020-01-01',
      endDate: '2099-12-31',
      applicableRoomTypes: [],
      status: 'active',
      createdAt: '2020-01-01',
    },
    {
      id: 'pr2',
      code: 'VIP50K',
      discountType: 'fixed',
      discountValue: 50000,
      maxUses: 20,
      usedCount: 12,
      startDate: '2020-01-01',
      endDate: '2099-12-31',
      applicableRoomTypes: ['vip', 'supervip'],
      status: 'active',
      createdAt: '2020-01-01',
    },
  ] as PromoCode[],
}))

const STORAGE_KEY = 'nhacam_promos'

beforeEach(() => {
  localStorage.clear()
})

describe('init()', () => {
  it('saves demo data when localStorage is empty', () => {
    promoService.init()
    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].code).toBe('SUMMER20')
  })

  it('does not overwrite existing data', () => {
    const existing: PromoCode[] = [
      {
        id: 'pr99',
        code: 'EXISTING',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 5,
        usedCount: 0,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    promoService.init()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].code).toBe('EXISTING')
  })
})

describe('validate()', () => {
  beforeEach(() => {
    promoService.init()
  })

  it('returns valid true for an active, in-range promo with no room restriction', () => {
    const result = promoService.validate('SUMMER20', 'standard')
    expect(result.valid).toBe(true)
    expect(result.promo).toBeDefined()
    expect(result.promo!.code).toBe('SUMMER20')
  })

  it('returns error for a non-existent code', () => {
    const result = promoService.validate('FAKECODE', 'standard')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('returns error for a promo with expired status', () => {
    // Set up an expired promo
    const promos: PromoCode[] = [
      {
        id: 'pr10',
        code: 'EXPIRED',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 50,
        usedCount: 0,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        applicableRoomTypes: [],
        status: 'expired',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    const result = promoService.validate('EXPIRED', 'standard')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('hết hạn')
  })

  it('returns error when maxUses is reached', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr11',
        code: 'MAXED',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 5,
        usedCount: 5,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    const result = promoService.validate('MAXED', 'standard')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('lượt')
  })

  it('returns error when promo date range has not started yet', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr12',
        code: 'FUTURE',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 50,
        usedCount: 0,
        startDate: '2099-01-01',
        endDate: '2099-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    const result = promoService.validate('FUTURE', 'standard')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('thời gian')
  })

  it('returns error when promo date range has passed', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr13',
        code: 'OLD',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 50,
        usedCount: 0,
        startDate: '2020-01-01',
        endDate: '2020-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    const result = promoService.validate('OLD', 'standard')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('thời gian')
  })

  it('returns error when room type is not in applicableRoomTypes', () => {
    const result = promoService.validate('VIP50K', 'standard')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('loại phòng')
  })

  it('returns valid when room type matches applicableRoomTypes', () => {
    const result = promoService.validate('VIP50K', 'vip')
    expect(result.valid).toBe(true)
  })
})

describe('applyDiscount()', () => {
  beforeEach(() => {
    promoService.init()
  })

  it('applies percent discount correctly', () => {
    // SUMMER20: 20% off
    const discounted = promoService.applyDiscount('pr1', 500000)
    expect(discounted).toBe(400000) // 500000 * 0.8
  })

  it('applies fixed discount correctly', () => {
    // VIP50K: 50000 fixed
    const discounted = promoService.applyDiscount('pr2', 300000)
    expect(discounted).toBe(250000) // 300000 - 50000
  })

  it('returns original price if promo id not found', () => {
    const result = promoService.applyDiscount('nonexistent', 200000)
    expect(result).toBe(200000)
  })

  it('does not return negative price when fixed discount exceeds price', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr20',
        code: 'BIGSAVE',
        discountType: 'fixed',
        discountValue: 500000,
        maxUses: 50,
        usedCount: 0,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    const result = promoService.applyDiscount('pr20', 100000)
    expect(result).toBe(0)
  })

  it('increments usedCount after applying discount', () => {
    const before = promoService.getById('pr1')!.usedCount
    promoService.applyDiscount('pr1', 100000)
    const after = promoService.getById('pr1')!.usedCount
    expect(after).toBe(before + 1)
  })
})

describe('refreshStatuses()', () => {
  it('marks promos as expired when past endDate', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr30',
        code: 'STALE',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 50,
        usedCount: 0,
        startDate: '2020-01-01',
        endDate: '2020-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    promoService.refreshStatuses()
    const updated = promoService.getById('pr30')!
    expect(updated.status).toBe('expired')
  })

  it('marks promos as expired when maxUses reached', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr31',
        code: 'FULL',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 5,
        usedCount: 5,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    promoService.refreshStatuses()
    const updated = promoService.getById('pr31')!
    expect(updated.status).toBe('expired')
  })

  it('does not change disabled promos', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr32',
        code: 'DISABLED',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 50,
        usedCount: 0,
        startDate: '2020-01-01',
        endDate: '2020-12-31',
        applicableRoomTypes: [],
        status: 'disabled',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    promoService.refreshStatuses()
    const updated = promoService.getById('pr32')!
    expect(updated.status).toBe('disabled')
  })

  it('keeps active promos with valid date and usage', () => {
    const promos: PromoCode[] = [
      {
        id: 'pr33',
        code: 'VALID',
        discountType: 'fixed',
        discountValue: 10000,
        maxUses: 50,
        usedCount: 0,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        applicableRoomTypes: [],
        status: 'active',
        createdAt: '2020-01-01',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promos))
    promoService.refreshStatuses()
    const updated = promoService.getById('pr33')!
    expect(updated.status).toBe('active')
  })
})
