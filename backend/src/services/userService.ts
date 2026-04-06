import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { users } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

/** Số vòng bcrypt salt */
const SALT_ROUNDS = 12;

/** Các cột trả về cho user (không bao gồm passwordHash) */
const userColumns = {
  id: users.id,
  username: users.username,
  role: users.role,
  displayName: users.displayName,
  email: users.email,
  permissions: users.permissions,
  isActive: users.isActive,
  createdAt: users.createdAt,
} as const;

/**
 * Lấy danh sách tất cả users (không trả passwordHash)
 * @returns Mảng user
 */
export async function getAll() {
  return db.select(userColumns).from(users);
}

/**
 * Tạo staff mới
 * @param data - Thông tin staff: username, password, displayName, email, permissions
 * @returns User vừa tạo
 * @throws AppError 409 nếu username đã tồn tại
 */
export async function createStaff(data: {
  username: string;
  password: string;
  displayName: string;
  email?: string;
  permissions?: string[];
}) {
  const existing = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, 'Username đã tồn tại');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const [user] = await db.insert(users).values({
    username: data.username,
    passwordHash,
    role: 'staff',
    displayName: data.displayName,
    email: data.email || null,
    permissions: data.permissions || ['bookings'],
    isActive: true,
  }).returning(userColumns);

  return user;
}

/**
 * Cập nhật thông tin + permissions của user
 * @param id - ID user
 * @param data - Các trường cần cập nhật
 * @returns User đã cập nhật
 * @throws AppError 404 nếu user không tồn tại
 */
export async function update(id: string, data: {
  displayName?: string;
  email?: string | null;
  permissions?: string[];
}) {
  const [user] = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(userColumns);

  if (!user) {
    throw new AppError(404, 'User không tồn tại');
  }

  return user;
}

/**
 * Bật/tắt trạng thái tài khoản (toggle isActive)
 * @param id - ID user
 * @returns User đã cập nhật
 * @throws AppError 404 nếu user không tồn tại
 * @throws AppError 400 nếu cố vô hiệu hóa admin
 */
export async function toggleActive(id: string) {
  const [target] = await db.select({ role: users.role, isActive: users.isActive })
    .from(users).where(eq(users.id, id));

  if (!target) {
    throw new AppError(404, 'User không tồn tại');
  }
  if (target.role === 'admin') {
    throw new AppError(400, 'Không thể vô hiệu hóa tài khoản admin');
  }

  const [user] = await db.update(users)
    .set({ isActive: !target.isActive, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(userColumns);

  return user;
}

/**
 * Xóa user (hard delete) — chỉ staff, không cho xóa admin
 * @param id - ID user
 * @throws AppError 404 nếu user không tồn tại
 * @throws AppError 400 nếu cố xóa admin
 */
export async function remove(id: string) {
  const [target] = await db.select({ role: users.role })
    .from(users).where(eq(users.id, id));

  if (!target) {
    throw new AppError(404, 'User không tồn tại');
  }
  if (target.role === 'admin') {
    throw new AppError(400, 'Không thể xóa tài khoản admin');
  }

  await db.delete(users).where(eq(users.id, id));
}
