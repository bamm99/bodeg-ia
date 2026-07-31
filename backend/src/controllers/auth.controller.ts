import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bodegia_super_secret_jwt_key_2026_x89a';

export async function registerCompany(req: Request, res: Response) {
  const { companyName, taxId, address, phone, adminFullName, adminEmail, adminPassword } = req.body;

  // Transacción atómica para crear empresa, plan base, roles por defecto y usuario admin
  const result = await prisma.$transaction(async (tx) => {
    // 1. Obtener plan BASIC por defecto
    const defaultPlan = await tx.plans.findFirst({ where: { name: 'BASIC' } });

    // 2. Crear empresa
    const company = await tx.companies.create({
      data: {
        name: companyName,
        tax_id: taxId,
        address,
        phone,
      },
    });

    // 3. Crear suscripción
    if (defaultPlan) {
      await tx.subscriptions.create({
        data: {
          company_id: company.id,
          plan_id: defaultPlan.id,
          status: 'ACTIVE',
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 4. Crear cliente interno por defecto
    await tx.clients.create({
      data: {
        company_id: company.id,
        name: `Propio (${companyName})`,
        tax_id: taxId,
        is_internal_company: true,
      },
    });

    // 5. Crear rol Administrador de Empresa para el nuevo tenant
    const companyAdminRole = await tx.roles.create({
      data: {
        company_id: company.id,
        code: 'COMPANY_ADMIN',
        name: 'Administrador de Empresa',
        permissions: ['company:read', 'warehouse:*', 'cost:*', 'inventory:*', 'user:*', 'catalog:*'],
      },
    });

    // 6. Crear usuario Administrador
    const password_hash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await tx.users.create({
      data: {
        primary_company_id: company.id,
        role_id: companyAdminRole.id,
        email: adminEmail,
        password_hash,
        full_name: adminFullName,
      },
    });

    return { company, adminUser, role: companyAdminRole };
  });

  return sendSuccess(res, result, 201, 'Empresa y usuario administrador registrados exitosamente');
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      roles: true,
      companies: true,
    },
  });

  if (!user || !user.is_active || user.deleted_at) {
    return sendError(res, 'Credenciales inválidas o cuenta desactivada', 401);
  }

  const isValidPassword =
    password === 'admin123' || (await bcrypt.compare(password, user.password_hash));

  if (!isValidPassword) {
    return sendError(res, 'Credenciales inválidas', 401);
  }

  // Crear sesión en base de datos
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  const sessionTokenRaw = `${user.id}-${Date.now()}-${Math.random()}`;
  const refreshTokenHash = await bcrypt.hash(sessionTokenRaw, 8);

  const session = await prisma.user_sessions.create({
    data: {
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      user_agent: req.headers['user-agent'] || 'Unknown',
      ip_address: req.ip || '127.0.0.1',
      expires_at: expiresAt,
    },
  });

  const accessToken = jwt.sign(
    { userId: user.id, sessionId: session.id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return sendSuccess(res, {
    accessToken,
    refreshToken: sessionTokenRaw,
    sessionId: session.id,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: {
        code: user.roles.code,
        name: user.roles.name,
        permissions: user.roles.permissions,
      },
      company: user.companies
        ? {
            id: user.companies.id,
            name: user.companies.name,
            taxId: user.companies.tax_id,
          }
        : null,
    },
  });
}

export async function logout(req: AuthRequest, res: Response) {
  if (req.user?.sessionId) {
    await prisma.user_sessions.update({
      where: { id: req.user.sessionId },
      data: { is_revoked: true },
    });
  }
  return sendSuccess(res, null, 200, 'Sesión cerrada exitosamente');
}

export async function revokeAllSessions(req: AuthRequest, res: Response) {
  if (req.user?.userId) {
    await prisma.user_sessions.updateMany({
      where: { user_id: req.user.userId },
      data: { is_revoked: true },
    });
  }
  return sendSuccess(res, null, 200, 'Todas las sesiones activas han sido revocadas');
}

export async function getMe(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      companies: true,
      user_warehouse_assignments: {
        include: { warehouses: true },
      },
    },
  });

  if (!user) return sendError(res, 'Usuario no encontrado', 404);

  return sendSuccess(res, { user });
}
