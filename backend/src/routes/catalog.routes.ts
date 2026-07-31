import { Router } from 'express';
import {
  getClients,
  createClient,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/catalog.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createClientSchema,
  createProductSchema,
  updateProductSchema,
} from '../schemas/catalog.schema.js';

const router = Router();

router.use(authenticateToken);

// Clientes 3PL
router.get('/clients', getClients);
router.post('/clients', requirePermission('catalog:manage'), validateRequest({ body: createClientSchema }), createClient);

// Productos
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', requirePermission('catalog:manage'), validateRequest({ body: createProductSchema }), createProduct);
router.put('/products/:id', requirePermission('catalog:manage'), validateRequest({ body: updateProductSchema }), updateProduct);
router.delete('/products/:id', requirePermission('catalog:manage'), deleteProduct);

export default router;
