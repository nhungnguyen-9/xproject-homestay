import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createPromoSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and digits'),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().int().min(1),
  applicableRoomTypes: z.array(z.enum(['standard', 'vip', 'supervip'])).default([]),
  maxUses: z.number().int().min(1),
  startDate: z.string().regex(dateRegex),
  endDate: z.string().regex(dateRegex),
  status: z.enum(['active', 'expired', 'disabled']).default('active'),
});

export const updatePromoSchema = createPromoSchema.partial();

export const validatePromoSchema = z.object({
  code: z.string().min(1),
  roomType: z.enum(['standard', 'vip', 'supervip']),
});

export const applyPromoSchema = z.object({
  code: z.string().min(1),
  roomType: z.enum(['standard', 'vip', 'supervip']),
  originalPrice: z.number().int().min(0),
});
