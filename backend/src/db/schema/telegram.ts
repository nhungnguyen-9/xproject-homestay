import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Bảng telegram_config — Cấu hình Telegram bot (singleton, chỉ 1 row id='default')
 *
 * Columns chính:
 * - botToken: token của bot Telegram
 * - chatId: ID chat/group nhận thông báo
 * - enabled: bật/tắt toàn bộ thông báo
 */
export const telegramConfig = pgTable('telegram_config', {
  id: text('id').primaryKey().default('default'),
  botToken: text('bot_token').default('').notNull(),
  chatId: text('chat_id').default('').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Bảng notification_templates — Mẫu thông báo Telegram theo sự kiện
 *
 * Columns chính:
 * - eventType: loại sự kiện ('new_booking' | 'confirmed' | 'checked_in'), unique
 * - content: nội dung template, hỗ trợ placeholder mustache ({{guestName}}, {{roomName}}, v.v.)
 * - isActive: bật/tắt thông báo theo từng loại sự kiện
 */
export const notificationTemplates = pgTable('notification_templates', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull().unique(),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
