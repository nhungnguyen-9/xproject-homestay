import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../db/schema/index.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { JwtPayload } from '../middleware/auth.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string & jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string & jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
}

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

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

    // Verify user still exists
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
