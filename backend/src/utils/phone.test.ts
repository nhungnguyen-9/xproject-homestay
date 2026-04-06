import { describe, it, expect } from 'vitest'
import { normalizePhone } from './phone.js'

describe('normalizePhone()', () => {
  it('returns a plain 10-digit number unchanged', () => {
    expect(normalizePhone('0987654321')).toBe('0987654321')
  })

  it('converts +84 prefix to 0', () => {
    expect(normalizePhone('+84987654321')).toBe('0987654321')
  })

  it('converts +84 prefix with 9-digit suffix', () => {
    expect(normalizePhone('+84912345678')).toBe('0912345678')
  })

  it('removes spaces', () => {
    expect(normalizePhone('0987 654 321')).toBe('0987654321')
  })

  it('removes dashes', () => {
    expect(normalizePhone('0987-654-321')).toBe('0987654321')
  })

  it('removes spaces from +84 number and converts prefix', () => {
    expect(normalizePhone('+84 987 654 321')).toBe('0987654321')
  })

  it('removes dashes from +84 number and converts prefix', () => {
    expect(normalizePhone('+84-987-654-321')).toBe('0987654321')
  })

  it('handles mixed spaces and dashes', () => {
    expect(normalizePhone('0987 654-321')).toBe('0987654321')
  })

  it('leaves numbers not starting with +84 alone (after stripping spaces)', () => {
    expect(normalizePhone('0123 456 789')).toBe('0123456789')
  })
})
