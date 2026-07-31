import { z } from 'zod';

export const createCostProfileSchema = z
  .object({
    zone_id: z.string().uuid().optional(),
    rack_id: z.string().uuid().optional(),
    level_id: z.string().uuid().optional(),
    daily_base_cost: z.number().nonnegative(),
    currency: z.string().default('CLP'),
    turnover_multiplier: z.number().positive().default(1.0),
    maintenance_cost_daily: z.number().nonnegative().default(0.0),
    energy_cost_daily: z.number().nonnegative().default(0.0),
    seasonal_factor: z.number().positive().default(1.0),
    custom_formula_expression: z.string().optional(),
  })
  .refine(
    (data) => {
      const count = [data.zone_id, data.rack_id, data.level_id].filter(Boolean).length;
      return count === 1;
    },
    {
      message: 'Debe asociar el perfil de costos a EXACTAMENTE una entidad (zone_id, rack_id o level_id)',
      path: ['zone_id'],
    }
  );

export const simulateCostSchema = z.object({
  daily_base_cost: z.number().nonnegative(),
  turnover_multiplier: z.number().positive().default(1.0),
  maintenance_cost_daily: z.number().nonnegative().default(0.0),
  energy_cost_daily: z.number().nonnegative().default(0.0),
  seasonal_factor: z.number().positive().default(1.0),
  occupied_volume_m3: z.number().nonnegative().default(0.0),
  total_volume_m3: z.number().positive().default(1.0),
  custom_formula_expression: z.string().optional(),
});
