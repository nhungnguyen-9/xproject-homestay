import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { telegramConfig, notificationTemplates } from '../db/schema/index.js';
import { notificationLog } from '../db/schema/notificationLog.js';
import { AppError } from '../middleware/errorHandler.js';

/** Lấy cấu hình Telegram bot (singleton, id='default') */
export async function getConfig() {
  const [config] = await db.select().from(telegramConfig).where(eq(telegramConfig.id, 'default')).limit(1);
  return config || { id: 'default', botToken: '', chatId: '', enabled: false };
}

/** Cập nhật cấu hình Telegram — upsert (tạo nếu chưa có) */
export async function updateConfig(data: { botToken?: string; chatId?: string; enabled?: boolean }) {
  const [config] = await db
    .insert(telegramConfig)
    .values({
      id: 'default',
      botToken: data.botToken || '',
      chatId: data.chatId || '',
      enabled: data.enabled ?? false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: telegramConfig.id,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();

  return config;
}

/** Lấy tất cả template thông báo */
export async function getTemplates() {
  return db.select().from(notificationTemplates);
}

/** Lấy template theo loại sự kiện (new_booking, confirmed, checked_in, ...) */
export async function getTemplate(eventType: string) {
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.eventType, eventType))
    .limit(1);
  return template;
}

/** Cập nhật nội dung hoặc trạng thái template thông báo */
export async function updateTemplate(eventType: string, data: { content?: string; isActive?: boolean }) {
  const [template] = await db
    .update(notificationTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notificationTemplates.eventType, eventType))
    .returning();
  if (!template) throw new AppError(404, 'Template not found');
  return template;
}

/** Thay thế placeholder {{key}} trong template bằng giá trị thực */
function renderTemplate(
  templateContent: string,
  vars: Record<string, string>,
): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/** Gửi tin nhắn qua Telegram Bot API — trả true nếu thành công */
async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

/**
 * Gửi thông báo Telegram cho sự kiện booking
 * Nếu Telegram chưa cấu hình → ghi log dạng 'simulated'
 * Nếu template không tồn tại hoặc tắt → bỏ qua
 * @param eventType - Loại sự kiện (new_booking, confirmed, checked_in, ...)
 * @param vars - Biến thay thế cho template (guestName, roomName, ...)
 * @param roomId - ID phòng (ghi log)
 */
export async function notify(
  eventType: string,
  vars: Record<string, string>,
  roomId?: string,
) {
  const config = await getConfig();
  const template = await getTemplate(eventType);

  if (!template || !template.isActive) {
    // Log as skipped
    await db.insert(notificationLog).values({
      eventType,
      guestName: vars.guestName || null,
      roomId: roomId || null,
      status: 'simulated',
      messageContent: 'Template not found or inactive',
    });
    return;
  }

  const message = renderTemplate(template.content, vars);

  if (!config.enabled || !config.botToken || !config.chatId) {
    await db.insert(notificationLog).values({
      eventType,
      guestName: vars.guestName || null,
      roomId: roomId || null,
      status: 'simulated',
      messageContent: message,
    });
    return;
  }

  const success = await sendTelegramMessage(config.botToken, config.chatId, message);

  await db.insert(notificationLog).values({
    eventType,
    guestName: vars.guestName || null,
    roomId: roomId || null,
    status: success ? 'sent' : 'failed',
    messageContent: message,
    errorMessage: success ? null : 'Telegram API call failed',
  });
}

/** Gửi tin nhắn test qua Telegram — dùng để kiểm tra cấu hình bot */
export async function sendTest() {
  const config = await getConfig();

  const testMessage = '🧪 Test notification from Chốn Cinehome!';

  if (!config.enabled || !config.botToken || !config.chatId) {
    await db.insert(notificationLog).values({
      eventType: 'test',
      guestName: 'Test User',
      status: 'simulated',
      messageContent: testMessage,
    });
    return { status: 'simulated', message: 'Telegram not configured, notification simulated' };
  }

  const success = await sendTelegramMessage(config.botToken, config.chatId, testMessage);

  await db.insert(notificationLog).values({
    eventType: 'test',
    guestName: 'Test User',
    status: success ? 'sent' : 'failed',
    messageContent: testMessage,
    errorMessage: success ? null : 'Telegram API call failed',
  });

  return {
    status: success ? 'sent' : 'failed',
    message: success ? 'Test notification sent' : 'Failed to send test notification',
  };
}

/** Lấy lịch sử thông báo có phân trang — sắp xếp mới nhất trước */
export async function getLog(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db.select().from(notificationLog).orderBy(desc(notificationLog.timestamp)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(notificationLog),
  ]);

  const total = Number(countResult[0].count);
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
