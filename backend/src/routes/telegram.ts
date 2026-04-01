import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as telegramService from '../services/telegramService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

/** Router cấu hình Telegram thông báo — yêu cầu xác thực */
const telegram = new Hono();

telegram.use('*', authMiddleware);

/** Schema cập nhật cấu hình Telegram bot */
const configSchema = z.object({
  botToken: z.string().optional(),
  chatId: z.string().optional(),
  enabled: z.boolean().optional(),
});

/** Schema cập nhật template thông báo */
const templateSchema = z.object({
  content: z.string().optional(),
  isActive: z.boolean().optional(),
});

/** GET /telegram/config — lấy cấu hình bot */
telegram.get('/config', async (c) => {
  const config = await telegramService.getConfig();
  return c.json(config);
});

/** PUT /telegram/config — cập nhật cấu hình bot (chỉ admin) */
telegram.put('/config', adminOnly, zValidator('json', configSchema), async (c) => {
  const data = c.req.valid('json');
  const config = await telegramService.updateConfig(data);
  return c.json(config);
});

/** GET /telegram/templates — danh sách template thông báo */
telegram.get('/templates', async (c) => {
  const templates = await telegramService.getTemplates();
  return c.json(templates);
});

/** PUT /telegram/templates/:eventType — cập nhật template (chỉ admin) */
telegram.put('/templates/:eventType', adminOnly, zValidator('json', templateSchema), async (c) => {
  const data = c.req.valid('json');
  const template = await telegramService.updateTemplate(c.req.param('eventType'), data);
  return c.json(template);
});

/** POST /telegram/test — gửi tin nhắn test (chỉ admin) */
telegram.post('/test', adminOnly, async (c) => {
  const result = await telegramService.sendTest();
  return c.json(result);
});

/** GET /telegram/log — lịch sử gửi thông báo có phân trang */
telegram.get('/log', async (c) => {
  const page = c.req.query('page') ? Number(c.req.query('page')) : 1;
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 20;
  const result = await telegramService.getLog(page, limit);
  return c.json(result);
});

export { telegram as telegramRoutes };
