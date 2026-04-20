import { computeAbsoluteMinutes } from './time.js';

/** Booking candidate tối thiểu dùng cho overlap check (không cần full row). */
export interface OverlapCandidate {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: string | null;
}

/**
 * Pure helper: tìm candidate đầu tiên overlap với khoảng mới.
 *
 * Semantics:
 * - Half-open interval `[start, end)` → touch-point (new.start == cand.end) KHÔNG overlap.
 * - Overnight-aware: nếu mode='overnight' hoặc endTime < startTime (theo text), endTime +24h.
 * - Candidate có thể thuộc ngày trước/sau refDate — hàm tự tính offset ngày.
 */
export function findOverlappingBooking<T extends OverlapCandidate>(
  newRange: { date: string; startTime: string; endTime: string; mode: string },
  candidates: T[],
): T | null {
  const ref = newRange.date;
  const n = computeAbsoluteMinutes(
    newRange.date,
    newRange.startTime,
    newRange.endTime,
    newRange.mode,
    ref,
  );
  for (const c of candidates) {
    const r = computeAbsoluteMinutes(c.date, c.startTime, c.endTime, c.mode ?? 'hourly', ref);
    if (n.start < r.end && r.start < n.end) return c;
  }
  return null;
}
