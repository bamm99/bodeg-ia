import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../db/prisma';
import { sendError } from '../utils/response';

export interface RbacOptions {
  action: string;
  warehouseIdParam?: string;
}

/**
 * Middleware RBAC Avanzado que aplica la regla de conjunción (AND Logic):
 * "La asignación de bodega (user_warehouse_assignments) restringe el ALCANCE ESPACIAL;
 *  el rol (roles.permissions JSONB) define las ACCIONES PERMITIDAS dentro de ese alcance."
 */
export function requireRbac(action: string, warehouseIdParam = 'warehouse_id') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Usuario no autenticado', 401);
    }

    const { userId, roleCode, permissions, companyId } = req.user;

    // 1. EVALUACIÓN DE ACCIÓN (roles.permissions JSONB)
    let isActionAllowed = false;

    if (roleCode === 'SUPER_ADMIN' || permissions.includes('*')) {
      isActionAllowed = true;
    } else if (permissions.includes(action)) {
      isActionAllowed = true;
    } else {
      const category = action.split(':')[0];
      if (category && permissions.includes(`${category}:*`)) {
        isActionAllowed = true;
      }
    }

    if (!isActionAllowed) {
      return sendError(
        res,
        `Acceso denegado. Tu rol no posee permiso para la acción: ${action}`,
        403
      );
    }

    // 2. EVALUACIÓN DE ALCANCE ESPACIAL (user_warehouse_assignments)
    const targetWarehouseId =
      req.params[warehouseIdParam] ||
      req.body[warehouseIdParam] ||
      req.query[warehouseIdParam];

    if (targetWarehouseId && typeof targetWarehouseId === 'string') {
      // Super Admin y Admin Empresa tienen alcance completo sobre todas las bodegas de la empresa
      if (roleCode === 'SUPER_ADMIN' || roleCode === 'COMPANY_ADMIN') {
        return next();
      }

      // Verificar si la bodega específica está dentro del alcance espacial asignado al usuario
      const assignment = await prisma.user_warehouse_assignments.findUnique({
        where: {
          user_id_warehouse_id: {
            user_id: userId,
            warehouse_id: targetWarehouseId,
          },
        },
      });

      if (!assignment) {
        return sendError(
          res,
          `Acceso denegado. No tienes la bodega [${targetWarehouseId}] dentro de tus bodegas asignadas`,
          403
        );
      }
    }

    next();
  };
}
