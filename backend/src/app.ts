import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRoutes } from './routes/index.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: env.CORS_ORIGIN,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.route('/api/v1', apiRoutes);

// Error handler
app.onError(errorHandler);

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

export { app };
