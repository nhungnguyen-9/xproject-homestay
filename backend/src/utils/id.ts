import { nanoid } from 'nanoid';

/**
 * Tạo ID ngẫu nhiên duy nhất bằng nanoid.
 * @param size - Độ dài ký tự (mặc định 21)
 */
export function generateId(size: number = 21): string {
  return nanoid(size);
}
