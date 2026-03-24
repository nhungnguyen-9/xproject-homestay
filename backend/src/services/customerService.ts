import { eq, or, ilike, sql, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { customers, bookings } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { normalizePhone } from '../utils/phone.js';

export async function getAll(search?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  if (search) {
    const q = `%${search}%`;
    return db.select().from(customers).where(
      or(
        ilike(customers.name, q),
        ilike(customers.phone, q),
        ilike(customers.email, q),
      ),
    ).limit(limit).offset(offset);
  }
  return db.select().from(customers).limit(limit).offset(offset);
}

export async function getById(id: string) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
}

export async function getStats(customerId: string) {
  const customer = await getById(customerId);

  // Get stats via aggregation on bookings joined by phone
  const [stats] = await db
    .select({
      totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.category} = 'guest' THEN ${bookings.totalPrice} ELSE 0 END), 0)`,
      visitCount: sql<number>`COUNT(CASE WHEN ${bookings.category} = 'guest' AND ${bookings.status} = 'checked-out' THEN 1 END)`,
      lastVisit: sql<string>`MAX(CASE WHEN ${bookings.category} = 'guest' THEN ${bookings.date} END)`,
    })
    .from(bookings)
    .where(eq(bookings.customerId, customerId));

  return {
    ...customer,
    totalSpent: Number(stats?.totalSpent || 0),
    visitCount: Number(stats?.visitCount || 0),
    lastVisit: stats?.lastVisit || '',
  };
}

export async function getAllWithStats(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const allCustomers = await db.select().from(customers).limit(limit).offset(offset);

  // Single query to get stats for all customers
  const statsRows = await db
    .select({
      customerId: bookings.customerId,
      totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.category} = 'guest' THEN ${bookings.totalPrice} ELSE 0 END), 0)`,
      visitCount: sql<number>`COUNT(CASE WHEN ${bookings.category} = 'guest' AND ${bookings.status} = 'checked-out' THEN 1 END)`,
      lastVisit: sql<string>`MAX(CASE WHEN ${bookings.category} = 'guest' THEN ${bookings.date} END)`,
    })
    .from(bookings)
    .where(sql`${bookings.customerId} IS NOT NULL`)
    .groupBy(bookings.customerId);

  const statsMap = new Map(statsRows.map(s => [s.customerId, s]));

  return allCustomers.map(c => {
    const s = statsMap.get(c.id);
    return {
      ...c,
      totalSpent: Number(s?.totalSpent || 0),
      visitCount: Number(s?.visitCount || 0),
      lastVisit: s?.lastVisit || '',
    };
  });
}

export async function create(data: { name: string; phone: string; email?: string; note?: string }) {
  const normalized = normalizePhone(data.phone);

  // Check for duplicate phone
  const [existing] = await db.select().from(customers).where(eq(customers.phone, normalized)).limit(1);
  if (existing) {
    throw new AppError(409, 'A customer with this phone number already exists');
  }

  const [customer] = await db.insert(customers).values({
    ...data,
    phone: normalized,
  }).returning();

  return customer;
}

export async function update(id: string, data: Partial<{ name: string; phone: string; email: string; note: string }>) {
  if (data.phone) {
    data.phone = normalizePhone(data.phone);
  }

  const [customer] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();

  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
}
