import { Router } from 'express';
import {
  getInventoryItems,
  inboundStock,
  relocateStock,
  outboundStock,
  getMovements,
  getDispatchRequests,
  createDispatchRequest,
  approveDispatchRequest,
  rejectDispatchRequest,
} from '../controllers/inventory.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotencyMiddleware.js';
import { validateRequest } from '../middleware/validate.js';
import {
  inboundStockSchema,
  relocateStockSchema,
  outboundStockSchema,
} from '../schemas/inventory.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/items', getInventoryItems);
router.post('/inbound', idempotencyMiddleware, requirePermission('inventory:*'), validateRequest({ body: inboundStockSchema }), inboundStock);
router.post('/relocate', idempotencyMiddleware, requirePermission('inventory:*'), validateRequest({ body: relocateStockSchema }), relocateStock);
router.post('/outbound', idempotencyMiddleware, requirePermission('inventory:*'), validateRequest({ body: outboundStockSchema }), outboundStock);
router.get('/movements', getMovements);

// Solicitudes Despacho 3PL
router.get('/dispatch-requests', getDispatchRequests);
router.post('/dispatch-requests', createDispatchRequest);
router.put('/dispatch-requests/:id/approve', requirePermission('inventory:*'), approveDispatchRequest);
router.put('/dispatch-requests/:id/reject', requirePermission('inventory:*'), rejectDispatchRequest);

export default router;
