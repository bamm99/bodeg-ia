import { describe, it, expect, vi } from 'vitest';
import { requirePermission, AuthRequest } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { requestTraceMiddleware } from '../middleware/requestTrace.js';
import { securityHeadersMiddleware } from '../middleware/securityHeaders.js';
import { z } from 'zod';
import { Response } from 'express';

describe('Middlewares de Seguridad y Validación (auth.ts & validate.ts)', () => {
  const createMockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  describe('requirePermission Middleware', () => {
    it('debe permitir el acceso si el rol es SUPER_ADMIN', () => {
      const req: AuthRequest = {
        user: { userId: '1', email: 'a@a.cl', companyId: 'c1', roleCode: 'SUPER_ADMIN', permissions: [] },
      } as any;
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requirePermission('warehouse:manage');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('debe permitir el acceso si el usuario posee la categoría wildcard (ej. warehouse:*)', () => {
      const req: AuthRequest = {
        user: { userId: '2', email: 'b@b.cl', companyId: 'c1', roleCode: 'COMPANY_ADMIN', permissions: ['warehouse:*'] },
      } as any;
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requirePermission('warehouse:create');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('debe rechazar el acceso con HTTP 403 si el usuario carece del permiso requerido', () => {
      const req: AuthRequest = {
        user: { userId: '3', email: 'c@c.cl', companyId: 'c1', roleCode: 'OPERATOR', permissions: ['inventory:read'] },
      } as any;
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = requirePermission('cost:edit');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateRequest Middleware', () => {
    it('debe llamar a next() si el body cumple con el esquema Zod', async () => {
      const req: any = { body: { name: 'Bodega 1' } };
      const res = createMockResponse();
      const next = vi.fn();

      const schema = z.object({ name: z.string() });
      const middleware = validateRequest({ body: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('debe responder con HTTP 400 si la validación Zod falla', async () => {
      const req: any = { body: {} };
      const res = createMockResponse();
      const next = vi.fn();

      const schema = z.object({ name: z.string().min(1, 'El nombre es obligatorio') });
      const middleware = validateRequest({ body: schema });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requestTraceMiddleware & securityHeadersMiddleware', () => {
    it('requestTraceMiddleware debe generar un Trace ID e inyectar el header X-Trace-ID', () => {
      const req: any = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
      const res: any = { setHeader: vi.fn(), on: vi.fn() };
      const next = vi.fn();

      requestTraceMiddleware(req, res, next);

      expect(req.traceId).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('X-Trace-ID', req.traceId);
      expect(next).toHaveBeenCalled();
    });

    it('securityHeadersMiddleware debe configurar cabeceras de protección HTTP', () => {
      const req: any = {};
      const res: any = { setHeader: vi.fn() };
      const next = vi.fn();

      securityHeadersMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(next).toHaveBeenCalled();
    });
  });
});
