import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { Response } from 'express';
import { assignExecutivePortfolio } from '../controllers/saas.controller';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';

describe('Asignación de Cartolas a Ejecutivos (assignExecutivePortfolio)', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: any;
  let executiveUserId: string;
  const companyId = 'c1000000-0000-0000-0000-000000000001'; // Agrosur

  beforeAll(async () => {
    // Buscar un usuario existente en la base de datos de pruebas
    const user = await prisma.users.findFirst({
      where: { deleted_at: null },
    });
    executiveUserId = user ? user.id : '00000000-0000-0000-0000-000000000001';
  });

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: {
        userId: '00000000-0000-0000-0000-000000000001',
        email: 'superadmin@bodegia.cl',
        companyId: '',
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

  it('debe asignar una empresa a la cartola del ejecutivo y registrar la auditoría', async () => {
    mockReq.body = {
      executiveUserId,
      companyId,
      action: 'ASSIGN',
      reason: 'Asignación de prueba en Vitest',
    };

    await assignExecutivePortfolio(mockReq as AuthRequest, mockRes as Response);

    expect(mockRes.statusCode).toBe(200);

    // Verificar en base de datos la presencia del registro de acceso
    const access = await prisma.user_company_access.findFirst({
      where: { user_id: executiveUserId, company_id: companyId },
    });
    expect(access).toBeDefined();

    // Verificar historial de auditoría
    const history = await prisma.executive_portfolio_history.findFirst({
      where: { executive_user_id: executiveUserId, company_id: companyId, action: 'ASSIGNED' },
    });
    expect(history).toBeDefined();
  });

  it('debe desvincular una empresa de la cartola del ejecutivo y registrar la auditoría', async () => {
    mockReq.body = {
      executiveUserId,
      companyId,
      action: 'UNASSIGN',
      reason: 'Desvinculación de prueba en Vitest',
    };

    await assignExecutivePortfolio(mockReq as AuthRequest, mockRes as Response);

    expect(mockRes.statusCode).toBe(200);

    // Verificar en base de datos la eliminación del registro de acceso
    const access = await prisma.user_company_access.findFirst({
      where: { user_id: executiveUserId, company_id: companyId },
    });
    expect(access).toBeNull();

    // Verificar historial de auditoría UNASSIGNED
    const history = await prisma.executive_portfolio_history.findFirst({
      where: { executive_user_id: executiveUserId, company_id: companyId, action: 'UNASSIGNED' },
    });
    expect(history).toBeDefined();
  });
});
