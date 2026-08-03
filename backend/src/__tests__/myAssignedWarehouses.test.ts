import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { getMyAssignedWarehouses } from '../controllers/location.controller';
import { AuthRequest } from '../middleware/auth';

describe('Controlador de Bodegas Asignadas (getMyAssignedWarehouses)', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      user: {
        userId: '00000000-0000-0000-0000-000000000001',
        email: 'admin@bodegia.cl',
        companyId: 'c1000000-0000-0000-0000-000000000001',
        roleCode: 'SUPER_ADMIN',
        permissions: ['*'],
      },
    };

    mockRes = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json: vi.fn(function (data: any) {
        return data;
      }),
    };
  });

  it('debe responder HTTP 200 con el listado de bodegas para SUPER_ADMIN', async () => {
    await getMyAssignedWarehouses(mockReq as AuthRequest, mockRes as Response);

    expect(mockRes.statusCode).toBe(200);
    const responsePayload = mockRes.json.mock.calls[0][0];
    expect(responsePayload.success).toBe(true);
    expect(Array.isArray(responsePayload.data)).toBe(true);
  });

  it('debe responder HTTP 200 con bodegas asignadas para un operador WAREHOUSE_OPERATOR', async () => {
    mockReq.user!.roleCode = 'WAREHOUSE_OPERATOR';

    await getMyAssignedWarehouses(mockReq as AuthRequest, mockRes as Response);

    expect(mockRes.statusCode).toBe(200);
    const responsePayload = mockRes.json.mock.calls[0][0];
    expect(responsePayload.success).toBe(true);
    expect(Array.isArray(responsePayload.data)).toBe(true);
  });
});
