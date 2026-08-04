import { describe, it, expect, beforeEach, vi } from 'vitest';
import { inboundStock, relocateStock, outboundStock, getDispatchRequests } from '../controllers/inventory.controller.js';
import { prisma } from '../db/prisma.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    clients: {
      findFirst: vi.fn(),
    },
    storage_locations: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventory_items: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    inventory_movements: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    dispatch_requests: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Fase 5 Backend: Operaciones de Inventario, Idempotencia & Despacho Bifurcado 3PL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe registrar un ingreso Inbound validando la capacidad m³ del casillero', async () => {
    const mockLocation = {
      id: 'loc-1',
      total_volume_m3: 10.0,
      occupied_volume_m3: 2.0,
    };

    (prisma.storage_locations.findUnique as any).mockResolvedValue(mockLocation);
    (prisma.clients.findFirst as any).mockResolvedValue({ id: 'cli-1' });
    (prisma.inventory_items.create as any).mockResolvedValue({ id: 'item-1' });
    (prisma.inventory_movements.create as any).mockResolvedValue({ id: 'mov-1' });

    const req: any = {
      body: {
        product_id: 'prod-1',
        storage_location_id: 'loc-1',
        quantity: 50,
        occupied_m3: 3.0,
      },
      user: { companyId: 'comp-1', userId: 'user-1' },
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

    await inboundStock(req, res);

    expect(statusCode).toBe(201);
    expect(jsonResult.success).toBe(true);
  });

  it('debe rechazar un despacho Outbound de stock 3PL si no cuenta con solicitud en estado APPROVED', async () => {
    const mockItem3PL = {
      id: 'item-3pl-1',
      quantity: 10,
      occupied_m3: 2.0,
      clients: { is_internal_company: false },
    };

    (prisma.inventory_items.findUnique as any).mockResolvedValue(mockItem3PL);

    const req: any = {
      body: {
        inventory_item_id: 'item-3pl-1',
        quantity: 5,
        // Sin dispatch_request_id
      },
      user: { companyId: 'comp-1', userId: 'user-1' },
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

    await outboundStock(req, res);

    expect(statusCode).toBe(403);
    expect(jsonResult.success).toBe(false);
    expect(jsonResult.error).toContain('exige una solicitud previa autorizada');
  });

  it('debe aprobar un despacho Outbound 3PL si viene respaldado por una solicitud en estado APPROVED', async () => {
    const mockItem3PL = {
      id: 'item-3pl-2',
      storage_location_id: 'loc-1',
      quantity: 10,
      occupied_m3: 2.0,
      clients: { is_internal_company: false },
    };

    const mockRequestApproved = {
      id: 'req-approved-1',
      status: 'APPROVED',
    };

    (prisma.inventory_items.findUnique as any).mockResolvedValue(mockItem3PL);
    (prisma.dispatch_requests.findUnique as any).mockResolvedValue(mockRequestApproved);
    (prisma.storage_locations.findUnique as any).mockResolvedValue({ id: 'loc-1', occupied_volume_m3: 2.0 });
    (prisma.inventory_items.update as any).mockResolvedValue({ id: 'item-3pl-2', quantity: 5 });
    (prisma.inventory_movements.create as any).mockResolvedValue({ id: 'mov-outbound-1' });

    const req: any = {
      body: {
        inventory_item_id: 'item-3pl-2',
        quantity: 5,
        dispatch_request_id: 'req-approved-1',
      },
      user: { companyId: 'comp-1', userId: 'user-1' },
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

    await outboundStock(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResult.success).toBe(true);
  });
});
