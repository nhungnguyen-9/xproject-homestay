import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const telegramConfig = pgTable('telegram_config', {
  id: text('id').primaryKey().default('default'),
  botToken: text('bot_token').default('').notNull(),
  chatId: text('chat_id').default('').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notificationTemplates = pgTable('notification_templates', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull().unique(),
  // 'new_booking' | 'confirmed' | 'checked_in'
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
