import { prisma } from '../db/prisma';

export interface CompanyUsageStats {
  companyId: string;
  planName: string;
  usage: {
    warehousesCount: number;
    usersCount: number;
    storageM3Occupied: number;
  };
  limits: {
    maxWarehouses: number;
    maxUsers: number;
    maxStorageM3: number;
  };
  percentages: {
    warehousesPercent: number;
    usersPercent: number;
    storageM3Percent: number;
  };
  is90PercentWarning: boolean;
}

/**
 * Servicio para calcular el consumo actual de una empresa y compararlo contra los límites de su Plan SaaS
 */
export async function getCompanyUsageStats(companyId: string): Promise<CompanyUsageStats> {
  // Consultar suscripción activa y plan
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      company_id: companyId,
      status: 'ACTIVE',
    },
    include: {
      plans: true,
    },
  });

  const plan = subscription?.plans || {
    name: 'Plan Estándar (Por Defecto)',
    max_warehouses: 1,
    max_users: 5,
    max_storage_m3: 500.0,
  };

  // Contar bodegas activas
  const warehousesCount = await prisma.warehouses.count({
    where: {
      company_id: companyId,
      deleted_at: null,
    },
  });

  // Contar usuarios activos
  const usersCount = await prisma.users.count({
    where: {
      primary_company_id: companyId,
      deleted_at: null,
      is_active: true,
    },
  });

  // Calcular volumen m3 ocupado en inventario
  const storageAgg = await prisma.inventory_items.aggregate({
    _sum: {
      occupied_m3: true,
    },
    where: {
      company_id: companyId,
    },
  });

  const storageM3Occupied = Number(storageAgg._sum.occupied_m3 || 0);

  const maxWarehouses = plan.max_warehouses;
  const maxUsers = plan.max_users;
  const maxStorageM3 = Number(plan.max_storage_m3);

  const warehousesPercent = maxWarehouses > 0 ? (warehousesCount / maxWarehouses) * 100 : 0;
  const usersPercent = maxUsers > 0 ? (usersCount / maxUsers) * 100 : 0;
  const storageM3Percent = maxStorageM3 > 0 ? (storageM3Occupied / maxStorageM3) * 100 : 0;

  const is90PercentWarning =
    warehousesPercent >= 90 || usersPercent >= 90 || storageM3Percent >= 90;

  return {
    companyId,
    planName: plan.name,
    usage: {
      warehousesCount,
      usersCount,
      storageM3Occupied,
    },
    limits: {
      maxWarehouses,
      maxUsers,
      maxStorageM3,
    },
    percentages: {
      warehousesPercent: Math.round(warehousesPercent * 100) / 100,
      usersPercent: Math.round(usersPercent * 100) / 100,
      storageM3Percent: Math.round(storageM3Percent * 100) / 100,
    },
    is90PercentWarning,
  };
}
