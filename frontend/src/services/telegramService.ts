import type { Booking } from '@/types/schedule';

const CONFIG_KEY = 'nhacam_telegram_config';
const TEMPLATE_KEY = 'nhacam_telegram_template';
const LOG_KEY = 'nhacam_telegram_log';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface NotificationLogEntry {
  id: string;
  timestamp: string;
  event: string;
  guestName: string;
  roomName: string;
  status: 'sent' | 'simulated' | 'skipped';
}

const DEFAULT_TEMPLATE = `🏠 Booking mới!

👤 Khách: {{guestName}}
📞 SĐT: {{guestPhone}}
🚪 Phòng: {{roomName}}
🕐 Giờ: {{startTime}} – {{endTime}}
📅 Ngày: {{date}}
💰 Giá: {{totalPrice}}
🏷️ Mã KM: {{promoCode}}`;

export function init(): void {
  // Seed default template if not set
  if (!localStorage.getItem(TEMPLATE_KEY)) {
    localStorage.setItem(TEMPLATE_KEY, DEFAULT_TEMPLATE);
  }
  // Initialize empty log if not set
  if (!localStorage.getItem(LOG_KEY)) {
    localStorage.setItem(LOG_KEY, JSON.stringify([]));
  }
}

export function getConfig(): TelegramConfig | null {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
}

export function saveConfig(config: TelegramConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getTemplate(): string {
  const stored = localStorage.getItem(TEMPLATE_KEY);
  return stored || DEFAULT_TEMPLATE;
}

export function saveTemplate(template: string): void {
  localStorage.setItem(TEMPLATE_KEY, template);
}

function renderTemplate(
  booking: Booking,
  roomName: string,
): string {
  const template = getTemplate();
  return template
    .replace(/\{\{guestName\}\}/g, booking.guestName || 'N/A')
    .replace(/\{\{guestPhone\}\}/g, booking.guestPhone || 'N/A')
    .replace(/\{\{roomName\}\}/g, roomName)
    .replace(/\{\{startTime\}\}/g, booking.startTime)
    .replace(/\{\{endTime\}\}/g, booking.endTime)
    .replace(/\{\{date\}\}/g, booking.date)
    .replace(/\{\{totalPrice\}\}/g, booking.totalPrice.toLocaleString('vi-VN') + 'đ')
    .replace(/\{\{promoCode\}\}/g, booking.voucher || 'Không có')
    .replace(/\{\{status\}\}/g, booking.status);
}

function loadLog(): NotificationLogEntry[] {
  const stored = localStorage.getItem(LOG_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

function saveLog(log: NotificationLogEntry[]): void {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function notify(
  booking: Booking,
  event: string,
  roomName: string,
): void {
  // Skip notifications for internal bookings, cancellations, check-outs
  const skipEvents = ['cancelled', 'checked_out'];
  if (booking.category === 'internal' || skipEvents.includes(event)) {
    const log = loadLog();
    log.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      event,
      guestName: booking.guestName || 'N/A',
      roomName,
      status: 'skipped',
    });
    saveLog(log);
    return;
  }

  // Render template (for logging purposes)
  renderTemplate(booking, roomName);

  const config = getConfig();
  const log = loadLog();

  log.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    event,
    guestName: booking.guestName || 'N/A',
    roomName,
    status: config ? 'simulated' : 'simulated',
  });

  saveLog(log);
}

export function getLog(): NotificationLogEntry[] {
  return loadLog();
}

export function sendTest(): void {
  const log = loadLog();
  log.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'test',
    guestName: 'Test User',
    roomName: 'Test Room',
    status: 'simulated',
  });
  saveLog(log);
}
