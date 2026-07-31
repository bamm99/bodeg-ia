import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

// --- ROLES ---
export async function getRoles(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const roles = await prisma.roles.findMany({
    where: {
      OR: [{ is_system_role: true }, { company_id: companyId }],
    },
  });
  return sendSuccess(res, roles);
}

export async function createRole(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const { code, name, permissions } = req.body;

  const role = await prisma.roles.create({
    data: {
      company_id: companyId,
      code,
      name,
      permissions: permissions || [],
      is_system_role: false,
    },
  });

  return sendSuccess(res, role, 201, 'Rol personalizado creado exitosamente');
}

export async function updateRole(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const role = await prisma.roles.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, role, 200, 'Rol actualizado');
}

export async function deleteRole(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.roles.delete({ where: { id } });
  return sendSuccess(res, null, 200, 'Rol eliminado');
}

// --- USUARIOS ---
export async function getUsers(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where: {
        primary_company_id: companyId,
        deleted_at: null,
      },
      include: {
        roles: true,
        user_warehouse_assignments: { include: { warehouses: true } },
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.users.count({
      where: {
        primary_company_id: companyId,
        deleted_at: null,
      },
    }),
  ]);

  return sendPaginated(res, users, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function createUser(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const { email, password, full_name, role_id } = req.body;

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      primary_company_id: companyId,
      role_id,
      email,
      password_hash,
      full_name,
    },
  });

  return sendSuccess(res, user, 201, 'Usuario creado exitosamente');
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const user = await prisma.users.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, user, 200, 'Usuario actualizado');
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.users.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
  return sendSuccess(res, null, 200, 'Usuario eliminado (soft-delete)');
}

// --- ASIGNACIÓN DE BODEGAS ---
export async function assignWarehouseToUser(req: AuthRequest, res: Response) {
  const { userId } = req.params;
  const { warehouse_id, access_level } = req.body;

  const assignment = await prisma.user_warehouse_assignments.upsert({
    where: {
      user_id_warehouse_id: {
        user_id: userId,
        warehouse_id,
      },
    },
    update: { access_level },
    create: {
      user_id: userId,
      warehouse_id,
      access_level: access_level || 'FULL',
    },
  });

  return sendSuccess(res, assignment, 200, 'Asignación de bodega actualizada');
}
