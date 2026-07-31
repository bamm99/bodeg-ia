import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerCompanySchema = z.object({
  companyName: z.string().min(2, 'El nombre de la empresa es obligatorio'),
  taxId: z.string().min(3, 'El RUT / ID fiscal es obligatorio'),
  address: z.string().optional(),
  phone: z.string().optional(),
  adminFullName: z.string().min(2, 'El nombre del administrador es obligatorio'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh Token requerido'),
});
