import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getClients, createClient, inviteClientToPortal, getProducts, createProduct } from '../controllers/catalog.controller.js';
import { prisma } from '../db/prisma.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    clients: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    products: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    roles: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    users: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Fase 3 Backend: Catálogo, Clientes 3PL & Portal Autoservicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe listar los clientes 3PL del tenant autenticado', async () => {
    const mockClients = [
      { id: 'c1', name: 'Propio AgroSur', is_internal_company: true },
      { id: 'c2', name: 'Frutas del Cachapoal Ltda', is_internal_company: false },
    ];

    (prisma.clients.findMany as any).mockResolvedValue(mockClients);

    const req: any = { user: { companyId: 'comp1', roleCode: 'COMPANY_ADMIN' } };
    let statusCode = 0;
    let jsonResult: any = null;

    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonResult = data;
        return res;
      },
    };

    await getClients(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResult.success).toBe(true);
    expect(jsonResult.data.length).toBe(2);
  });

  it('debe generar una invitación al Portal 3PL con rol CLIENT_VIEWER', async () => {
    const mockClient = {
      id: 'cli10000-0000-0000-0000-000000000001',
      company_id: 'comp1',
      name: 'Frutas del Cachapoal Ltda',
      tax_id: '96.111.222-3',
    };

    const mockRole = {
      id: 'role-client-viewer-id',
      code: 'CLIENT_VIEWER',
    };

    const mockUser = {
      id: 'usr-client-id',
      email: 'cliente.961112223@bodegia.cl',
      client_id: mockClient.id,
    };

    (prisma.clients.findFirst as any).mockResolvedValue(mockClient);
    (prisma.roles.findFirst as any).mockResolvedValue(mockRole);
    (prisma.users.findFirst as any).mockResolvedValue(mockUser);

    const req: any = {
      params: { id: mockClient.id },
      user: { companyId: 'comp1', roleCode: 'COMPANY_ADMIN' },
    };

    let statusCode = 0;
    let jsonResult: any = null;

    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonResult = data;
        return res;
      },
    };

    await inviteClientToPortal(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResult.success).toBe(true);
    expect(jsonResult.data.clientName).toBe('Frutas del Cachapoal Ltda');
    expect(jsonResult.data.portalEmail).toBe('cliente.961112223@bodegia.cl');
    expect(jsonResult.data.tempPassword).toBe('admin123');
  });

  it('debe crear un nuevo producto en el catálogo maestro', async () => {
    const newProdData = {
      sku: 'HAR-IND-25',
      name: 'Caja Harina Industrial 25kg',
      unit_weight_kg: 25.0,
      unit_volume_m3: 0.05,
      is_palletized: false,
    };

    const mockCreated = { id: 'prod-1', ...newProdData, company_id: 'comp1' };
    (prisma.products.create as any).mockResolvedValue(mockCreated);

    const req: any = {
      body: newProdData,
      user: { companyId: 'comp1', roleCode: 'COMPANY_ADMIN' },
    };

    let statusCode = 0;
    let jsonResult: any = null;

    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonResult = data;
        return res;
      },
    };

    await createProduct(req, res);

    expect(statusCode).toBe(201);
    expect(jsonResult.success).toBe(true);
    expect(jsonResult.data.sku).toBe('HAR-IND-25');
  });
});
