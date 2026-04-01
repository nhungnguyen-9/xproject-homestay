import { db } from '../config/database.js';
import { users } from './schema/index.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Đảm bảo tài khoản admin mặc định tồn tại trong database.
 * An toàn khi chạy nhiều lần — không xóa hay ghi đè dữ liệu hiện có.
 */
async function seedAdmin() {
  console.log('🔐 Kiểm tra tài khoản admin mặc định...');

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, 'admin'))
    .limit(1);

  if (existing) {
    console.log('✅ Tài khoản admin đã tồn tại — bỏ qua.');
    process.exit(0);
  }

  const passwordHash = bcrypt.hashSync('admin123', 12);
  await db.insert(users).values({
    id: 'admin-001',
    username: 'admin',
    passwordHash,
    role: 'admin',
    displayName: 'Administrator',
    isActive: true,
  });

  console.log('✅ Đã tạo tài khoản admin mặc định (admin / admin123)');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ seed-admin thất bại:', err);
  process.exit(1);
});
