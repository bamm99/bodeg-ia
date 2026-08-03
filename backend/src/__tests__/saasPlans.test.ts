import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { getPlans, createPlan, updatePlan, deletePlan } from '../controllers/saas.controller';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';

describe('Controlador de Planes SaaS (saas.controller.ts)', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
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

  it('debe obtener el listado de planes activos (getPlans)', async () => {
    await getPlans(mockReq as AuthRequest, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalled();
    const responsePayload = mockRes.json.mock.calls[0][0];
    expect(responsePayload.success).toBe(true);
    expect(Array.isArray(responsePayload.data)).toBe(true);
  });

  it('debe crear un nuevo plan SaaS (createPlan)', async () => {
    const planName = `Plan Test ${Date.now()}`;
    mockReq.body = {
      name: planName,
      max_warehouses: 3,
      max_users: 15,
      max_storage_m3: 1500,
      price_monthly: 99000,
      currency: 'CLP',
    };

    await createPlan(mockReq as AuthRequest, mockRes as Response);

    expect(mockRes.statusCode).toBe(201);
    const responsePayload = mockRes.json.mock.calls[0][0];
    expect(responsePayload.success).toBe(true);
    expect(responsePayload.data.name).toBe(planName);

    // Limpieza
    await prisma.plans.delete({ where: { id: responsePayload.data.id } });
  });

  it('debe rechazar la creación si el nombre del plan ya existe', async () => {
    mockReq.body = {
      name: 'BASIC',
      max_warehouses: 1,
    };

    await createPlan(mockReq as AuthRequest, mockRes as Response);

    expect(mockRes.statusCode).toBe(409);
  });
});
