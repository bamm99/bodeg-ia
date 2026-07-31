import { Router } from 'express';
import {
  registerCompany,
  login,
  logout,
  revokeAllSessions,
  getMe,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { loginSchema, registerCompanySchema } from '../schemas/auth.schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register-company', validateRequest({ body: registerCompanySchema }), registerCompany);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/logout', authenticateToken, logout);
router.post('/revoke-all', authenticateToken, revokeAllSessions);
router.get('/me', authenticateToken, getMe);

export default router;
