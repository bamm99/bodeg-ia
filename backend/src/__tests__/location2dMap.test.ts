import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWarehouse2DMap, getBranches, createBranch } from '../controllers/location.controller.js';
import { prisma } from '../db/prisma.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    warehouses: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    branches: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    zones: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Fase 2 Backend: Mapa 2D & Estructura Espacial (/locations/warehouses/:id/2d-map)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe compilar las métricas m3 y grilla 2D correctamente para una bodega existente', async () => {
    const mockWarehouse = {
      id: 'w1000000-0000-0000-0000-000000000001',
      name: 'Bodega Principal Pudahuel',
      code: 'BOD-PUDA-01',
      branches: { name: 'Sucursal Pudahuel Central' },
      zones: [
        {
          id: 'z1',
          name: 'Zona A - Alta Rotación',
          turnover_rate: 'HIGH',
          aisles: [
            {
              id: 'a1',
              racks: [
                {
                  id: 'r1',
                  code: 'REP-A1',
                  position_x: 1,
                  position_y: 1,
                  width_units: 3,
                  length_units: 2,
                  levels: [
                    {
                      id: 'l1',
                      storage_locations: [
                        {
                          id: 'loc1',
                          total_volume_m3: 5.0,
                          occupied_volume_m3: 4.8,
                          status: 'FULL',
                          inventory_items: [],
                        },
                        {
                          id: 'loc2',
                          total_volume_m3: 5.0,
                          occupied_volume_m3: 1.2,
                          status: 'PARTIAL',
                          inventory_items: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    (prisma.warehouses.findFirst as any).mockResolvedValue(mockWarehouse);

    const req: any = {
      params: { id: 'w1000000-0000-0000-0000-000000000001' },
      user: { companyId: 'c1000000-0000-0000-0000-000000000001', roleCode: 'COMPANY_ADMIN' },
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

    await getWarehouse2DMap(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResult.success).toBe(true);
    expect(jsonResult.data.warehouseCode).toBe('BOD-PUDA-01');
    expect(jsonResult.data.metrics.totalVolumeM3).toBe(10.0);
    expect(jsonResult.data.metrics.occupiedVolumeM3).toBe(6.0);
    expect(jsonResult.data.metrics.occupancyPct).toBe(60);
    expect(jsonResult.data.racksGrid.length).toBe(1);
    expect(jsonResult.data.racksGrid[0].code).toBe('REP-A1');
    expect(jsonResult.data.racksGrid[0].heatStatus).toBe('PARTIAL');
  });

  it('debe retornar 404 si la bodega no existe o pertenece a otra empresa', async () => {
    (prisma.warehouses.findFirst as any).mockResolvedValue(null);

    const req: any = {
      params: { id: 'w9999999-9999-9999-9999-999999999999' },
      user: { companyId: 'c1000000-0000-0000-0000-000000000001', roleCode: 'COMPANY_ADMIN' },
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

    await getWarehouse2DMap(req, res);

    expect(statusCode).toBe(404);
    expect(jsonResult.success).toBe(false);
    expect(jsonResult.error).toContain('Bodega no encontrada');
  });

  it('debe listar las sucursales del tenant autenticado', async () => {
    const mockBranches = [
      { id: 'b1', name: 'Sucursal Pudahuel', company_id: 'c1' },
      { id: 'b2', name: 'Sucursal Quilicura', company_id: 'c1' },
    ];

    (prisma.branches.findMany as any).mockResolvedValue(mockBranches);

    const req: any = {
      user: { companyId: 'c1', roleCode: 'COMPANY_ADMIN' },
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

    await getBranches(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResult.data.length).toBe(2);
    expect(jsonResult.data[0].name).toBe('Sucursal Pudahuel');
  });
});
