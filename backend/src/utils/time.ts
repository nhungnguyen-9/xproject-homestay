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
