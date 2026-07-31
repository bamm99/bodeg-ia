import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

// --- RESUMEN DASHBOARD SEGÚN ROL (SUPER_ADMIN, PLATFORM_ADMIN, COMPANY_ADMIN) ---
export async function getDashboardOverview(req: AuthRequest, res: Response) {
  const roleCode = req.user?.roleCode;
  const userId = req.user?.userId;
  const companyId = req.user?.companyId;

  if (roleCode === 'SUPER_ADMIN') {
    // 1. Visibilidad Global de la Plataforma (Todas las Empresas)
    const [companiesCount, warehousesCount, locationsGroup, activeCompanies] = await Promise.all([
      prisma.companies.count({ where: { deleted_at: null } }),
      prisma.warehouses.count({ where: { deleted_at: null } }),
      prisma.storage_locations.aggregate({
        _sum: { total_volume_m3: true, occupied_volume_m3: true },
        where: { deleted_at: null },
      }),
      prisma.companies.findMany({
        where: { deleted_at: null },
        include: {
          warehouses: { select: { id: true, name: true } },
          subscriptions: { include: { plans: true } },
        },
      }),
    ]);

    return sendSuccess(res, {
      roleScope: 'SUPER_ADMIN',
      scopeName: 'Plataforma Global (Todas las Empresas)',
      stats: {
        totalCompaniesCount: companiesCount,
        totalWarehousesCount: warehousesCount,
        totalStorageM3: Number(locationsGroup._sum.total_volume_m3 || 0),
        totalOccupiedM3: Number(locationsGroup._sum.occupied_volume_m3 || 0),
      },
      companiesList: activeCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        taxId: c.tax_id,
        warehousesCount: c.warehouses.length,
        planName: c.subscriptions[0]?.plans?.name || 'BASIC',
      })),
    });
  }

  if (roleCode === 'PLATFORM_ADMIN') {
    // 2. Visibilidad por Cartola de Clientes Asignados (Ejecutivo de Cuenta)
    const accessRecords = await prisma.user_company_access.findMany({
      where: { user_id: userId },
      include: {
        companies: {
          include: {
            warehouses: true,
            subscriptions: { include: { plans: true } },
          },
        },
      },
    });

    const assignedCompanyIds = accessRecords.map((a) => a.company_id);

    const [warehousesCount, locationsGroup] = await Promise.all([
      prisma.warehouses.count({ where: { company_id: { in: assignedCompanyIds }, deleted_at: null } }),
      prisma.storage_locations.aggregate({
        _sum: { total_volume_m3: true, occupied_volume_m3: true },
        where: { company_id: { in: assignedCompanyIds }, deleted_at: null },
      }),
    ]);

    return sendSuccess(res, {
      roleScope: 'PLATFORM_ADMIN',
      scopeName: 'Cartola de Clientes Asignados (Ejecutivo de Cuenta)',
      stats: {
        assignedCompaniesCount: assignedCompanyIds.length,
        totalWarehousesCount: warehousesCount,
        totalStorageM3: Number(locationsGroup._sum.total_volume_m3 || 0),
        totalOccupiedM3: Number(locationsGroup._sum.occupied_volume_m3 || 0),
      },
      assignedCompanies: accessRecords.map((a) => ({
        id: a.companies.id,
        name: a.companies.name,
        taxId: a.companies.tax_id,
        warehousesCount: a.companies.warehouses.length,
        planName: a.companies.subscriptions[0]?.plans?.name || 'BASIC',
      })),
    });
  }

  // 3. Visibilidad Única por Empresa (COMPANY_ADMIN / OPERADOR)
  const [warehousesCount, locationsGroup, companyInfo] = await Promise.all([
    prisma.warehouses.count({ where: { company_id: companyId, deleted_at: null } }),
    prisma.storage_locations.aggregate({
      _sum: { total_volume_m3: true, occupied_volume_m3: true },
      where: { company_id: companyId, deleted_at: null },
    }),
    companyId
      ? prisma.companies.findUnique({
          where: { id: companyId },
          include: { subscriptions: { include: { plans: true } } },
        })
      : null,
  ]);

  return sendSuccess(res, {
    roleScope: 'COMPANY_ADMIN',
    scopeName: companyInfo?.name || 'Mi Empresa',
    stats: {
      totalWarehousesCount: warehousesCount,
      totalStorageM3: Number(locationsGroup._sum.total_volume_m3 || 0),
      totalOccupiedM3: Number(locationsGroup._sum.occupied_volume_m3 || 0),
      planName: companyInfo?.subscriptions[0]?.plans?.name || 'BASIC',
    },
  });
}

// --- PLANES ---
export async function getPlans(req: AuthRequest, res: Response) {
  const plans = await prisma.plans.findMany({ where: { is_active: true } });
  return sendSuccess(res, plans);
}

export async function createPlan(req: AuthRequest, res: Response) {
  const plan = await prisma.plans.create({ data: req.body });
  return sendSuccess(res, plan, 201, 'Plan SaaS creado exitosamente');
}

export async function updatePlan(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const plan = await prisma.plans.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, plan, 200, 'Plan SaaS actualizado');
}

// --- EMPRESAS ---
export async function getCompanies(req: AuthRequest, res: Response) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    prisma.companies.findMany({
      where: { deleted_at: null },
      include: { subscriptions: { include: { plans: true } } },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.companies.count({ where: { deleted_at: null } }),
  ]);

  return sendPaginated(res, companies, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getCompanyById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const company = await prisma.companies.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { plans: true } },
      branches: true,
      users: { select: { id: true, email: true, full_name: true, is_active: true } },
    },
  });

  if (!company || company.deleted_at) {
    return sendError(res, 'Empresa no encontrada', 404);
  }

  return sendSuccess(res, company);
}

export async function updateCompany(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const company = await prisma.companies.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, company, 200, 'Empresa actualizada exitosamente');
}

export async function deleteCompany(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.companies.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
  });
  return sendSuccess(res, null, 200, 'Empresa eliminada (soft-delete)');
}
