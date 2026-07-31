import { rateLimit } from 'express-rate-limit';
import { sendError } from '../utils/response.js';

/**
 * Middleware 2: Rate Limiter Global
 * Limita peticiones por dirección IP para prevenir ataques DDoS o fuerza bruta.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 200, // Máximo 200 peticiones por IP en 15 minutos
  standardHeaders: true, // Retorna cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*` legadas
  handler: (req, res) => {
    return sendError(
      res,
      'Demasiadas peticiones desde esta dirección IP. Por favor intente más tarde.',
      429
    );
  },
});

/**
 * Rate Limiter Estricto para Autenticación (/api/v1/auth/login, /register-company)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // Máximo 15 intentos de autenticación en 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Demasiados intentos de autenticación. Cuenta bloqueada temporalmente por seguridad (15 min).',
      429
    );
  },
});
