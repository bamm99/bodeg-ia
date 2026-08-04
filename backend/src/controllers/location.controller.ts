import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

// --- SUCURSALES (BRANCHES) ---
export async function getBranches(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const branches = await prisma.branches.findMany({
    where: { company_id: companyId, deleted_at: null },
  });
  return sendSuccess(res, branches);
}

export async function createBranch(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const branch = await prisma.branches.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, branch, 201, 'Sucursal creada exitosamente');
}

export async function updateBranch(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const branch = await prisma.branches.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, branch, 200, 'Sucursal actualizada');
}

export async function deleteBranch(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.branches.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
  return sendSuccess(res, null, 200, 'Sucursal eliminada (soft-delete)');
}

// --- BODEGAS ASIGNADAS Y BODEGAS (WAREHOUSES) ---
export async function getMyAssignedWarehouses(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const companyId = req.user?.companyId;
  const roleCode = req.user?.roleCode;

  if (roleCode === 'SUPER_ADMIN' || roleCode === 'COMPANY_ADMIN') {
    // Para administradores, listar todas las bodegas de la empresa (o globales)
    const warehouses = await prisma.warehouses.findMany({
      where: {
        ...(companyId ? { company_id: companyId } : {}),
        deleted_at: null,
      },
      include: { branches: true },
    });
    return sendSuccess(
      res,
      warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        branchName: w.branches?.name,
        isCostTrackingEnabled: w.is_cost_tracking_enabled,
      }))
    );
  }

  // Para WAREHOUSE_MANAGER o WAREHOUSE_OPERATOR, consultar user_warehouse_assignments
  const assignments = await prisma.user_warehouse_assignments.findMany({
    where: { user_id: userId },
    include: {
      warehouses: {
        include: { branches: true },
      },
    },
  });

  const assignedWarehouses = assignments
    .filter((a) => a.warehouses && !a.warehouses.deleted_at)
    .map((a) => ({
      id: a.warehouses.id,
      name: a.warehouses.name,
      code: a.warehouses.code,
      branchName: a.warehouses.branches?.name,
      isCostTrackingEnabled: a.warehouses.is_cost_tracking_enabled,
    }));

  return sendSuccess(res, assignedWarehouses);
}

export async function getWarehouses(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const warehouses = await prisma.warehouses.findMany({
    where: { company_id: companyId, deleted_at: null },
    include: { branches: true },
  });
  return sendSuccess(res, warehouses);
}

