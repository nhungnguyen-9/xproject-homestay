import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRoutes } from './routes/index.js';

const app = new Hono();

/** Middleware toàn cục: logger + CORS */
app.use('*', logger());
app.use('*', cors({
  origin: env.CORS_ORIGIN,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/** Endpoint kiểm tra sức khỏe server */
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

/** Gắn tất cả API routes vào prefix /api/v1 */
app.route('/api/v1', apiRoutes);

app.onError(errorHandler);
app.notFound((c) => c.json({ error: 'Not found' }, 404));

export { app };
