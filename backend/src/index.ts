import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importación del Pipeline de Middlewares (1 a 5)
import { requestTraceMiddleware } from './middleware/requestTrace.js'; // 1. Logger / Trace ID
import { globalRateLimiter, authRateLimiter } from './middleware/rateLimiter.js'; // 2. Rate Limiter
import { securityHeadersMiddleware } from './middleware/securityHeaders.js'; // 3. CORS & Security Headers
import { globalErrorHandler } from './middleware/errorHandler.js';

// Importación de Enrutadores REST v1
import authRoutes from './routes/auth.routes.js';
import saasRoutes from './routes/saas.routes.js';
import userRoutes from './routes/user.routes.js';
import locationRoutes from './routes/location.routes.js';
import costRoutes from './routes/cost.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// =========================================================================
// PIPELINE DE MIDDLEWARES DE LA APLICACIÓN
// =========================================================================

// [Middleware 1: Logger & Trace ID] Genera x-trace-id y mide tiempos de ejecución
app.use(requestTraceMiddleware);

// [Middleware 2: Rate Limiter Global] Protección contra sobrecarga / DDoS
app.use(globalRateLimiter);

// [Middleware 3: CORS & Cabeceras de Seguridad] Protección XSS, Clickjacking, MIME
app.use(
  cors({
    origin: '*', // Se puede restringir a dominios específicos en producción
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-ID'],
    exposedHeaders: ['X-Trace-ID'],
  })
);
app.use(securityHeadersMiddleware);

// Parsing de JSON en el Body
app.use(express.json());

// =========================================================================
// RUTA HEALTHCHECK
// =========================================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Bodeg-IA Enterprise API REST v1.0',
    traceId: (req as any).traceId,
    timestamp: new Date().toISOString(),
  });
});

// =========================================================================
// RUTAS API REST (Con Middlewares 4: JWT/RBAC y 5: Validación Zod por ruta)
// =========================================================================
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/saas', saasRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/costs', costRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Retrocompatibilidad
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/warehouses', locationRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/inventory', inventoryRoutes);

// =========================================================================
// MANEJADOR GLOBAL DE ERRORES (Al final de la cadena)
// =========================================================================
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Bodeg-IA API en línea escuchando en http://localhost:${PORT}`);
});
