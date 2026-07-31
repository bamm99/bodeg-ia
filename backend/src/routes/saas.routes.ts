import { Router } from 'express';
import {
  getPlans,
  createPlan,
  updatePlan,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getDashboardOverview,
} from '../controllers/saas.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createPlanSchema, updateCompanySchema } from '../schemas/saas.schema.js';

const router = Router();

router.use(authenticateToken);

// Resumen del Dashboard diferenciado por Rol (SUPER_ADMIN, PLATFORM_ADMIN, COMPANY_ADMIN)
router.get('/dashboard-overview', getDashboardOverview);

// Planes
router.get('/plans', getPlans);
router.post('/plans', requirePermission('saas:manage'), validateRequest({ body: createPlanSchema }), createPlan);
router.put('/plans/:id', requirePermission('saas:manage'), updatePlan);

// Empresas
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', requirePermission('saas:manage'), validateRequest({ body: updateCompanySchema }), updateCompany);
router.delete('/companies/:id', requirePermission('saas:manage'), deleteCompany);

export default router;
