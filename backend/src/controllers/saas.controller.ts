import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';
import { getCompanyUsageStats } from '../services/planUsageService.js';

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

// --- PLANES SAAS ---
export async function getPlans(req: AuthRequest, res: Response) {
  const plans = await prisma.plans.findMany({ where: { is_active: true } });
  return sendSuccess(res, plans);
}

export async function createPlan(req: AuthRequest, res: Response) {
  const { name, max_warehouses, max_users, max_storage_m3, price_monthly, currency } = req.body;

  if (!name) {
    return sendError(res, 'El nombre del plan es requerido', 400);
  }

  const existing = await prisma.plans.findUnique({ where: { name } });
  if (existing) {
    return sendError(res, `Ya existe un plan con el nombre "${name}"`, 409);
  }

  const plan = await prisma.plans.create({
    data: {
      name,
      max_warehouses: max_warehouses ? Number(max_warehouses) : 1,
      max_users: max_users ? Number(max_users) : 5,
      max_storage_m3: max_storage_m3 ? Number(max_storage_m3) : 500.0,
      price_monthly: price_monthly ? Number(price_monthly) : 0,
      currency: currency || 'CLP',
    },
  });

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

export async function deletePlan(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.plans.update({
    where: { id },
    data: { is_active: false },
  });
  return sendSuccess(res, null, 200, 'Plan SaaS desactivado (soft-delete)');
}

// --- EMPRESAS ---
export async function getCompanies(req: AuthRequest, res: Response) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const roleCode = req.user?.roleCode;
  const companyId = req.user?.companyId;
  const userId = req.user?.userId;

  let whereClause: any = { deleted_at: null };

  if (roleCode === 'SUPER_ADMIN') {
    // Super Admin ve todas las empresas
    whereClause = { deleted_at: null };
  } else if (roleCode === 'PLATFORM_ADMIN') {
    // Ejecutivo ve únicamente las empresas de su cartola asignada
    const accessRecords = await prisma.user_company_access.findMany({
      where: { user_id: userId },
      select: { company_id: true },
    });
    const assignedIds = accessRecords.map((a) => a.company_id);
    whereClause = { id: { in: assignedIds }, deleted_at: null };
  } else {
    // COMPANY_ADMIN u otros roles de empresa ven ÚNICAMENTE su propia empresa
    whereClause = { id: companyId || '00000000-0000-0000-0000-000000000000', deleted_at: null };
  }

  const [companies, total] = await Promise.all([
    prisma.companies.findMany({
      where: whereClause,
      include: { subscriptions: { include: { plans: true } } },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.companies.count({ where: whereClause }),
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
  const roleCode = req.user?.roleCode;
  const companyId = req.user?.companyId;
  const userId = req.user?.userId;

  // Verificación estricta de aislamiento Multi-Tenant
  if (roleCode !== 'SUPER_ADMIN') {
    if (roleCode === 'PLATFORM_ADMIN') {
      const accessRecord = await prisma.user_company_access.findFirst({
        where: { user_id: userId, company_id: id },
      });
      if (!accessRecord) {
        return sendError(res, 'Acceso denegado. Esta empresa no pertenece a tu cartola asignada.', 403);
      }
    } else {
      // COMPANY_ADMIN u otros roles sólo pueden ver la información de su propia empresa
      if (id !== companyId) {
        return sendError(res, 'Acceso denegado. No tienes permiso para ver información de otra empresa.', 403);
      }
    }
  }

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

  const usageStats = await getCompanyUsageStats(id);

  return sendSuccess(res, {
    ...company,
    usageStats,
  });
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

// --- ASIGNACIÓN DE CARTOLA DE EJECUTIVOS ---
export async function assignExecutivePortfolio(req: AuthRequest, res: Response) {
  const { executiveUserId, companyId, action, reason } = req.body;

  if (!executiveUserId || !companyId || !action) {
    return sendError(res, 'executiveUserId, companyId y action ("ASSIGN" | "UNASSIGN") son requeridos', 400);
  }

  const executive = await prisma.users.findUnique({
    where: { id: executiveUserId },
    include: { roles: true },
  });

  if (!executive) {
    return sendError(res, 'Usuario Ejecutivo no encontrado', 404);
  }

  const adminUserId = req.user?.userId;
  const adminUserExists = adminUserId ? await prisma.users.findUnique({ where: { id: adminUserId } }) : null;
  const assignedByUserId = adminUserExists ? adminUserId : null;

  if (action === 'ASSIGN') {
    await prisma.user_company_access.upsert({
      where: {
        user_id_company_id: {
          user_id: executiveUserId,
          company_id: companyId,
        },
      },
      create: {
        user_id: executiveUserId,
        company_id: companyId,
      },
      update: {},
    });

    await prisma.executive_portfolio_history.create({
      data: {
        executive_user_id: executiveUserId,
        company_id: companyId,
        action: 'ASSIGNED',
        assigned_by_user_id: assignedByUserId,
        reason: reason || 'Asignación de cartola por administrador',
      },
    });

    return sendSuccess(res, null, 200, 'Empresa cliente asignada a la cartola del Ejecutivo');
  } else if (action === 'UNASSIGN') {
    await prisma.user_company_access.deleteMany({
      where: {
        user_id: executiveUserId,
        company_id: companyId,
      },
    });

    await prisma.executive_portfolio_history.create({
      data: {
        executive_user_id: executiveUserId,
        company_id: companyId,
        action: 'UNASSIGNED',
        assigned_by_user_id: assignedByUserId,
        reason: reason || 'Desvinculación de cartola por administrador',
      },
    });

    return sendSuccess(res, null, 200, 'Empresa cliente desvinculada de la cartola del Ejecutivo');
  }

  return sendError(res, 'Acción inválida. Use "ASSIGN" o "UNASSIGN"', 400);
}

export async function getExecutivePortfolio(req: AuthRequest, res: Response) {
  const { executiveUserId } = req.params;

  const accessRecords = await prisma.user_company_access.findMany({
    where: { user_id: executiveUserId },
    include: {
      companies: {
        include: {
          subscriptions: { include: { plans: true } },
          warehouses: true,
        },
      },
    },
  });

  const history = await prisma.executive_portfolio_history.findMany({
    where: { executive_user_id: executiveUserId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return sendSuccess(res, {
    portfolio: accessRecords.map((a) => a.companies),
    auditHistory: history,
  });
}
