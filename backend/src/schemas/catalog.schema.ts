import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nombre de cliente requerido'),
  tax_id: z.string().optional(),
  is_internal_company: z.boolean().default(false),
});

export const createProductSchema = z.object({
  sku: z.string().min(2, 'SKU de producto requerido'),
  name: z.string().min(2, 'Nombre de producto requerido'),
  unit_weight_kg: z.number().nonnegative().default(0.0),
  unit_volume_m3: z.number().nonnegative().default(0.0),
  is_palletized: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();
