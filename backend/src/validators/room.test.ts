import { describe, it, expect } from 'vitest';
import { discountSlotSchema, createRoomSchema } from './room.js';

const baseRoom = {
  name: 'Room A',
  type: 'standard' as const,
  hourlyRate: 100_000,
  dailyRate: 500_000,
  overnightRate: 400_000,
  extraHourRate: 80_000,
};

describe('createRoomSchema.discountSlots', () => {
  it('defaults to [] when omitted', () => {
    const parsed = createRoomSchema.parse(baseRoom);
    expect(parsed.discountSlots).toEqual([]);
  });
});

describe('discountSlotSchema', () => {
  it('accepts a valid slot', () => {
    const parsed = discountSlotSchema.parse({
      startTime: '08:00',
      endTime: '12:00',
      discountPercent: 20,
    });
    expect(parsed).toEqual({ startTime: '08:00', endTime: '12:00', discountPercent: 20 });
  });

  it('rejects when endTime <= startTime', () => {
    expect(() =>
      discountSlotSchema.parse({ startTime: '12:00', endTime: '12:00', discountPercent: 10 }),
    ).toThrow(/endTime must be after startTime/);
    expect(() =>
      discountSlotSchema.parse({ startTime: '14:00', endTime: '10:00', discountPercent: 10 }),
    ).toThrow(/endTime must be after startTime/);
  });

  it('rejects bad HH:mm strings', () => {
    expect(() =>
      discountSlotSchema.parse({ startTime: '8:00', endTime: '12:00', discountPercent: 10 }),
    ).toThrow();
    expect(() =>
      discountSlotSchema.parse({ startTime: '08:00', endTime: '24:00', discountPercent: 10 }),
    ).toThrow();
    expect(() =>
      discountSlotSchema.parse({ startTime: '08:60', endTime: '09:00', discountPercent: 10 }),
    ).toThrow();
  });

  it('rejects percent out of [1,100] (e.g. 0 or 101)', () => {
    expect(() =>
      discountSlotSchema.parse({ startTime: '08:00', endTime: '09:00', discountPercent: 0 }),
    ).toThrow();
    expect(() =>
      discountSlotSchema.parse({ startTime: '08:00', endTime: '09:00', discountPercent: 101 }),
    ).toThrow();
  });
});