export async function getWarehouseTree(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const { id } = req.params;

  const warehouse = await prisma.warehouses.findFirst({
    where: { id, company_id: companyId, deleted_at: null },
    include: {
      branches: true,
      zones: {
        where: { deleted_at: null },
        include: {
          cost_profiles: { where: { is_active: true } },
          aisles: {
            where: { deleted_at: null },
            include: {
              racks: {
                where: { deleted_at: null },
                include: {
                  cost_profiles: { where: { is_active: true } },
                  levels: {
                    where: { deleted_at: null },
                    include: {
                      cost_profiles: { where: { is_active: true } },
                      storage_locations: {
                        where: { deleted_at: null },
                        include: {
                          inventory_items: {
                            include: { products: true, clients: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!warehouse) return sendError(res, 'Bodega no encontrada', 404);

  return sendSuccess(res, { warehouse });
}

export async function createWarehouse(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const warehouse = await prisma.warehouses.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, warehouse, 201, 'Bodega creada exitosamente');
}

export async function updateWarehouse(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const warehouse = await prisma.warehouses.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, warehouse, 200, 'Bodega actualizada');
}

export async function deleteWarehouse(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.warehouses.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
  return sendSuccess(res, null, 200, 'Bodega eliminada (soft-delete)');
}

// --- ZONAS (ZONES) ---
export async function createZone(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const zone = await prisma.zones.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, zone, 201, 'Zona creada exitosamente');
}

export async function updateZone(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const zone = await prisma.zones.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, zone, 200, 'Zona actualizada');
}

export async function deleteZone(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.zones.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
  return sendSuccess(res, null, 200, 'Zona eliminada (soft-delete)');
}

// --- PASILLOS (AISLES) ---
export async function createAisle(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const aisle = await prisma.aisles.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, aisle, 201, 'Pasillo creado exitosamente');
}

// --- REPISAS (RACKS 2D) ---
export async function createRack(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const rack = await prisma.racks.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, rack, 201, 'Repisa creada con coordenadas 2D');
}

export async function updateRackPosition(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const rack = await prisma.racks.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, rack, 200, 'Posición 2D de repisa actualizada');
}

// --- NIVELES (LEVELS) ---
export async function createLevel(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const level = await prisma.levels.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, level, 201, 'Nivel creado exitosamente');
}

// --- CASILLEROS (STORAGE LOCATIONS) ---
export async function getStorageLocations(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const locations = await prisma.storage_locations.findMany({
    where: { company_id: companyId, deleted_at: null },
    include: { levels: true },
  });
  return sendSuccess(res, locations);
}

export async function createStorageLocation(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const location = await prisma.storage_locations.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, location, 201, 'Casillero creado exitosamente');
}

// --- MAPA INTERACTIVO 2D (/warehouses/:id/2d-map) ---
export async function getWarehouse2DMap(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const companyId = req.user?.companyId;
  const roleCode = req.user?.roleCode;

  const warehouse = await prisma.warehouses.findFirst({
    where: {
      id,
      ...(roleCode === 'SUPER_ADMIN' ? {} : { company_id: companyId }),
      deleted_at: null,
    },
    include: {
      branches: true,
      zones: {
        where: { deleted_at: null },
        include: {
          aisles: {
            where: { deleted_at: null },
            include: {
              racks: {
                where: { deleted_at: null },
                include: {
                  levels: {
                    where: { deleted_at: null },
                    include: {
                      storage_locations: {
                        where: { deleted_at: null },
                        include: {
                          inventory_items: {
                            include: { products: true, clients: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!warehouse) {
    return sendError(res, 'Bodega no encontrada o sin acceso', 404);
  }

  // Calcular métricas de capacidad global m3 y grilla 2D
  let totalVolumeM3 = 0;
  let occupiedVolumeM3 = 0;
  const racksGrid: any[] = [];

  for (const zone of warehouse.zones) {
    for (const aisle of zone.aisles) {
      for (const rack of aisle.racks) {
        let rackTotalVol = 0;
        let rackOccVol = 0;
        let locationsCount = 0;

        for (const lvl of rack.levels) {
          for (const loc of lvl.storage_locations) {
            const tot = Number(loc.total_volume_m3 || 0);
            const occ = Number(loc.occupied_volume_m3 || 0);
            totalVolumeM3 += tot;
            occupiedVolumeM3 += occ;
            rackTotalVol += tot;
            rackOccVol += occ;
            locationsCount += 1;
          }
        }

        const occupancyPct = rackTotalVol > 0 ? Math.round((rackOccVol / rackTotalVol) * 100) : 0;
        const heatStatus = occupancyPct >= 90 ? 'FULL' : occupancyPct >= 50 ? 'PARTIAL' : 'AVAILABLE';

        racksGrid.push({
          id: rack.id,
          code: rack.code,
          zoneName: zone.name,
          turnoverRate: zone.turnover_rate,
          positionX: rack.position_x,
          positionY: rack.position_y,
          widthUnits: rack.width_units,
          lengthUnits: rack.length_units,
          totalVolumeM3: rackTotalVol,
          occupiedVolumeM3: rackOccVol,
          occupancyPct,
          heatStatus,
          locationsCount,
          levels: rack.levels,
        });
      }
    }
  }

  const globalOccupancyPct = totalVolumeM3 > 0 ? Math.round((occupiedVolumeM3 / totalVolumeM3) * 100) : 0;

  return sendSuccess(res, {
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    warehouseCode: warehouse.code,
    branchName: warehouse.branches?.name || 'N/A',
    metrics: {
      totalVolumeM3: roundTwoDecimals(totalVolumeM3),
      occupiedVolumeM3: roundTwoDecimals(occupiedVolumeM3),
      availableVolumeM3: roundTwoDecimals(totalVolumeM3 - occupiedVolumeM3),
      occupancyPct: globalOccupancyPct,
      racksCount: racksGrid.length,
    },
    racksGrid,
  });
}

function roundTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}
