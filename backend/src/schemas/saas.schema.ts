import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Nombre del plan obligatorio'),
  max_warehouses: z.number().int().positive(),
  max_users: z.number().int().positive(),
  max_storage_m3: z.number().positive(),
  price_monthly: z.number().nonnegative(),
  currency: z.string().default('CLP'),
});

export const updatePlanSchema = createPlanSchema.partial();

export const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  tax_id: z.string().min(3).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const upgradeSubscriptionSchema = z.object({
  plan_id: z.string().uuid('ID de plan inválido'),
});
