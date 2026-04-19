import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as branchService from '../services/branchService.js';
import { saveBranchImage, deleteBranchImage } from '../services/uploadService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { createBranchSchema, updateBranchSchema } from '../validators/branch.js';
import { AppError } from '../middleware/errorHandler.js';

/** Router quản lý chi nhánh — GET công khai, CUD yêu cầu admin */
const branches = new Hono();

/** GET /branches — danh sách chi nhánh (công khai) */
branches.get('/', async (c) => {
  const result = await branchService.getAll();
  return c.json(result);
});

/** GET /branches/:id — chi tiết chi nhánh (công khai) */
branches.get('/:id', async (c) => {
  const branch = await branchService.getById(c.req.param('id'));
  return c.json(branch);
});

/** POST /branches — tạo chi nhánh mới (chỉ admin) */
branches.post('/', authMiddleware, adminOnly, zValidator('json', createBranchSchema), async (c) => {
  const data = c.req.valid('json');
  const branch = await branchService.create(data);
  return c.json(branch, 201);
});

/** PUT /branches/:id — cập nhật chi nhánh (chỉ admin) */
branches.put('/:id', authMiddleware, adminOnly, zValidator('json', updateBranchSchema), async (c) => {
  const data = c.req.valid('json');
  const branch = await branchService.update(c.req.param('id'), data);
  return c.json(branch);
});

/** DELETE /branches/:id — xoá chi nhánh (chỉ admin) */
branches.delete('/:id', authMiddleware, adminOnly, async (c) => {
  const branchId = c.req.param('id')!;
  await branchService.remove(branchId);
  return c.json({ message: 'Branch deleted' });
});

/**
 * POST /branches/:id/images — Upload hình ảnh chi nhánh (chỉ admin)
 * Multipart form data, field "files" chứa 1 hoặc nhiều file ảnh.
 * Tối đa 5 file/request, 2MB/file, tổng ảnh chi nhánh <= 5.
 */
branches.post('/:id/images', authMiddleware, adminOnly, async (c) => {
  const branchId = c.req.param('id')!;
  const branch = await branchService.getById(branchId);
  const currentImages = (branch.images as string[]) || [];

  const body = await c.req.parseBody({ all: true });
  const rawFiles = body['files'];

  const files: File[] = Array.isArray(rawFiles)
    ? rawFiles.filter((f): f is File => f instanceof File)
    : rawFiles instanceof File ? [rawFiles] : [];

  if (files.length === 0) {
    throw new AppError(400, 'Thiếu file ảnh. Gửi multipart form với field "files".');
  }

  if (files.length > 5) {
    throw new AppError(400, 'Tối đa 5 file mỗi lần upload.');
  }

  if (currentImages.length + files.length > 5) {
    throw new AppError(400, `Chi nhánh đã có ${currentImages.length} ảnh. Chỉ có thể upload thêm ${5 - currentImages.length} ảnh nữa.`);
  }

  try {
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const filename = await saveBranchImage(files[i], branchId, i);
      newUrls.push(`/uploads/branches/${filename}`);
    }

    const updatedImages = [...currentImages, ...newUrls];
    await branchService.update(branchId, { images: updatedImages });

    return c.json({ images: updatedImages }, 201);
  } catch (err: any) {
    throw new AppError(400, err.message);
  }
});

/**
 * DELETE /branches/:id/images — Xóa hình ảnh chi nhánh (chỉ admin)
 * Body JSON: { imageUrl: string }
 */
branches.delete('/:id/images', authMiddleware, adminOnly, async (c) => {
  const branchId = c.req.param('id')!;
  const branch = await branchService.getById(branchId);
  const currentImages = (branch.images as string[]) || [];

  const { imageUrl } = await c.req.json<{ imageUrl: string }>();

  if (!imageUrl || !currentImages.includes(imageUrl)) {
    throw new AppError(400, 'Ảnh không tồn tại trong chi nhánh này');
  }

  await deleteBranchImage(imageUrl);
  const updatedImages = currentImages.filter((img) => img !== imageUrl);
  await branchService.update(branchId, { images: updatedImages });

  return c.json({ images: updatedImages });
});

export { branches as branchRoutes };
