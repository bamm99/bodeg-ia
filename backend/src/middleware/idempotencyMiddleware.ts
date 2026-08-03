import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { sendError } from '../utils/response';

interface CachedResponse {
  statusCode: number;
  body: any;
  timestamp: number;
}

// Cache en memoria con TTL de 24 horas para claves de idempotencia
const idempotencyCache = new Map<string, CachedResponse>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Limpieza periódica de claves expiradas cada hora
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Middleware de Idempotencia para endpoints operacionales (Inbound, Relocate, Outbound)
 * Protege ante duplicación de peticiones producidas por WiFi intermitente o doble-tap en bodegas.
 */
export function idempotencyMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Solo aplica a métodos mutativos (POST, PUT, PATCH, DELETE)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const idempotencyKey =
    (req.headers['x-idempotency-key'] as string) ||
    (req.headers['idempotency-key'] as string);

  if (!idempotencyKey) {
    // Si no se proporciona la cabecera, continúa normalmente
    return next();
  }

  // Clave única combinando la empresa/usuario y la clave de idempotencia
  const scopeId = req.user?.companyId || req.user?.userId || 'anonymous';
  const cacheKey = `${scopeId}:${idempotencyKey}`;

  const cached = idempotencyCache.get(cacheKey);
  if (cached) {
    // Si la clave ya fue procesada en las últimas 24h, retorna la respuesta cacheada sin re-ejecutar el controlador
    res.setHeader('x-cache-hit', 'true');
    res.setHeader('x-idempotency-key', idempotencyKey);
    return res.status(cached.statusCode).json(cached.body);
  }

  // Interceptar la respuesta original res.json para guardarla en cache al responder exitosamente
  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    // Guardar en cache solo si la respuesta fue exitosa (HTTP 200, 201, 202)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(cacheKey, {
        statusCode: res.statusCode,
        body,
        timestamp: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}

/**
 * Helper para limpiar el cache de idempotencia (útil para pruebas unitarias)
 */
export function clearIdempotencyCache() {
  idempotencyCache.clear();
}
