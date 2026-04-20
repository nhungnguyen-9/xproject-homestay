/**
 * Chuyển chuỗi "HH:mm" thành tổng số phút kể từ nửa đêm.
 * @param time - Chuỗi thời gian định dạng "HH:mm"
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Kiểm tra hai khoảng thời gian có trùng lặp hay không.
 * Sử dụng khoảng nửa mở [start, end) với định dạng "HH:mm".
 */
export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const a0 = timeToMinutes(startA);
  const a1 = timeToMinutes(endA);
  const b0 = timeToMinutes(startB);
  const b1 = timeToMinutes(endB);
  return a0 < b1 && a1 > b0;
}

/**
 * Tính thời lượng (giờ, làm tròn lên) giữa hai mốc thời gian.
 * @param startTime - Giờ bắt đầu "HH:mm"
 * @param endTime - Giờ kết thúc "HH:mm"
 */
export function durationHours(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return Math.ceil((endMin - startMin) / 60);
}

/**
 * Parse "YYYY-MM-DD" → số ngày tính từ epoch (UTC). Dùng cho date arithmetic không phụ thuộc timezone.
 */
export function dateToEpochDays(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * Cộng/trừ `days` vào một chuỗi "YYYY-MM-DD". Trả về chuỗi cùng định dạng.
 */
export function addDaysISO(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(t);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Quy đổi (date, startTime, endTime, mode) thành khoảng phút tuyệt đối
 * so với nửa đêm UTC của `refDate`. Tự động mở rộng endTime +24h khi booking
 * qua đêm (mode='overnight' hoặc endTime "nhỏ hơn" startTime).
 *
 * Dùng để so sánh overlap giữa các booking có thể chéo biên nửa đêm.
 *
 * @param date - Ngày booking "YYYY-MM-DD"
 * @param startTime - "HH:mm"
 * @param endTime - "HH:mm"
 * @param mode - Chế độ booking ('overnight' ép cross-midnight kể cả khi endTime > startTime)
 * @param refDate - Ngày mốc để tính offset (thường là date của booking đang so sánh)
 */
export function computeAbsoluteMinutes(
  date: string,
  startTime: string,
  endTime: string,
  mode: string,
  refDate: string,
): { start: number; end: number } {
  const dayOffset = dateToEpochDays(date) - dateToEpochDays(refDate);
  const base = dayOffset * 1440;
  const startMin = base + timeToMinutes(startTime);
  let endMin = base + timeToMinutes(endTime);
  const crossMidnight = mode === 'overnight' || timeToMinutes(endTime) < timeToMinutes(startTime);
  if (crossMidnight) endMin += 1440;
  return { start: startMin, end: endMin };
}
