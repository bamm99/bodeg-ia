import { Router } from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignWarehouseToUser,
} from '../controllers/user.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createRoleSchema,
  updateRoleSchema,
  createUserSchema,
  updateUserSchema,
  assignWarehouseSchema,
} from '../schemas/user.schema.js';

const router = Router();

router.use(authenticateToken);

// Roles
router.get('/roles', getRoles);
router.post('/roles', requirePermission('role:create'), validateRequest({ body: createRoleSchema }), createRole);
router.put('/roles/:id', requirePermission('role:update'), validateRequest({ body: updateRoleSchema }), updateRole);
router.delete('/roles/:id', requirePermission('role:delete'), deleteRole);

// Usuarios
router.get('/users', requirePermission('user:read'), getUsers);
router.post('/users', requirePermission('user:create'), validateRequest({ body: createUserSchema }), createUser);
router.put('/users/:id', requirePermission('user:update'), validateRequest({ body: updateUserSchema }), updateUser);
router.delete('/users/:id', requirePermission('user:delete'), deleteUser);

// Asignaciones por Bodega
router.post('/users/:userId/warehouse-assignments', requirePermission('user:update'), validateRequest({ body: assignWarehouseSchema }), assignWarehouseToUser);

export default router;
