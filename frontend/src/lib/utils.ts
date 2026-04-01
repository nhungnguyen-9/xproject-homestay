import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Gộp và hợp nhất các class CSS với Tailwind merge
 * @param inputs - Danh sách class cần gộp
 * @returns Chuỗi class đã được hợp nhất, loại bỏ xung đột Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
