import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createBookingSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'End time must be HH:mm'),
  mode: z.enum(['hourly', 'daily', 'overnight']).default('hourly'),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']).default('pending'),
  category: z.enum(['guest', 'internal']).default('guest'),
  internalTag: z.enum(['cleaning', 'maintenance', 'locked', 'custom']).optional(),
  internalNote: z.string().optional(),
  note: z.string().optional(),
  adults: z.number().int().min(1).default(2),
  foodItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    qty: z.number().int().min(1).optional(),
  })).default([]),
  totalPrice: z.number().int().min(0).default(0),
  voucher: z.string().optional(),
});

export const updateBookingSchema = createBookingSchema.partial();

export const statusTransitionSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']),
});

export const checkOverlapSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(dateRegex),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  excludeId: z.string().optional(),
});
