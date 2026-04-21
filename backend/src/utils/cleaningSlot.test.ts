import { describe, it, expect } from 'vitest';
import { computeCleaningSlot, minutesToTime, CLEANING_DURATION_MIN } from './cleaningSlot.js';

describe('minutesToTime()', () => {
  it('pads hour and minute to 2 digits', () => {
    expect(minutesToTime(65)).toBe('01:05');
  });
  it('returns 00:00 for 0', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });
  it('returns 23:59 for 1439', () => {
    expect(minutesToTime(1439)).toBe('23:59');
  });
  it('wraps past 24h via modulo', () => {
    expect(minutesToTime(1440)).toBe('00:00');
    expect(minutesToTime(1500)).toBe('01:00');
  });
  it('normalizes negative values', () => {
    expect(minutesToTime(-30)).toBe('23:30');
  });
});

describe('computeCleaningSlot()', () => {
  it('same-day guest → cleaning same date, non-wrapping end', () => {
    const r = computeCleaningSlot({ date: '2026-04-21', startTime: '14:00', endTime: '16:00' });
    expect(r).toEqual({
      date: '2026-04-21',
      startTime: '16:00',
      endTime: '16:30',
      guestIsOvernight: false,
    });
  });

  it('overnight guest (22:00→06:00) → cleaning date +1, 06:00–06:30', () => {
    const r = computeCleaningSlot({ date: '2026-04-21', startTime: '22:00', endTime: '06:00' });
    expect(r).toEqual({
      date: '2026-04-22',
      startTime: '06:00',
      endTime: '06:30',
      guestIsOvernight: true,
    });
  });

  it('overnight guest ending at 00:00 → cleaning date +1, 00:00–00:30', () => {
    const r = computeCleaningSlot({ date: '2026-04-21', startTime: '22:00', endTime: '00:00' });
    expect(r).toEqual({
      date: '2026-04-22',
      startTime: '00:00',
      endTime: '00:30',
      guestIsOvernight: true,
    });
  });

  it('same-day guest ending at 23:45 → cleaning 23:45–00:15 same date (cleaning wraps midnight itself)', () => {
    const r = computeCleaningSlot({ date: '2026-04-21', startTime: '14:00', endTime: '23:45' });
    expect(r).toEqual({
      date: '2026-04-21',
      startTime: '23:45',
      endTime: '00:15',
      guestIsOvernight: false,
    });
  });

  it('month boundary overnight guest → cleaning rolls to next month', () => {
    const r = computeCleaningSlot({ date: '2026-04-30', startTime: '22:00', endTime: '06:00' });
    expect(r.date).toBe('2026-05-01');
  });

  it('cleaning duration constant is 30 min', () => {
    expect(CLEANING_DURATION_MIN).toBe(30);
  });
});
