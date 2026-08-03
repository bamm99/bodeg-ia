import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { requireRbac } from '../middleware/rbacMiddleware';
import { AuthRequest } from '../middleware/auth';

describe('Middleware RBAC Avanzado (requireRbac)', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  it('debe denegar acceso (HTTP 401) si req.user no existe', async () => {
    const middleware = requireRbac('inventory:write');
    await middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('debe permitir acceso total si el usuario es SUPER_ADMIN', async () => {
    mockReq.user = {
      userId: 'u-1',
      email: 'admin@bodegia.cl',
      companyId: 'c-1',
      roleCode: 'SUPER_ADMIN',
      permissions: ['*'],
    };

    const middleware = requireRbac('inventory:write');
    await middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('debe permitir acceso si el rol del usuario posee el permiso exacto', async () => {
    mockReq.user = {
      userId: 'u-2',
      email: 'user@bodegia.cl',
      companyId: 'c-1',
      roleCode: 'COMPANY_ADMIN',
      permissions: ['inventory:write', 'inventory:read'],
    };

    const middleware = requireRbac('inventory:write');
    await middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('debe denegar acceso (HTTP 403) si el rol del usuario no posee el permiso de la acción', async () => {
    mockReq.user = {
      userId: 'u-3',
      email: 'operator@bodegia.cl',
      companyId: 'c-1',
      roleCode: 'WAREHOUSE_OPERATOR',
      permissions: ['inventory:read'],
    };

    const middleware = requireRbac('costs:manage');
    await middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
