import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.enum(['standard', 'vip', 'supervip']),
  branchId: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).max(5).default([]),
  maxGuests: z.number().int().min(1).default(2),
  amenities: z.array(z.string()).default([]),
  hourlyRate: z.number().int().min(0),
  dailyRate: z.number().int().min(0),
  overnightRate: z.number().int().min(0),
  extraHourRate: z.number().int().min(0),
});

export const updateRoomSchema = createRoomSchema.partial();
