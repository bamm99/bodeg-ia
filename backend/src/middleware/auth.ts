import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  companyId: string;
  roleCode: string;
  permissions: string[];
  sessionId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'bodegia_super_secret_jwt_key_2026_x89a';

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Acceso no autorizado. Token JWT no proporcionado', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId?: string };

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: true,
        companies: true,
      },
    });

    if (!user || !user.is_active || user.deleted_at) {
      return sendError(res, 'Usuario no activo o cuenta desactivada', 401);
    }

    // Si viene sessionId en el token, comprobar que la sesión no haya sido revocada
    if (decoded.sessionId) {
      const session = await prisma.user_sessions.findUnique({
        where: { id: decoded.sessionId },
      });
      if (!session || session.is_revoked || session.expires_at < new Date()) {
        return sendError(res, 'La sesión ha sido cerrada o revocada', 401);
      }

      // Verificación Server-Side de Inactividad de 15 minutos para rol CLIENT_VIEWER
      if (user.roles.code === 'CLIENT_VIEWER') {
        const lastActivity = session.created_at || new Date();
        const diffMinutes = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60);
        if (diffMinutes > 15) {
          await prisma.user_sessions.update({
            where: { id: session.id },
            data: { is_revoked: true },
          });
          return sendError(res, 'Sesión del portal 3PL expirada por 15 minutos de inactividad', 401);
        }
      }
    }

    const permissions = Array.isArray(user.roles.permissions)
      ? (user.roles.permissions as string[])
      : [];

    req.user = {
      userId: user.id,
      email: user.email,
      companyId: user.primary_company_id || '',
      roleCode: user.roles.code,
      permissions,
      sessionId: decoded.sessionId,
    };

    // Si el usuario pertenece a una empresa, inyectar el tenant id para RLS
    if (req.user.companyId) {
      await prisma.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = '${req.user.companyId}';`
      );
    }

    next();
  } catch (err) {
    return sendError(res, 'Token inválido o expirado', 403);
  }
}

/**
 * Middleware para exigir permisos RBAC específicos
 */
export function requirePermission(permissionRequired: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Usuario no autenticado', 401);
    }

    const { permissions, roleCode } = req.user;

    // Super Admin o Wildcard global tiene acceso total
    if (roleCode === 'SUPER_ADMIN' || permissions.includes('*')) {
      return next();
    }

    // Permiso exacto
    if (permissions.includes(permissionRequired)) {
      return next();
    }

    // Soporte para comodín por categoría (ej: "warehouse:*" coincide con "warehouse:manage")
    const category = permissionRequired.split(':')[0];
    if (category && permissions.includes(`${category}:*`)) {
      return next();
    }

    return sendError(
      res,
      `Acceso denegado. Permiso requerido: ${permissionRequired}`,
      403
    );
  };
}

/**
 * Middleware para verificar acceso específico a una Bodega (Scope assignment)
 */
export function requireWarehouseAccess(warehouseIdParamName = 'warehouse_id') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 'Usuario no autenticado', 401);

    const { userId, roleCode, companyId } = req.user;
    const targetWarehouseId = req.params[warehouseIdParamName] || req.body[warehouseIdParamName];

    if (!targetWarehouseId) {
      return sendError(res, 'Identificador de bodega no proporcionado en la solicitud', 400);
    }

    // Super Admin o Company Admin tienen acceso a todas las bodegas de su empresa
    if (roleCode === 'SUPER_ADMIN' || roleCode === 'COMPANY_ADMIN') {
      return next();
    }

    // Verificar si el usuario tiene asignación específica a la bodega
    const assignment = await prisma.user_warehouse_assignments.findUnique({
      where: {
        user_id_warehouse_id: {
          user_id: userId,
          warehouse_id: targetWarehouseId,
        },
      },
    });

    if (!assignment) {
      return sendError(res, 'No tienes permiso asignado para acceder a esta bodega específica', 403);
    }

    next();
  };
}
