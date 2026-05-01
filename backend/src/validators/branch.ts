import { z } from 'zod';

/**
 * Schema validate tạo chi nhánh mới
 * - name: bắt buộc, tối thiểu 1 ký tự
 * - address: bắt buộc, tối thiểu 1 ký tự
 * - district: tùy chọn
 * - phone: tùy chọn
 */
export const createBranchSchema = z.object({
    name: z.string().min(1, 'Tên chi nhánh là bắt buộc'),
    address: z.string().min(1, 'Địa chỉ là bắt buộc'),
    district: z.string().optional(),
    phone: z.string().optional(),
});

/** Schema cập nhật chi nhánh — tất cả trường optional */
export const updateBranchSchema = createBranchSchema.partial();
