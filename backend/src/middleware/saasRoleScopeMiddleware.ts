import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../db/prisma';
import { sendError } from '../utils/response';

export type RoleScopeType = 'GLOBAL' | 'PORTFOLIO' | 'SINGLE_COMPANY' | 'CLIENT_3PL';

export interface RoleScope {
  type: RoleScopeType;
  companyId?: string;
  companyIds?: string[];
  clientOwnerId?: string;
}

export interface RoleScopedRequest extends AuthRequest {
  roleScope?: RoleScope;
}

/**
 * Middleware para aislar el alcance de consulta de métricas y dashboards según el rol del usuario:
 * - SUPER_ADMIN: GLOBAL (todas las empresas de la plataforma SaaS)
 * - PLATFORM_ADMIN: PORTFOLIO (empresas asignadas en user_company_access)
 * - COMPANY_ADMIN / WAREHOUSE_MANAGER / WAREHOUSE_OPERATOR / COMMERCIAL_MANAGEMENT: SINGLE_COMPANY (únicamente su empresa primary_company_id)
 * - CLIENT_VIEWER: CLIENT_3PL (únicamente su mercancía client_owner_id)
 */
export async function saasRoleScopeMiddleware(
  req: RoleScopedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return sendError(res, 'Usuario no autenticado', 401);
  }

  const { userId, roleCode, companyId } = req.user;

  try {
    if (roleCode === 'SUPER_ADMIN') {
      req.roleScope = { type: 'GLOBAL' };
      return next();
    }

    if (roleCode === 'PLATFORM_ADMIN') {
      // Consultar la cartera de empresas asignadas en user_company_access
      const portfolio = await prisma.user_company_access.findMany({
        where: { user_id: userId },
        select: { company_id: true },
      });

      const companyIds = portfolio.map((p) => p.company_id);
      req.roleScope = {
        type: 'PORTFOLIO',
        companyIds,
      };
      return next();
    }

    if (roleCode === 'CLIENT_VIEWER') {
      // Buscar la ficha de cliente 3PL vinculada al usuario
      const client = await prisma.clients.findFirst({
        where: { company_id: companyId, tax_id: req.user.email },
      });

      req.roleScope = {
        type: 'CLIENT_3PL',
        companyId,
        clientOwnerId: client?.id || '',
      };
      return next();
    }

    // Por defecto para perfiles de empresa (COMPANY_ADMIN, WAREHOUSE_MANAGER, etc.)
    req.roleScope = {
      type: 'SINGLE_COMPANY',
      companyId,
    };

    next();
  } catch (error) {
    return sendError(res, 'Error calculando el alcance de datos para el usuario', 500);
  }
}
