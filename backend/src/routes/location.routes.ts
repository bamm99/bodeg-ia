import { Router } from 'express';
import {
  getBranches,
  createBranch,
  getWarehouses,
  getWarehouseTree,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createZone,
  createAisle,
  createRack,
  updateRackPosition,
  createLevel,
  getStorageLocations,
  createStorageLocation,
} from '../controllers/location.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createBranchSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
  createZoneSchema,
  createAisleSchema,
  createRackSchema,
  updateRackPositionSchema,
  createLevelSchema,
  createStorageLocationSchema,
} from '../schemas/location.schema.js';

const router = Router();

router.use(authenticateToken);

// Sucursales
router.get('/branches', getBranches);
router.post('/branches', requirePermission('warehouse:manage'), validateRequest({ body: createBranchSchema }), createBranch);

// Bodegas
router.get('/warehouses', getWarehouses);
router.get('/warehouses/:id/tree', getWarehouseTree);
router.post('/warehouses', requirePermission('warehouse:manage'), validateRequest({ body: createWarehouseSchema }), createWarehouse);
router.put('/warehouses/:id', requirePermission('warehouse:manage'), validateRequest({ body: updateWarehouseSchema }), updateWarehouse);
router.delete('/warehouses/:id', requirePermission('warehouse:manage'), deleteWarehouse);

// Zonas
router.post('/zones', requirePermission('warehouse:manage'), validateRequest({ body: createZoneSchema }), createZone);

// Pasillos
router.post('/aisles', requirePermission('warehouse:manage'), validateRequest({ body: createAisleSchema }), createAisle);

// Repisas 2D
router.post('/racks', requirePermission('warehouse:manage'), validateRequest({ body: createRackSchema }), createRack);
router.put('/racks/:id/position', requirePermission('warehouse:manage'), validateRequest({ body: updateRackPositionSchema }), updateRackPosition);

// Niveles
router.post('/levels', requirePermission('warehouse:manage'), validateRequest({ body: createLevelSchema }), createLevel);

// Casilleros (Storage Locations)
router.get('/storage-locations', getStorageLocations);
router.post('/storage-locations', requirePermission('warehouse:manage'), validateRequest({ body: createStorageLocationSchema }), createStorageLocation);

export default router;
