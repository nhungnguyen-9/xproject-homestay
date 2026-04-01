import { db } from '../config/database.js';
import {
  branches,
  rooms,
  customers,
  users,
  bookings,
  promoCodes,
  telegramConfig,
  notificationTemplates,
  foodItems,
} from './schema/index.js';
import { notificationLog } from './schema/notificationLog.js';
import bcrypt from 'bcryptjs';

/**
 * Seed dữ liệu mẫu cho database
 * Xóa toàn bộ dữ liệu cũ (theo thứ tự dependency ngược) rồi insert dữ liệu demo
 * Bao gồm: chi nhánh, phòng, users, khách hàng, booking, khuyến mãi, đồ ăn, telegram
 */
async function seed() {
  console.log('🌱 Seeding database...');

  // ---- 1. Xóa dữ liệu cũ (thứ tự dependency ngược) ----
  console.log('  Clearing existing data...');
  await db.delete(notificationLog);
  await db.delete(bookings);
  await db.delete(rooms);
  await db.delete(branches);
  await db.delete(customers);
  await db.delete(users);
  await db.delete(promoCodes);
  await db.delete(telegramConfig);
  await db.delete(notificationTemplates);
  await db.delete(foodItems);
  console.log('  ✓ All tables cleared');

  // ---- 2. Chi nhánh ----
  console.log('  Inserting branches...');
  await db.insert(branches).values([
    { id: 'branch-ct', name: 'Cần Thơ', phone: '08xxxxxxxx', address: '08/245 Cần Thơ', district: 'Quận Ninh Kiều' },
    { id: 'branch-hcm', name: 'TP. Hồ Chí Minh', phone: '08xxxxxxxx', address: '08/245 Hồ Chí Minh', district: 'Quận 1' },
  ]);
  console.log('  ✓ 2 branches');

  // ---- 3. Phòng ----
  console.log('  Inserting rooms...');
  await db.insert(rooms).values([
    { id: 'g01', name: 'G01', type: 'standard', branchId: 'branch-ct', hourlyRate: 169000, dailyRate: 450000, overnightRate: 350000, extraHourRate: 40000 },
    { id: 'p102', name: 'P102', type: 'standard', branchId: 'branch-ct', hourlyRate: 169000, dailyRate: 450000, overnightRate: 350000, extraHourRate: 40000 },
    { id: 'p103', name: 'P103', type: 'standard', branchId: 'branch-ct', hourlyRate: 169000, dailyRate: 450000, overnightRate: 350000, extraHourRate: 40000 },
    { id: 'p104', name: 'P104', type: 'vip', branchId: 'branch-ct', hourlyRate: 210000, dailyRate: 550000, overnightRate: 450000, extraHourRate: 50000 },
    { id: 'p105', name: 'P105', type: 'vip', branchId: 'branch-ct', hourlyRate: 210000, dailyRate: 550000, overnightRate: 450000, extraHourRate: 50000 },
    { id: 'p106', name: 'P106', type: 'supervip', branchId: 'branch-ct', hourlyRate: 269000, dailyRate: 650000, overnightRate: 550000, extraHourRate: 60000 },
  ]);
  console.log('  ✓ 6 rooms');

  // ---- 4. Người dùng hệ thống ----
  console.log('  Inserting users...');
  // Tạo hash bcrypt với 12 salt rounds cho bảo mật
  const adminPasswordHash = bcrypt.hashSync('admin123', 12);
  const staffPasswordHash = bcrypt.hashSync('staff123', 12);
  await db.insert(users).values([
    { id: 'admin-001', username: 'admin', passwordHash: adminPasswordHash, role: 'admin', displayName: 'Administrator' },
    { id: 'staff-001', username: 'staff', passwordHash: staffPasswordHash, role: 'staff', displayName: 'Nhân viên' },
  ]);
  console.log('  ✓ 2 users');

  // ---- 5. Khách hàng ----
  console.log('  Inserting customers...');
  const customerData = [
    { id: 'c1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@gmail.com', note: 'VIP — Thích phòng yên tĩnh' },
    { id: 'c2', name: 'Trần Thị B', phone: '0912345678', email: 'tranthib@yahoo.com' },
    { id: 'c3', name: 'Lê Văn C', phone: '0987654321', email: 'levanc@gmail.com', note: 'VIP' },
    { id: 'c4', name: 'Phạm Thị D', phone: '0976543210' },
    { id: 'c5', name: 'Hoàng E', phone: '0965432109', email: 'hoange@gmail.com' },
  ];
  await db.insert(customers).values(customerData);
  console.log('  ✓ 5 customers');

  // ---- 6. Đặt phòng (30 bookings: 27 guest + 3 internal) ----
  console.log('  Inserting bookings...');

  // Gán khách hàng theo vòng lặp dựa trên index của booking
  const customerIds = ['c1', 'c2', 'c3', 'c4', 'c5'];
  const customerMap: Record<string, { name: string; phone: string }> = {
    c1: { name: 'Nguyễn Văn A', phone: '0901234567' },
    c2: { name: 'Trần Thị B', phone: '0912345678' },
    c3: { name: 'Lê Văn C', phone: '0987654321' },
    c4: { name: 'Phạm Thị D', phone: '0976543210' },
    c5: { name: 'Hoàng E', phone: '0965432109' },
  };

  function assignCustomer(bookingIndex: number) {
    const cid = customerIds[bookingIndex % customerIds.length];
    return { customerId: cid, guestName: customerMap[cid].name, guestPhone: customerMap[cid].phone };
  }

  await db.insert(bookings).values([
    // G01 — standard 169.000đ/giờ
    {
      id: '1', roomId: 'g01', date: '2026-03-20', startTime: '00:00', endTime: '02:30',
      status: 'checked-out', totalPrice: 422500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(0),
    },
    {
      id: '2', roomId: 'g01', date: '2026-03-20', startTime: '09:28', endTime: '10:15',
      status: 'confirmed', totalPrice: 132217, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(1),
    },
    {
      id: '3', roomId: 'g01', date: '2026-03-20', startTime: '12:45', endTime: '14:30',
      status: 'confirmed', totalPrice: 295750, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(2),
    },
    {
      id: '4', roomId: 'g01', date: '2026-03-20', startTime: '17:00', endTime: '18:00',
      status: 'confirmed', totalPrice: 169000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(3),
    },
    {
      id: '5', roomId: 'g01', date: '2026-03-20', startTime: '20:00', endTime: '21:30',
      status: 'pending', totalPrice: 253500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(4),
    },

    // P102 — standard 169.000đ/giờ
    {
      id: '6', roomId: 'p102', date: '2026-03-20', startTime: '00:00', endTime: '01:30',
      status: 'checked-out', totalPrice: 253500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(5),
    },
    {
      id: '7', roomId: 'p102', date: '2026-03-20', startTime: '09:15', endTime: '10:00',
      status: 'confirmed', totalPrice: 126750, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(6),
    },
    {
      id: '8', roomId: 'p102', date: '2026-03-20', startTime: '14:20', endTime: '15:20',
      status: 'confirmed', totalPrice: 169000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(7),
    },
    {
      id: '9', roomId: 'p102', date: '2026-03-20', startTime: '19:00', endTime: '21:12',
      status: 'pending', totalPrice: 373880, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(8),
    },

    // P103 — standard 169.000đ/giờ
    {
      id: '10', roomId: 'p103', date: '2026-03-20', startTime: '00:00', endTime: '00:00',
      status: 'checked-out', totalPrice: 0, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(9),
    },
    {
      id: '11', roomId: 'p103', date: '2026-03-20', startTime: '10:04', endTime: '11:00',
      status: 'confirmed', totalPrice: 157633, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(10),
    },
    {
      id: '12', roomId: 'p103', date: '2026-03-20', startTime: '13:15', endTime: '14:30',
      status: 'confirmed', totalPrice: 211250, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(11),
    },
    {
      id: '13', roomId: 'p103', date: '2026-03-20', startTime: '15:45', endTime: '17:00',
      status: 'confirmed', totalPrice: 211250, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(12),
    },
    {
      id: '14', roomId: 'p103', date: '2026-03-20', startTime: '20:00', endTime: '21:00',
      status: 'pending', totalPrice: 169000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(13),
    },

    // P104 — vip 210.000đ/giờ
    {
      id: '15', roomId: 'p104', date: '2026-03-20', startTime: '00:00', endTime: '00:00',
      status: 'checked-out', totalPrice: 0, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(14),
    },
    {
      id: '16', roomId: 'p104', date: '2026-03-20', startTime: '09:28', endTime: '10:30',
      status: 'confirmed', totalPrice: 217000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(15),
    },
    {
      id: '17', roomId: 'p104', date: '2026-03-20', startTime: '13:45', endTime: '15:00',
      status: 'confirmed', totalPrice: 262500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(16),
    },
    {
      id: '18', roomId: 'p104', date: '2026-03-20', startTime: '17:19', endTime: '18:00',
      status: 'confirmed', totalPrice: 143500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(17),
    },
    {
      id: '19', roomId: 'p104', date: '2026-03-20', startTime: '19:45', endTime: '21:00',
      status: 'pending', totalPrice: 262500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(18),
    },

    // P105 — vip 210.000đ/giờ
    {
      id: '20', roomId: 'p105', date: '2026-03-20', startTime: '00:00', endTime: '01:30',
      status: 'checked-out', totalPrice: 315000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(19),
    },
    {
      id: '21', roomId: 'p105', date: '2026-03-20', startTime: '11:36', endTime: '12:30',
      status: 'confirmed', totalPrice: 189000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(20),
    },
    {
      id: '22', roomId: 'p105', date: '2026-03-20', startTime: '17:15', endTime: '19:00',
      status: 'confirmed', totalPrice: 367500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(21),
    },
    {
      id: '23', roomId: 'p105', date: '2026-03-20', startTime: '21:00', endTime: '22:00',
      status: 'pending', totalPrice: 210000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(22),
    },

    // P106 — supervip 269.000đ/giờ
    {
      id: '24', roomId: 'p106', date: '2026-03-20', startTime: '00:00', endTime: '01:30',
      status: 'checked-out', totalPrice: 403500, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(23),
    },
    {
      id: '25', roomId: 'p106', date: '2026-03-20', startTime: '09:28', endTime: '10:30',
      status: 'confirmed', totalPrice: 278367, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(24),
    },
    {
      id: '26', roomId: 'p106', date: '2026-03-20', startTime: '15:30', endTime: '16:30',
      status: 'confirmed', totalPrice: 269000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(25),
    },
    {
      id: '27', roomId: 'p106', date: '2026-03-20', startTime: '17:30', endTime: '18:30',
      status: 'confirmed', totalPrice: 269000, category: 'guest',
      createdBy: 'admin-001', ...assignCustomer(26),
    },

    // Booking nội bộ (cleaning, maintenance, locked)
    {
      id: '28', roomId: 'g01', date: '2026-03-20', startTime: '08:00', endTime: '08:30',
      status: 'confirmed', totalPrice: 0, category: 'internal',
      internalTag: 'cleaning', internalNote: 'Dọn phòng sau check-out',
      createdBy: 'admin-001',
    },
    {
      id: '29', roomId: 'p102', date: '2026-03-20', startTime: '13:00', endTime: '15:00',
      status: 'confirmed', totalPrice: 0, category: 'internal',
      internalTag: 'maintenance', internalNote: 'Sửa điều hòa',
      createdBy: 'admin-001',
    },
    {
      id: '30', roomId: 'p104', date: '2026-03-21', startTime: '00:00', endTime: '23:59',
      status: 'confirmed', totalPrice: 0, category: 'internal',
      internalTag: 'locked', internalNote: 'Đang trang trí lại',
      createdBy: 'admin-001',
    },
  ]);
  console.log('  ✓ 30 bookings');

  // ---- 7. Mã khuyến mãi ----
  console.log('  Inserting promo codes...');
  await db.insert(promoCodes).values([
    {
      id: 'pr1', code: 'SUMMER20', discountType: 'percent', discountValue: 20,
      maxUses: 50, usedCount: 5, startDate: '2026-03-01', endDate: '2026-03-31',
      applicableRoomTypes: [], status: 'active',
    },
    {
      id: 'pr2', code: 'VIP50K', discountType: 'fixed', discountValue: 50000,
      maxUses: 20, usedCount: 12, startDate: '2026-03-01', endDate: '2026-04-15',
      applicableRoomTypes: ['vip', 'supervip'], status: 'active',
    },
    {
      id: 'pr3', code: 'TETHOLIDAY', discountType: 'percent', discountValue: 15,
      maxUses: 50, usedCount: 50, startDate: '2026-01-15', endDate: '2026-02-28',
      applicableRoomTypes: [], status: 'expired',
    },
  ]);
  console.log('  ✓ 3 promo codes');

  // ---- 8. Thức ăn và đồ uống ----
  console.log('  Inserting food items...');
  await db.insert(foodItems).values([
    { id: 'f1', name: 'Pepsi', price: 11000, category: 'item', sortOrder: 1 },
    { id: 'f2', name: 'Mỳ Ly', price: 20000, category: 'item', sortOrder: 2 },
    { id: 'f3', name: 'Sting', price: 15000, category: 'item', sortOrder: 3 },
    { id: 'f4', name: 'Pepsi (lon)', price: 115000, category: 'item', sortOrder: 4 },
    { id: 'f5', name: 'Mỳ Ly (hộp)', price: 20000, category: 'item', sortOrder: 5 },
    { id: 'f6', name: 'Sting (lon)', price: 15000, category: 'item', sortOrder: 6 },
    { id: 'fc1', name: '1 MỲ LY + 1 XÚC SÍCH + 1 SUỐI', price: 25000, category: 'combo', sortOrder: 10 },
    { id: 'fc2', name: '2 ÁO GIÁP', price: 20000, category: 'combo', sortOrder: 11 },
    { id: 'fc3', name: '1 SNACK + 1 SUỐI', price: 15000, category: 'combo', sortOrder: 12 },
  ]);
  console.log('  ✓ 9 food items');

  // ---- 9. Cấu hình Telegram (tắt mặc định) ----
  console.log('  Inserting telegram config...');
  await db.insert(telegramConfig).values([
    { id: 'default', botToken: '', chatId: '', enabled: false },
  ]);
  console.log('  ✓ 1 telegram config');

  // ---- 10. Mẫu thông báo Telegram ----
  console.log('  Inserting notification templates...');
  await db.insert(notificationTemplates).values([
    {
      id: 'tpl-new',
      eventType: 'new_booking',
      content: '🏠 Booking mới!\n\n👤 Khách: {{guestName}}\n📞 SĐT: {{guestPhone}}\n🚪 Phòng: {{roomName}}\n🕐 Giờ: {{startTime}} – {{endTime}}\n📅 Ngày: {{date}}\n💰 Giá: {{totalPrice}}\n🏷️ Mã KM: {{promoCode}}',
      isActive: true,
    },
    {
      id: 'tpl-confirm',
      eventType: 'confirmed',
      content: '✅ Đã xác nhận\n\n👤 {{guestName}}\n🚪 {{roomName}}\n📅 {{date}} {{startTime}}-{{endTime}}',
      isActive: true,
    },
    {
      id: 'tpl-checkin',
      eventType: 'checked_in',
      content: '🔑 Check-in\n\n👤 {{guestName}}\n🚪 {{roomName}}\n📅 {{date}} {{startTime}}',
      isActive: true,
    },
  ]);
  console.log('  ✓ 3 notification templates');

  console.log('✅ Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
