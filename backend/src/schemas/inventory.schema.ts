import { z } from 'zod';

export const inboundStockSchema = z.object({
  product_id: z.string().uuid('ID de producto inválido'),
  storage_location_id: z.string().uuid('ID de ubicación inválido'),
  client_owner_id: z.string().uuid().optional(),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  lot_number: z.string().optional(),
  expiration_date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  occupancy_type: z.enum(['PALLET', 'BOXES', 'LOOSE_ITEMS']).default('BOXES'),
  occupied_m3: z.number().nonnegative(),
});

export const relocateStockSchema = z.object({
  inventory_item_id: z.string().uuid('ID de item inválido'),
  destination_location_id: z.string().uuid('ID de ubicación destino inválido'),
  quantity: z.number().int().positive('Cantidad a reubicar inválida'),
});

export const outboundStockSchema = z.object({
  inventory_item_id: z.string().uuid('ID de item inválido'),
  quantity: z.number().int().positive('Cantidad a despachar inválida'),
  reason: z.string().optional(),
});
