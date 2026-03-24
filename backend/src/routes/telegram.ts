import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as telegramService from '../services/telegramService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

const telegram = new Hono();

telegram.use('*', authMiddleware);

const configSchema = z.object({
  botToken: z.string().optional(),
  chatId: z.string().optional(),
  enabled: z.boolean().optional(),
});

const templateSchema = z.object({
  content: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /telegram/config
telegram.get('/config', async (c) => {
  const config = await telegramService.getConfig();
  return c.json(config);
});

// PUT /telegram/config — admin only
telegram.put('/config', adminOnly, zValidator('json', configSchema), async (c) => {
  const data = c.req.valid('json');
  const config = await telegramService.updateConfig(data);
  return c.json(config);
});

// GET /telegram/templates
telegram.get('/templates', async (c) => {
  const templates = await telegramService.getTemplates();
  return c.json(templates);
});

// PUT /telegram/templates/:eventType — admin only
telegram.put('/templates/:eventType', adminOnly, zValidator('json', templateSchema), async (c) => {
  const data = c.req.valid('json');
  const template = await telegramService.updateTemplate(c.req.param('eventType'), data);
  return c.json(template);
});

// POST /telegram/test
telegram.post('/test', adminOnly, async (c) => {
  const result = await telegramService.sendTest();
  return c.json(result);
});

// GET /telegram/log
telegram.get('/log', async (c) => {
  const page = c.req.query('page') ? Number(c.req.query('page')) : 1;
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 20;
  const result = await telegramService.getLog(page, limit);
  return c.json(result);
});

export { telegram as telegramRoutes };
