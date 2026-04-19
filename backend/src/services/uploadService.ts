import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Thư mục gốc lưu file upload */
const UPLOADS_ROOT = path.resolve(import.meta.dirname, '../../uploads');

/** Loại MIME được phép upload (kiểm tra sơ bộ trước magic bytes) */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/** Giới hạn dung lượng file: 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Kiểm tra magic bytes đầu file để xác định loại ảnh thực sự.
 * Chống giả mạo Content-Type từ client.
 * @param buffer - Buffer chứa nội dung file
 * @returns Object chứa extension thực nếu nhận dạng được, null nếu không
 */
function validateMagicBytes(buffer: Buffer): { ext: string } | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: '.png' };
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { ext: '.webp' };
  }

  return null;
}

/**
 * Lưu file ảnh vào thư mục uploads/rooms/.
 * Validate cả MIME type lẫn magic bytes header để chống giả mạo.
 * Extension được xác định từ magic bytes, không từ MIME header hay tên file gốc.
 * @param file - File từ multipart form data
 * @param roomId - ID phòng (dùng làm prefix tên file)
 * @param index - Số thứ tự file trong batch upload
 * @returns Tên file đã lưu (dùng để tạo URL)
 * @throws Error nếu file không hợp lệ (loại, dung lượng, magic bytes)
 */
export async function saveRoomImage(file: File, roomId: string, index: number): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Loại file không được hỗ trợ: ${file.type}. Chỉ chấp nhận JPEG, PNG, WebP`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(1)}MB. Tối đa 5MB`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate magic bytes — chặn file giả mạo MIME type
  const magicBytes = validateMagicBytes(buffer);
  if (!magicBytes) {
    throw new Error('File không phải ảnh hợp lệ. Nội dung file không khớp với định dạng ảnh.');
  }

  // Dùng extension từ magic bytes thay vì từ MIME header
  const ext = magicBytes.ext;
  const filename = `${roomId}-${Date.now()}-${index}${ext}`;
  const dir = path.join(UPLOADS_ROOT, 'rooms');

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(path.join(dir, filename), buffer);

  return filename;
}

/**
 * Xóa file ảnh phòng khỏi disk.
 * Trích tên file từ URL path, có kiểm tra path traversal.
 * @param imageUrl - URL ảnh (dạng /uploads/rooms/filename)
 * @returns true nếu xóa thành công, false nếu file không tồn tại
 * @throws Error nếu đường dẫn không hợp lệ (path traversal)
 */
export async function deleteRoomImage(imageUrl: string): Promise<boolean> {
  const filename = path.basename(imageUrl);
  const filepath = path.join(UPLOADS_ROOT, 'rooms', filename);

  // Chặn path traversal
  if (!filepath.startsWith(path.join(UPLOADS_ROOT, 'rooms'))) {
    throw new Error('Đường dẫn file không hợp lệ');
  }

  try {
    await unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

/** Giới hạn dung lượng ảnh CCCD: 5MB (scan độ phân giải cao) */
const MAX_ID_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Lưu ảnh CCCD vào uploads/customers/{customerId}/.
 * Validate MIME type, dung lượng (5MB), và magic bytes.
 */
export async function saveCustomerIdImage(file: File, customerId: string, index: number): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Loại file không được hỗ trợ: ${file.type}. Chỉ chấp nhận JPEG, PNG, WebP`);
  }

  if (file.size > MAX_ID_IMAGE_SIZE) {
    throw new Error(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(1)}MB. Tối đa 5MB`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const magicBytes = validateMagicBytes(buffer);
  if (!magicBytes) {
    throw new Error('File không phải ảnh hợp lệ. Nội dung file không khớp với định dạng ảnh.');
  }

  const ext = magicBytes.ext;
  const filename = `${customerId}-${Date.now()}-${index}${ext}`;
  const dir = path.join(UPLOADS_ROOT, 'customers', customerId);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(path.join(dir, filename), buffer);

  return filename;
}

/**
 * Xóa 1 ảnh CCCD của khách hàng.
 * @returns true nếu xóa thành công, false nếu file không tồn tại
 */
export async function deleteCustomerIdImage(customerId: string, filename: string): Promise<boolean> {
  const safeFilename = path.basename(filename);
  const filepath = path.join(UPLOADS_ROOT, 'customers', customerId, safeFilename);

  // Chặn path traversal
  if (!filepath.startsWith(path.join(UPLOADS_ROOT, 'customers', customerId))) {
    throw new Error('Đường dẫn file không hợp lệ');
  }

  try {
    await unlink(filepath);
    return true;
  } catch {
    return false;
  }
}


/**
 * Lưu file ảnh vào thư mục uploads/branches/.
 * Validate cả MIME type lẫn magic bytes header để chống giả mạo.
 * @param file - File từ multipart form data
 * @param branchId - ID chi nhánh (dùng làm prefix tên file)
 * @param index - Số thứ tự file trong batch upload
 * @returns Tên file đã lưu (dùng để tạo URL)
 */
export async function saveBranchImage(file: File, branchId: string, index: number): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Loại file không được hỗ trợ: ${file.type}. Chỉ chấp nhận JPEG, PNG, WebP`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(1)}MB. Tối đa 5MB`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const magicBytes = validateMagicBytes(buffer);
  if (!magicBytes) {
    throw new Error('File không phải ảnh hợp lệ. Nội dung file không khớp với định dạng ảnh.');
  }

  const ext = magicBytes.ext;
  const filename = `${branchId}-${Date.now()}-${index}${ext}`;
  const dir = path.join(UPLOADS_ROOT, 'branches');

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(path.join(dir, filename), buffer);

  return filename;
}

/**
 * Xóa file ảnh chi nhánh khỏi disk.
 * @param imageUrl - URL ảnh (dạng /uploads/branches/filename)
 * @returns true nếu xóa thành công, false nếu file không tồn tại
 */
export async function deleteBranchImage(imageUrl: string): Promise<boolean> {
  const filename = path.basename(imageUrl);
  const filepath = path.join(UPLOADS_ROOT, 'branches', filename);

  if (!filepath.startsWith(path.join(UPLOADS_ROOT, 'branches'))) {
    throw new Error('Đường dẫn file không hợp lệ');
  }

  try {
    await unlink(filepath);
    return true;
  } catch {
    return false;
  }
}
