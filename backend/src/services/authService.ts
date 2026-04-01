import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../db/schema/index.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { JwtPayload } from '../middleware/auth.js';

/** Số vòng bcrypt salt — 12 là đủ an toàn cho production */
const SALT_ROUNDS = 12;

/**
 * Băm mật khẩu bằng bcrypt
 * @param password - Mật khẩu plaintext
 * @returns Chuỗi hash bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * So sánh mật khẩu plaintext với hash đã lưu
 * @param password - Mật khẩu plaintext
 * @param hash - Chuỗi hash bcrypt từ DB
 * @returns true nếu khớp
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Tạo cặp JWT token (access + refresh).
 * Access token dùng JWT_SECRET, refresh token dùng JWT_REFRESH_SECRET.
 */
function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string & jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string & jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
}

/**
 * Xác thực thông tin đăng nhập và trả về JWT tokens
 * @param username - Tên đăng nhập
 * @param password - Mật khẩu
 * @returns Access token, refresh token và thông tin user (không có passwordHash)
 * @throws AppError 401 nếu sai thông tin đăng nhập (cùng message để tránh enumeration)
 */
export async function login(username: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new AppError(401, 'Invalid username or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid username or password');
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as 'admin' | 'staff',
  };

  const tokens = generateTokens(payload);

  return {
    ...tokens,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    },
  };
}

/**
 * Làm mới access token từ refresh token
 * Xác minh refresh token, kiểm tra user còn tồn tại, phát hành access token mới
 * @param refreshToken - JWT refresh token
 * @returns Object chứa access token mới
 * @throws AppError 401 nếu refresh token hết hạn/không hợp lệ hoặc user không còn tồn tại
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

    // Kiểm tra user vẫn tồn tại trước khi cấp token mới
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      throw new AppError(401, 'User no longer exists');
    }

    const newPayload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'staff',
    };

    const accessToken = jwt.sign(newPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string & jwt.SignOptions['expiresIn'],
    });

    return { accessToken };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Invalid refresh token');
  }
}

/**
 * Lấy thông tin user hiện tại (không bao gồm passwordHash)
 * @param userId - ID của user
 * @returns Thông tin user: id, username, role, displayName, email
 * @throws AppError 404 nếu user không tồn tại
 */
export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}
