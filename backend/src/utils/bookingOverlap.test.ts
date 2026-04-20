import { describe, it, expect } from 'vitest';
import { findOverlappingBooking, type OverlapCandidate } from './bookingOverlap.js';

const cand = (
  id: string,
  date: string,
  startTime: string,
  endTime: string,
  mode: string | null = 'hourly',
): OverlapCandidate & { id: string } => ({ id, date, startTime, endTime, mode });

describe('findOverlappingBooking() — overnight-aware', () => {
  it('same-day bookings that do not overlap → null', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '14:00', endTime: '16:00', mode: 'hourly' },
      [cand('b1', '2026-04-21', '10:00', '12:00')],
    );
    expect(result).toBeNull();
  });

  it('same-day bookings that do overlap → returns the conflict', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '11:00', endTime: '13:00', mode: 'hourly' },
      [cand('b1', '2026-04-21', '10:00', '12:00')],
    );
    expect(result?.id).toBe('b1');
  });

  it('half-open boundary: new.start == existing.end → NOT overlap', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '12:00', endTime: '14:00', mode: 'hourly' },
      [cand('b1', '2026-04-21', '10:00', '12:00')],
    );
    expect(result).toBeNull();
  });

  it('overnight 22→06 vs same-day 14→16 → no overlap', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '22:00', endTime: '06:00', mode: 'overnight' },
      [cand('b1', '2026-04-21', '14:00', '16:00', 'hourly')],
    );
    expect(result).toBeNull();
  });

  it('overnight 22→06 vs same-day 23→02 → OVERLAP (both cross midnight)', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '22:00', endTime: '06:00', mode: 'overnight' },
      [cand('b1', '2026-04-21', '23:00', '02:00', 'overnight')],
    );
    expect(result?.id).toBe('b1');
  });

  it('overnight from previous day (date-1, 22→06) vs new booking 04:00→08:00 today → OVERLAP', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '04:00', endTime: '08:00', mode: 'hourly' },
      [cand('b_prev', '2026-04-20', '22:00', '06:00', 'overnight')],
    );
    expect(result?.id).toBe('b_prev');
  });

  it('overnight from previous day (date-1, 22→06) vs new booking 06:00→10:00 today → NOT overlap (touch)', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '06:00', endTime: '10:00', mode: 'hourly' },
      [cand('b_prev', '2026-04-20', '22:00', '06:00', 'overnight')],
    );
    expect(result).toBeNull();
  });

  it('new overnight (22→06) vs next-day morning 07:00-09:00 → no overlap', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '22:00', endTime: '06:00', mode: 'overnight' },
      [cand('b_next', '2026-04-22', '07:00', '09:00', 'hourly')],
    );
    expect(result).toBeNull();
  });

  it('new overnight (22→06) vs next-day morning 05:00-07:00 → OVERLAP on [05:00, 06:00)', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '22:00', endTime: '06:00', mode: 'overnight' },
      [cand('b_next', '2026-04-22', '05:00', '07:00', 'hourly')],
    );
    expect(result?.id).toBe('b_next');
  });

  it('two overnights on the same date that overlap → returns conflict', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '22:00', endTime: '06:00', mode: 'overnight' },
      [cand('b1', '2026-04-21', '23:30', '07:00', 'overnight')],
    );
    expect(result?.id).toBe('b1');
  });

  it('missing mode on candidate defaults to hourly (no wrap)', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '14:00', endTime: '16:00', mode: 'hourly' },
      [cand('b1', '2026-04-21', '10:00', '12:00', null)],
    );
    expect(result).toBeNull();
  });

  it('picks first overlapping candidate when multiple exist', () => {
    const result = findOverlappingBooking(
      { date: '2026-04-21', startTime: '10:00', endTime: '14:00', mode: 'hourly' },
      [
        cand('miss', '2026-04-21', '06:00', '08:00'),
        cand('hit', '2026-04-21', '12:00', '16:00'),
      ],
    );
    expect(result?.id).toBe('hit');
  });
});
