import { Router } from 'express';
import {
  getCostProfiles,
  createCostProfile,
  updateCostProfile,
  deleteCostProfile,
  getCostHistory,
  simulateCost,
  validateFormula,
  calculateBillingPeriod,
} from '../controllers/cost.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createCostProfileSchema, simulateCostSchema } from '../schemas/cost.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/profiles', getCostProfiles);
router.post('/profiles', requirePermission('cost:*'), validateRequest({ body: createCostProfileSchema }), createCostProfile);
router.put('/profiles/:id', requirePermission('cost:*'), updateCostProfile);
router.delete('/profiles/:id', requirePermission('cost:*'), deleteCostProfile);
router.get('/profiles/:id/history', getCostHistory);
router.post('/validate-formula', validateFormula);
router.post('/simulate', validateRequest({ body: simulateCostSchema }), simulateCost);
router.post('/billing/calculate-period', requirePermission('cost:*'), calculateBillingPeriod);

export default router;
