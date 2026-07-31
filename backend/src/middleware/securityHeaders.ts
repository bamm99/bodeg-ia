import { Request, Response, NextFunction } from 'express';

/**
 * Middleware 3: CORS & Headers de Seguridad Estándar
 * Configura cabeceras HTTP de protección para evitar XSS, Clickjacking y MIME sniffing.
 */
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevenir Clickjacking (Iframe embedding)
  res.setHeader('X-Frame-Options', 'DENY');

  // Habilitar protección XSS integrada en navegadores
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Forzar uso de HTTPS en conexiones futuras
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Política de referencias segura
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  next();
}
