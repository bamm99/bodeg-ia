import { Router } from 'express';
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getDashboardOverview,
  assignExecutivePortfolio,
  getExecutivePortfolio,
} from '../controllers/saas.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createPlanSchema, updateCompanySchema } from '../schemas/saas.schema.js';

const router = Router();

router.use(authenticateToken);

// Resumen del Dashboard diferenciado por Rol (SUPER_ADMIN, PLATFORM_ADMIN, COMPANY_ADMIN)
router.get('/dashboard-overview', getDashboardOverview);

// Planes SaaS
router.get('/plans', getPlans);
router.post('/plans', requirePermission('saas:manage'), validateRequest({ body: createPlanSchema }), createPlan);
router.put('/plans/:id', requirePermission('saas:manage'), updatePlan);
router.delete('/plans/:id', requirePermission('saas:manage'), deletePlan);

// Empresas SaaS
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', requirePermission('saas:manage'), validateRequest({ body: updateCompanySchema }), updateCompany);
router.delete('/companies/:id', requirePermission('saas:manage'), deleteCompany);

// Asignación de Cartola de Ejecutivos
router.post('/executives/assign', requirePermission('saas:manage'), assignExecutivePortfolio);
router.get('/executives/:executiveUserId/portfolio', requirePermission('saas:manage'), getExecutivePortfolio);

export default router;
