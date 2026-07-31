import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

// --- CLIENTES 3PL / PROPIETARIOS ---
export async function getClients(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const clients = await prisma.clients.findMany({
    where: { company_id: companyId, deleted_at: null },
  });
  return sendSuccess(res, clients);
}

export async function createClient(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const client = await prisma.clients.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, client, 201, 'Cliente propietario registrado exitosamente');
}

// --- PRODUCTOS ---
export async function getProducts(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const search = (req.query.search as string) || '';
  const skip = (page - 1) * limit;

  const whereClause = {
    company_id: companyId,
    deleted_at: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.products.count({ where: whereClause }),
  ]);

  return sendPaginated(res, products, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getProductById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const product = await prisma.products.findUnique({ where: { id } });
  if (!product || product.deleted_at) return sendError(res, 'Producto no encontrado', 404);
  return sendSuccess(res, product);
}

export async function createProduct(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const product = await prisma.products.create({
    data: { ...req.body, company_id: companyId },
  });
  return sendSuccess(res, product, 201, 'Producto creado exitosamente');
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const product = await prisma.products.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, product, 200, 'Producto actualizado');
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.products.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
  return sendSuccess(res, null, 200, 'Producto eliminado (soft-delete)');
}
