/**
 * Normalize Vietnamese phone numbers:
 * - Remove spaces and dashes
 * - Convert +84 prefix to 0
 */
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  return normalized;
}
