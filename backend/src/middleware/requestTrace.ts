import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface TraceRequest extends Request {
  traceId?: string;
  startTime?: number;
}

/**
 * Middleware 1: Logger & Trace ID
 * Asigna un identificador único (Trace ID) a cada petición HTTP para trazabilidad completa
 * y mide el tiempo de respuesta.
 */
export function requestTraceMiddleware(
  req: TraceRequest,
  res: Response,
  next: NextFunction
) {
  // Obtener Trace ID existente del header del cliente o generar uno nuevo (UUIDv4)
  const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
  const startTime = Date.now();

  req.traceId = traceId;
  req.startTime = startTime;

  // Inyectar el Trace ID en las cabeceras de respuesta HTTP
  res.setHeader('X-Trace-ID', traceId);

  // Registrar el fin de la petición y la duración en ms
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    console.log(
      `[TRACE ID: ${traceId}] ${req.method} ${req.originalUrl} - Status: ${statusCode} (${duration}ms) | IP: ${clientIp}`
    );
  });

  next();
}
