/**
 * Convert "HH:mm" string to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Check if two time ranges overlap.
 * Ranges are [startA, endA) and [startB, endB) in "HH:mm" format.
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
 * Calculate duration in hours (ceiling) between two times.
 */
export function durationHours(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return Math.ceil((endMin - startMin) / 60);
}
