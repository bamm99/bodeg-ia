import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2, 'Nombre de sucursal requerido'),
  address: z.string().optional(),
});

export const createWarehouseSchema = z.object({
  branch_id: z.string().uuid().optional(),
  name: z.string().min(2, 'Nombre de bodega requerido'),
  code: z.string().min(2, 'Código de bodega requerido (ej: BOD-01)'),
  map_layout_json: z.record(z.any()).optional(),
  is_cost_tracking_enabled: z.boolean().default(false),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const createZoneSchema = z.object({
  warehouse_id: z.string().uuid('ID de bodega inválido'),
  name: z.string().min(2, 'Nombre de zona requerido'),
  turnover_rate: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
});

export const updateZoneSchema = createZoneSchema.partial();

export const createAisleSchema = z.object({
  zone_id: z.string().uuid('ID de zona inválido'),
  name: z.string().min(1, 'Nombre de pasillo requerido'),
});

export const createRackSchema = z.object({
  aisle_id: z.string().uuid('ID de pasillo inválido'),
  code: z.string().min(2, 'Código de repisa requerido (ej: REP-A1)'),
  position_x: z.number().int().default(0),
  position_y: z.number().int().default(0),
  width_units: z.number().int().positive().default(1),
  length_units: z.number().int().positive().default(1),
  rotation_deg: z.number().int().default(0),
});

export const updateRackPositionSchema = z.object({
  position_x: z.number().int(),
  position_y: z.number().int(),
  rotation_deg: z.number().int().optional(),
});

export const createLevelSchema = z.object({
  rack_id: z.string().uuid('ID de repisa inválido'),
  level_number: z.number().int().positive(),
  height_cm: z.number().positive().optional(),
  width_cm: z.number().positive().optional(),
  depth_cm: z.number().positive().optional(),
  max_weight_kg: z.number().positive().optional(),
});

export const createStorageLocationSchema = z.object({
  level_id: z.string().uuid('ID de nivel inválido'),
  code: z.string().min(2, 'Código de casillero requerido (ej: A1-N1-POS1)'),
  max_weight_kg: z.number().positive().optional(),
  total_volume_m3: z.number().nonnegative(),
});
