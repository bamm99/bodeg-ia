import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response.js';

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('💥 Error global no capturado:', err);

  // Errores conocidos de Prisma (Unique key violation, Foreign Key missing, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['campo'];
      return sendError(res, `Ya existe un registro con ese valor en: ${target.join(', ')}`, 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'El registro solicitado no fue encontrado en la base de datos', 404);
    }
    if (err.code === 'P2003') {
      return sendError(res, 'Violación de clave foránea. La entidad referenciada no existe', 400);
    }
  }

  const message = err.message || 'Error interno del servidor';
  const statusCode = err.statusCode || err.status || 500;

  return sendError(res, message, statusCode);
}
