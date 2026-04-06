import { pgTable, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Bảng notification_log — Lịch sử gửi thông báo Telegram
 *
 * Columns chính:
 * - timestamp: thời điểm gửi (có index để truy vấn theo thời gian)
 * - eventType: loại sự kiện booking đã trigger thông báo
 * - status: kết quả gửi ('sent' | 'simulated' | 'failed'), có CHECK constraint
 * - messageContent: nội dung tin nhắn đã gửi
 * - errorMessage: thông báo lỗi (chỉ khi status = 'failed')
 */
export const notificationLog = pgTable('notification_log', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  eventType: text('event_type').notNull(),
  guestName: text('guest_name'),
  roomId: text('room_id'),
  status: text('status').notNull(),
  messageContent: text('message_content'),
  errorMessage: text('error_message'),
}, (table) => [
  index('idx_notif_log_time').on(table.timestamp),
  check('notification_log_status_check', sql`${table.status} IN ('sent', 'simulated', 'failed')`),
]);
