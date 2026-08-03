import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { checkPlanLimits } from '../middleware/planLimitsMiddleware';
import { AuthRequest } from '../middleware/auth';
import * as planUsageService from '../services/planUsageService';

describe('Middleware de Validación de Límites SaaS (checkPlanLimits)', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: {
        userId: 'user-001',
        email: 'admin@agrosur.cl',
        companyId: 'c1000000-0000-0000-0000-000000000001',
        roleCode: 'COMPANY_ADMIN',
        permissions: ['company:manage'],
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    nextFunction = vi.fn();
  });

  it('debe permitir continuar si el usuario es SUPER_ADMIN sin evaluar restricciones', async () => {
    mockReq.user!.roleCode = 'SUPER_ADMIN';

    const middleware = checkPlanLimits('warehouses');
    await middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('debe denegar petición (HTTP 402 PLAN_LIMIT_EXCEEDED) si se supera el límite de bodegas', async () => {
    vi.spyOn(planUsageService, 'getCompanyUsageStats').mockResolvedValueOnce({
      companyId: 'c1000000-0000-0000-0000-000000000001',
      planName: 'Plan Básico (1 Bodega)',
      usage: { warehousesCount: 1, usersCount: 2, storageM3Occupied: 100 },
      limits: { maxWarehouses: 1, maxUsers: 5, maxStorageM3: 500 },
      percentages: { warehousesPercent: 100, usersPercent: 40, storageM3Percent: 20 },
      is90PercentWarning: true,
    });

    const middleware = checkPlanLimits('warehouses');
    await middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(402);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('debe permitir continuar si el consumo actual está dentro de los límites del plan', async () => {
    vi.spyOn(planUsageService, 'getCompanyUsageStats').mockResolvedValueOnce({
      companyId: 'c1000000-0000-0000-0000-000000000001',
      planName: 'Plan Pro',
      usage: { warehousesCount: 1, usersCount: 2, storageM3Occupied: 100 },
      limits: { maxWarehouses: 5, maxUsers: 20, maxStorageM3: 2000 },
      percentages: { warehousesPercent: 20, usersPercent: 10, storageM3Percent: 5 },
      is90PercentWarning: false,
    });

    const middleware = checkPlanLimits('warehouses');
    await middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});
