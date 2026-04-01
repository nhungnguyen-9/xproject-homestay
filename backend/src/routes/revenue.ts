import { Hono } from 'hono';
import * as revenueService from '../services/revenueService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

/** Router báo cáo doanh thu — chỉ admin được truy cập */
const revenue = new Hono();

revenue.use('*', authMiddleware);
revenue.use('*', adminOnly);

/** GET /revenue/summary — tổng hợp doanh thu + so sánh kỳ trước */
revenue.get('/summary', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const result = await revenueService.getSummary(startDate, endDate);
  return c.json(result);
});

/** GET /revenue/daily — doanh thu theo ngày (cho biểu đồ) */
revenue.get('/daily', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const result = await revenueService.getDailyRevenue(startDate, endDate);
  return c.json(result);
});

/** GET /revenue/occupancy — công suất sử dụng phòng */
revenue.get('/occupancy', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const result = await revenueService.getOccupancy(startDate, endDate);
  return c.json(result);
});

/** GET /revenue/top-customers — top khách hàng chi tiêu nhiều nhất */
revenue.get('/top-customers', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 5;
  const result = await revenueService.getTopCustomers(startDate, endDate, limit);
  return c.json(result);
});

export { revenue as revenueRoutes };
