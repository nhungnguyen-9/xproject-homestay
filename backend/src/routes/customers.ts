import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as customerService from '../services/customerService.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

const customersRouter = new Hono();

customersRouter.use('*', authMiddleware);

// GET /customers
customersRouter.get('/', async (c) => {
  const search = c.req.query('search');
  const withStats = c.req.query('stats') === 'true';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));

  if (withStats) {
    const result = await customerService.getAllWithStats(page, limit);
    return c.json(result);
  }

  const result = await customerService.getAll(search, page, limit);
  return c.json(result);
});

// GET /customers/:id
customersRouter.get('/:id', async (c) => {
  const customer = await customerService.getById(c.req.param('id'));
  return c.json(customer);
});

// GET /customers/:id/stats
customersRouter.get('/:id/stats', async (c) => {
  const stats = await customerService.getStats(c.req.param('id'));
  return c.json(stats);
});

// POST /customers
customersRouter.post('/', zValidator('json', createCustomerSchema), async (c) => {
  const data = c.req.valid('json');
  const customer = await customerService.create(data);
  return c.json(customer, 201);
});

// PUT /customers/:id — admin only
customersRouter.put('/:id', adminOnly, zValidator('json', updateCustomerSchema), async (c) => {
  const data = c.req.valid('json');
  const customer = await customerService.update(c.req.param('id'), data);
  return c.json(customer);
});

export { customersRouter as customerRoutes };
