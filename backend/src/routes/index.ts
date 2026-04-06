import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { roomRoutes } from './rooms.js';
import { bookingRoutes } from './bookings.js';
import { customerRoutes } from './customers.js';
import { promoRoutes } from './promos.js';
import { telegramRoutes } from './telegram.js';
import { revenueRoutes } from './revenue.js';
import { foodItemRoutes } from './foodItems.js';
import { branchRoutes } from './branches.js';
import { usersRouter } from './users.js';

/** Gom tất cả router con vào /api/v1/* */
const apiRoutes = new Hono();

apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/rooms', roomRoutes);
apiRoutes.route('/bookings', bookingRoutes);
apiRoutes.route('/customers', customerRoutes);
apiRoutes.route('/promos', promoRoutes);
apiRoutes.route('/telegram', telegramRoutes);
apiRoutes.route('/revenue', revenueRoutes);
apiRoutes.route('/food-items', foodItemRoutes);
apiRoutes.route('/branches', branchRoutes);
apiRoutes.route('/users', usersRouter);

export { apiRoutes };
