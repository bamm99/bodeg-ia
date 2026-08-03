import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { saasRoleScopeMiddleware, RoleScopedRequest } from '../middleware/saasRoleScopeMiddleware';

describe('Middleware de Aislamiento de Alcance SaaS (saasRoleScopeMiddleware)', () => {
  let mockReq: Partial<RoleScopedRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  it('debe asignar alcance GLOBAL para el rol SUPER_ADMIN', async () => {
    mockReq.user = {
      userId: 'admin-id',
      email: 'admin@bodegia.cl',
      companyId: '',
      roleCode: 'SUPER_ADMIN',
      permissions: ['*'],
    };

    await saasRoleScopeMiddleware(mockReq as RoleScopedRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.roleScope).toEqual({ type: 'GLOBAL' });
  });

  it('debe asignar alcance SINGLE_COMPANY para el rol COMPANY_ADMIN', async () => {
    mockReq.user = {
      userId: 'user-id',
      email: 'compadmin@agrosur.cl',
      companyId: 'c1000000-0000-0000-0000-000000000001',
      roleCode: 'COMPANY_ADMIN',
      permissions: ['company:manage'],
    };

    await saasRoleScopeMiddleware(mockReq as RoleScopedRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.roleScope).toEqual({
      type: 'SINGLE_COMPANY',
      companyId: 'c1000000-0000-0000-0000-000000000001',
    });
  });
});
