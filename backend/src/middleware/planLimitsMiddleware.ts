import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { getCompanyUsageStats } from '../services/planUsageService';
import { sendError } from '../utils/response';

export type SaaSResourceLimitType = 'warehouses' | 'users' | 'storage';

/**
 * Middleware para validar que una empresa no exceda los límites contratados de su Plan SaaS.
 * Si se alcanza o supera el límite, retorna HTTP 402 PLAN_LIMIT_EXCEEDED.
 */
export function checkPlanLimits(resourceType: SaaSResourceLimitType) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.companyId) {
      return next();
    }

    // Super Admin no tiene restricción de plan
    if (req.user.roleCode === 'SUPER_ADMIN') {
      return next();
    }

    try {
      const stats = await getCompanyUsageStats(req.user.companyId);

      if (resourceType === 'warehouses') {
        if (stats.usage.warehousesCount >= stats.limits.maxWarehouses) {
          return sendError(
            res,
            `Has alcanzado el límite máximo de bodegas contratadas (${stats.usage.warehousesCount}/${stats.limits.maxWarehouses}) en tu plan ${stats.planName}. Por favor, actualiza tu plan para agregar más bodegas.`,
            402,
            {
              code: 'PLAN_LIMIT_EXCEEDED',
              resourceType,
              currentUsage: stats.usage.warehousesCount,
              limit: stats.limits.maxWarehouses,
              planName: stats.planName,
            }
          );
        }
      }

      if (resourceType === 'users') {
        if (stats.usage.usersCount >= stats.limits.maxUsers) {
          return sendError(
            res,
            `Has alcanzado el límite máximo de usuarios contratados (${stats.usage.usersCount}/${stats.limits.maxUsers}) en tu plan ${stats.planName}. Por favor, actualiza tu plan para registrar más usuarios.`,
            402,
            {
              code: 'PLAN_LIMIT_EXCEEDED',
              resourceType,
              currentUsage: stats.usage.usersCount,
              limit: stats.limits.maxUsers,
              planName: stats.planName,
            }
          );
        }
      }

      if (resourceType === 'storage') {
        const newOccupiedM3 = req.body.occupied_m3 ? Number(req.body.occupied_m3) : 0;
        if (stats.usage.storageM3Occupied + newOccupiedM3 > stats.limits.maxStorageM3) {
          return sendError(
            res,
            `El volumen a ingresar excede la capacidad máxima de almacenamiento m³ contratada (${stats.usage.storageM3Occupied.toFixed(2)}/${stats.limits.maxStorageM3} m³) en tu plan ${stats.planName}.`,
            402,
            {
              code: 'PLAN_LIMIT_EXCEEDED',
              resourceType,
              currentUsage: stats.usage.storageM3Occupied,
              limit: stats.limits.maxStorageM3,
              planName: stats.planName,
            }
          );
        }
      }

      next();
    } catch (error) {
      console.error('Error al validar límites del plan SaaS:', error);
      next();
    }
  };
}
