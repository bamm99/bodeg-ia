import { z } from 'zod';

export const createRoleSchema = z.object({
  code: z.string().min(2, 'Código de rol requerido (ej: OPERATOR)'),
  name: z.string().min(2, 'Nombre descriptivo del rol requerido'),
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = createRoleSchema.partial();

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña de al menos 6 caracteres'),
  full_name: z.string().min(2, 'Nombre completo requerido'),
  role_id: z.string().uuid('ID de rol inválido'),
  primary_company_id: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  role_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

export const assignWarehouseSchema = z.object({
  warehouse_id: z.string().uuid('ID de bodega inválido'),
  access_level: z.enum(['FULL', 'READ_ONLY', 'ASSIGNED_TASKS_ONLY']).default('FULL'),
});
