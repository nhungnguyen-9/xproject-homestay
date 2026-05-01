import { timeToMinutes, addDaysISO } from './time.js';

/** Thời lượng dọn phòng mặc định (phút). */
export const CLEANING_DURATION_MIN = 30;

/**
 * Format số phút (0..1439) thành "HH:mm", zero-pad.
 */
export function minutesToTime(min: number): string {
  const normalized = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Tính slot dọn phòng 30 phút kế tiếp sau booking khách.
 *
 * Convention:
 * - Guest overnight khi `endTime <= startTime` (text) → cleaning ngày +1.
 * - Cleaning start = guest.endTime; cleaning end = guest.endTime + 30 min (wrap qua "HH:mm").
 * - Date của cleaning chỉ chuyển sang ngày +1 khi GUEST là overnight.
 *   (Nếu cleaning tự nó wrap nửa đêm — ví dụ guest 14:00-23:45 → cleaning 23:45-00:15 —
 *    date giữ nguyên ngày guest, endTime < startTime được overlap helper xử lý.)
 */
export function computeCleaningSlot(guest: {
  date: string;
  startTime: string;
  endTime: string;
}): { date: string; startTime: string; endTime: string; guestIsOvernight: boolean } {
  const guestStartMin = timeToMinutes(guest.startTime);
  const guestEndMin = timeToMinutes(guest.endTime);
  const guestIsOvernight = guestEndMin <= guestStartMin;

  const cleaningStartTime = guest.endTime;
  const cleaningEndTime = minutesToTime(guestEndMin + CLEANING_DURATION_MIN);
  const cleaningDate = guestIsOvernight ? addDaysISO(guest.date, 1) : guest.date;

  return {
    date: cleaningDate,
    startTime: cleaningStartTime,
    endTime: cleaningEndTime,
    guestIsOvernight,
  };
}
