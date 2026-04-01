/**
 * Chuẩn hóa số điện thoại Việt Nam.
 * Xóa khoảng trắng, dấu gạch ngang, chuyển +84 thành 0.
 * @param phone - Số điện thoại gốc
 */
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  return normalized;
}
