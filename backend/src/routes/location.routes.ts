import { Router } from 'express';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getWarehouses,
  getMyAssignedWarehouses,
  getWarehouseTree,
  getWarehouse2DMap,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createZone,
  updateZone,
  deleteZone,
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

// Bodegas asignadas al usuario actual
router.get('/my-assigned-warehouses', getMyAssignedWarehouses);

// Sucursales
router.get('/branches', getBranches);
router.post('/branches', requirePermission('warehouse:manage'), validateRequest({ body: createBranchSchema }), createBranch);
router.put('/branches/:id', requirePermission('warehouse:manage'), updateBranch);
router.delete('/branches/:id', requirePermission('warehouse:manage'), deleteBranch);

// Bodegas
router.get('/warehouses', getWarehouses);
router.get('/warehouses/:id/tree', getWarehouseTree);
router.get('/warehouses/:id/2d-map', getWarehouse2DMap);
router.post('/warehouses', requirePermission('warehouse:manage'), validateRequest({ body: createWarehouseSchema }), createWarehouse);
router.put('/warehouses/:id', requirePermission('warehouse:manage'), validateRequest({ body: updateWarehouseSchema }), updateWarehouse);
router.delete('/warehouses/:id', requirePermission('warehouse:manage'), deleteWarehouse);

// Zonas
router.post('/zones', requirePermission('warehouse:manage'), validateRequest({ body: createZoneSchema }), createZone);
router.put('/zones/:id', requirePermission('warehouse:manage'), updateZone);
router.delete('/zones/:id', requirePermission('warehouse:manage'), deleteZone);

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
