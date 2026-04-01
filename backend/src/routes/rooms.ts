import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as roomService from '../services/roomService.js';
import { saveRoomImage, deleteRoomImage } from '../services/uploadService.js';
import { createRoomSchema, updateRoomSchema, deleteImageSchema, reorderImagesSchema } from '../validators/room.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { AppError } from '../middleware/errorHandler.js';

/** Router quản lý phòng — GET công khai, thao tác CUD yêu cầu admin */
const rooms = new Hono();

/** GET /rooms — danh sách phòng, công khai (lọc theo chi nhánh, loại) */
rooms.get('/', async (c) => {
  const branchId = c.req.query('branchId');
  const type = c.req.query('type');
  const result = await roomService.getAll({ branchId, type });
  return c.json(result);
});

/** GET /rooms/:id — chi tiết phòng, công khai */
rooms.get('/:id', async (c) => {
  const room = await roomService.getById(c.req.param('id'));
  return c.json(room);
});

/** POST /rooms — tạo phòng mới (chỉ admin) */
rooms.post('/', authMiddleware, adminOnly, zValidator('json', createRoomSchema), async (c) => {
  const data = c.req.valid('json');
  const room = await roomService.create(data);
  return c.json(room, 201);
});

/** PUT /rooms/:id — cập nhật phòng (chỉ admin) */
rooms.put('/:id', authMiddleware, adminOnly, zValidator('json', updateRoomSchema), async (c) => {
  const data = c.req.valid('json');
  const room = await roomService.update(c.req.param('id'), data);
  return c.json(room);
});

/** DELETE /rooms/:id — vô hiệu hóa phòng (chỉ admin, soft delete) */
rooms.delete('/:id', authMiddleware, adminOnly, async (c) => {
  await roomService.softDelete(c.req.param('id')!);
  return c.json({ message: 'Room deactivated' });
});

/**
 * POST /rooms/:id/images — Upload hình ảnh phòng (chỉ admin)
 * Multipart form data, field "files" chứa 1 hoặc nhiều file ảnh.
 * Tối đa 5 file/request, 2MB/file, tổng ảnh phòng <= 5.
 * Chấp nhận JPEG, PNG, WebP (validate bằng magic bytes).
 * @returns Danh sách images sau khi cập nhật
 */
rooms.post('/:id/images', authMiddleware, adminOnly, async (c) => {
  const roomId = c.req.param('id')!;
  const room = await roomService.getById(roomId);
  const currentImages = (room.images as string[]) || [];

  const body = await c.req.parseBody({ all: true });
  const rawFiles = body['files'];

  // Normalize: có thể là 1 File hoặc array File
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
    throw new AppError(400, `Phòng đã có ${currentImages.length} ảnh. Chỉ có thể upload thêm ${5 - currentImages.length} ảnh nữa.`);
  }

  try {
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const filename = await saveRoomImage(files[i], roomId, i);
      newUrls.push(`/uploads/rooms/${filename}`);
    }

    const updatedImages = [...currentImages, ...newUrls];
    await roomService.update(roomId, { images: updatedImages });

    return c.json({ images: updatedImages }, 201);
  } catch (err: any) {
    throw new AppError(400, err.message);
  }
});

/**
 * DELETE /rooms/:id/images — Xóa hình ảnh phòng (chỉ admin)
 * Body JSON: { imageUrl: string }
 * Xóa file khỏi disk và cập nhật danh sách images trong DB.
 * @returns Danh sách images sau khi xóa
 */
rooms.delete('/:id/images', authMiddleware, adminOnly, zValidator('json', deleteImageSchema), async (c) => {
  const roomId = c.req.param('id')!;
  const { imageUrl } = c.req.valid('json');
  const room = await roomService.getById(roomId);

  const currentImages = (room.images as string[]) || [];

  if (!currentImages.includes(imageUrl)) {
    throw new AppError(400, 'Ảnh không tồn tại trong phòng này');
  }

  await deleteRoomImage(imageUrl);
  const updatedImages = currentImages.filter((img) => img !== imageUrl);
  await roomService.update(roomId, { images: updatedImages });

  return c.json({ images: updatedImages });
});

/**
 * PUT /rooms/:id/images/reorder — Sắp xếp lại thứ tự ảnh phòng (chỉ admin)
 * Body JSON: { images: string[] } — mảng URL theo thứ tự mới.
 * Tất cả URLs phải tồn tại trong danh sách ảnh hiện tại (cùng set, khác thứ tự).
 * @returns Danh sách images sau khi sắp xếp
 */
rooms.put('/:id/images/reorder', authMiddleware, adminOnly, zValidator('json', reorderImagesSchema), async (c) => {
  const roomId = c.req.param('id')!;
  const { images: newOrder } = c.req.valid('json');
  const room = await roomService.getById(roomId);

  const currentImages = (room.images as string[]) || [];

  // Validate cùng set URLs
  if (newOrder.length !== currentImages.length) {
    throw new AppError(400, 'Danh sách ảnh phải có cùng số lượng với ảnh hiện tại');
  }

  const currentSet = new Set(currentImages);
  const newSet = new Set(newOrder);

  if (newSet.size !== newOrder.length) {
    throw new AppError(400, 'Danh sách ảnh chứa URL trùng lặp');
  }

  for (const url of newOrder) {
    if (!currentSet.has(url)) {
      throw new AppError(400, `URL không tồn tại trong ảnh phòng: ${url}`);
    }
  }

  await roomService.update(roomId, { images: newOrder });

  return c.json({ images: newOrder });
});

export { rooms as roomRoutes };
