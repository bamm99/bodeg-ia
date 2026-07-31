import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
}

export function sendError(res: Response, error: string, statusCode = 400, details?: any) {
  return res.status(statusCode).json({
    success: false,
    error,
    details,
  });
}
