import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

// --- CLIENTES 3PL / PROPIETARIOS ---
export async function getClients(req: AuthRequest, res: Response) {
  const queryCompanyId = req.query?.company_id ? String(req.query.company_id) : null;
  const companyId = (req.user?.roleCode === 'SUPER_ADMIN' || req.user?.roleCode === 'PLATFORM_ADMIN') && queryCompanyId
    ? queryCompanyId
    : req.user?.companyId;

  const whereClause: any = { deleted_at: null };
  if (companyId) whereClause.company_id = companyId;

  const clients = await prisma.clients.findMany({
    where: whereClause,
    include: {
      users: { select: { id: true, email: true, full_name: true, is_active: true } },
      companies: true,
    },
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

export async function updateClient(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const client = await prisma.clients.update({
    where: { id },
    data: req.body,
  });
  return sendSuccess(res, client, 200, 'Cliente actualizado');
}

export async function deleteClient(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.clients.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
  return sendSuccess(res, null, 200, 'Cliente eliminado (soft-delete)');
}

export async function inviteClientToPortal(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  const client = await prisma.clients.findFirst({
    where: { id, ...(companyId ? { company_id: companyId } : {}), deleted_at: null },
  });

  if (!client) {
    return sendError(res, 'Cliente 3PL no encontrado o sin acceso', 404);
  }

  // 1. Obtener o crear rol CLIENT_VIEWER para esta empresa
  let clientViewerRole = await prisma.roles.findFirst({
    where: { company_id: client.company_id, code: 'CLIENT_VIEWER' },
  });

  if (!clientViewerRole) {
    clientViewerRole = await prisma.roles.create({
      data: {
        company_id: client.company_id,
        code: 'CLIENT_VIEWER',
        name: `Cliente 3PL Portal`,
        permissions: ['inventory:read_own_stock'],
      },
    });
  }

  // 2. Comprobar si ya existe un usuario de portal para este cliente
  const sanitizedTax = client.tax_id ? client.tax_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : id.substring(0, 8);
  const portalEmail = `cliente.${sanitizedTax}@bodegia.cl`;

  let portalUser = await prisma.users.findFirst({
    where: { client_id: client.id, deleted_at: null },
  });

  const tempPassword = 'admin123';

  if (!portalUser) {
    const password_hash = await bcrypt.hash(tempPassword, 10);
    portalUser = await prisma.users.create({
      data: {
        primary_company_id: client.company_id,
        client_id: client.id,
        role_id: clientViewerRole.id,
        email: portalEmail,
        password_hash,
        full_name: `Portal Cliente (${client.name})`,
      },
    });
  }

  return sendSuccess(
    res,
    {
      clientId: client.id,
      clientName: client.name,
      portalEmail: portalUser.email,
      tempPassword,
      loginUrl: 'http://localhost:5173/login',
      invitedAt: new Date().toISOString(),
    },
    200,
    'Enlace e invitación a Portal de Autoservicio 3PL generado exitosamente'
  );
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
