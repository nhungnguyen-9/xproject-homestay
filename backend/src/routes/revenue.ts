import { Hono } from 'hono';
import * as revenueService from '../services/revenueService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

const revenue = new Hono();

revenue.use('*', authMiddleware);
revenue.use('*', adminOnly);

// GET /revenue/summary
revenue.get('/summary', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const result = await revenueService.getSummary(startDate, endDate);
  return c.json(result);
});

// GET /revenue/daily
revenue.get('/daily', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const result = await revenueService.getDailyRevenue(startDate, endDate);
  return c.json(result);
});

// GET /revenue/occupancy
revenue.get('/occupancy', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const result = await revenueService.getOccupancy(startDate, endDate);
  return c.json(result);
});

// GET /revenue/top-customers
revenue.get('/top-customers', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 5;
  const result = await revenueService.getTopCustomers(startDate, endDate, limit);
  return c.json(result);
});

export { revenue as revenueRoutes };
