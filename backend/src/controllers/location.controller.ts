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

// --- BODEGAS (WAREHOUSES) ---
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
