import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(11),
  email: z.string().email().optional().or(z.literal('')),
  note: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
