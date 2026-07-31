import { Router } from 'express';
import {
  getInventoryItems,
  inboundStock,
  relocateStock,
  outboundStock,
  getMovements,
} from '../controllers/inventory.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  inboundStockSchema,
  relocateStockSchema,
  outboundStockSchema,
} from '../schemas/inventory.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/items', getInventoryItems);
router.post('/inbound', requirePermission('inventory:*'), validateRequest({ body: inboundStockSchema }), inboundStock);
router.post('/relocate', requirePermission('inventory:*'), validateRequest({ body: relocateStockSchema }), relocateStock);
router.post('/outbound', requirePermission('inventory:*'), validateRequest({ body: outboundStockSchema }), outboundStock);
router.get('/movements', getMovements);

export default router;
