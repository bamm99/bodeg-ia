import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

// --- EXISTENCIAS ---
export async function getInventoryItems(req: AuthRequest, res: Response) {
  const queryCompanyId = req.query?.company_id ? String(req.query.company_id) : null;
  const companyId = (req.user?.roleCode === 'SUPER_ADMIN' || req.user?.roleCode === 'PLATFORM_ADMIN') && queryCompanyId
    ? queryCompanyId
    : req.user?.companyId;

  const page = Number(req.query?.page || 1);
  const limit = Number(req.query?.limit || 20);
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (companyId) whereClause.company_id = companyId;

  const [items, total] = await Promise.all([
    prisma.inventory_items.findMany({
      where: whereClause,
      include: {
        products: true,
        storage_locations: { include: { levels: { include: { racks: true } } } },
        clients: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.inventory_items.count({ where: whereClause }),
  ]);

  return sendPaginated(res, items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// --- RECEPCIÓN E INGRESO (INBOUND) ---
export async function inboundStock(req: AuthRequest, res: Response) {
  const companyId = req.body?.company_id || req.user?.companyId;
  const userId = req.user?.userId;
  const {
    product_id,
    storage_location_id,
    client_owner_id,
    quantity,
    lot_number,
    expiration_date,
    occupancy_type,
    occupied_m3,
  } = req.body;

  if (!companyId) {
    return sendError(res, 'Debe especificar la empresa para la recepción de mercancía', 400);
  }

  // 1. Obtener cliente por defecto si no viene especificado
  let clientId = client_owner_id;
  if (!clientId) {
    const defaultClient = await prisma.clients.findFirst({
      where: { company_id: companyId, is_internal_company: true },
    });
    clientId = defaultClient?.id;
  }

  if (!clientId) {
    const fallbackClient = await prisma.clients.findFirst({
      where: { company_id: companyId },
    });
    clientId = fallbackClient?.id;
  }

  if (!clientId) {
    return sendError(res, 'No se encontró un cliente propietario registrado para la empresa', 400);
  }

  // 2. Verificar capacidad disponible en el casillero
  const location = await prisma.storage_locations.findUnique({
    where: { id: storage_location_id },
  });

  if (!location || location.deleted_at) {
    return sendError(res, 'El casillero de ubicación especificado no existe', 404);
  }

  const newOccupiedVol = Number(location.occupied_volume_m3) + Number(occupied_m3);
  if (newOccupiedVol > Number(location.total_volume_m3)) {
    return sendError(
      res,
      `Exceso de volumen. Capacidad total: ${location.total_volume_m3} m³, Ocupación propuesta: ${newOccupiedVol.toFixed(2)} m³`,
      400
    );
  }

  // Transacción atómica: Crear item, actualizar casillero y registrar Kardex
  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.inventory_items.create({
      data: {
        company_id: companyId,
        product_id,
        storage_location_id,
        client_owner_id: clientId,
        quantity,
        lot_number: lot_number || null,
        expiration_date: expiration_date ? new Date(expiration_date) : null,
        occupancy_type: occupancy_type || 'BOXES',
        occupied_m3,
      },
    });

    const status = newOccupiedVol >= Number(location.total_volume_m3) * 0.95 ? 'FULL' : 'PARTIAL';
    await tx.storage_locations.update({
      where: { id: storage_location_id },
      data: {
        occupied_volume_m3: newOccupiedVol,
        status,
      },
    });

    const movement = await tx.inventory_movements.create({
      data: {
        company_id: companyId,
        inventory_item_id: item.id,
        movement_type: 'INBOUND',
        destination_location_id: storage_location_id,
        quantity,
        performed_by_user_id: userId,
      },
    });

    return { item, movement };
  });

  return sendSuccess(res, result, 201, 'Ingreso de mercancía (Inbound) registrado exitosamente');
}

// --- REUBICACIÓN (RELOCATE) ---
export async function relocateStock(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { inventory_item_id, destination_location_id, quantity } = req.body;

  const item = await prisma.inventory_items.findUnique({
    where: { id: inventory_item_id },
  });

  if (!item) return sendError(res, 'Item de inventario no encontrado', 404);

  const companyId = item.company_id || req.body?.company_id || req.user?.companyId;

  const sourceLocationId = item.storage_location_id;
  const sourceLocation = await prisma.storage_locations.findUnique({
    where: { id: sourceLocationId },
  });
  const destLocation = await prisma.storage_locations.findUnique({
    where: { id: destination_location_id },
  });

  if (!destLocation) return sendError(res, 'Casillero de destino no encontrado', 404);

  const volTransferred = (Number(item.occupied_m3) / item.quantity) * quantity;

  // Transacción de reubicación
  const result = await prisma.$transaction(async (tx) => {
    // 1. Liberar volumen en origen
    if (sourceLocation) {
      const sourceNewVol = Math.max(0, Number(sourceLocation.occupied_volume_m3) - volTransferred);
      await tx.storage_locations.update({
        where: { id: sourceLocationId },
        data: { occupied_volume_m3: sourceNewVol, status: sourceNewVol === 0 ? 'AVAILABLE' : 'PARTIAL' },
      });
    }

    // 2. Incrementar volumen en destino
    const destNewVol = Number(destLocation.occupied_volume_m3) + volTransferred;
    await tx.storage_locations.update({
      where: { id: destination_location_id },
      data: { occupied_volume_m3: destNewVol, status: destNewVol >= Number(destLocation.total_volume_m3) * 0.95 ? 'FULL' : 'PARTIAL' },
    });

    // 3. Actualizar ubicación del item
    const updatedItem = await tx.inventory_items.update({
      where: { id: inventory_item_id },
      data: { storage_location_id: destination_location_id },
    });

    // 4. Registrar en Kardex
    const movement = await tx.inventory_movements.create({
      data: {
        company_id: companyId,
        inventory_item_id: item.id,
        movement_type: 'RELOCATION',
        source_location_id: sourceLocationId,
        destination_location_id,
        quantity,
        performed_by_user_id: userId,
      },
    });

    return { item: updatedItem, movement };
  });

  return sendSuccess(res, result, 200, 'Mercancía reubicada exitosamente');
}

// --- DESPACHO / SALIDA (OUTBOUND BIFURCADO) ---
export async function outboundStock(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { inventory_item_id, quantity, dispatch_request_id } = req.body;

  const item = await prisma.inventory_items.findUnique({
    where: { id: inventory_item_id },
    include: { clients: true },
  });

  if (!item) return sendError(res, 'Item de inventario no encontrado', 404);
  if (quantity > item.quantity) {
    return sendError(res, `Stock insuficiente. Disponible: ${item.quantity}`, 400);
  }

  const companyId = item.company_id || req.body?.company_id || req.user?.companyId;

  // BIFURCACIÓN DE ACCESO: Si pertenece a un cliente 3PL externo, exige solicitud en estado APPROVED
  const is3PLExternal = item.clients && !item.clients.is_internal_company;
  if (is3PLExternal) {
    if (!dispatch_request_id) {
      return sendError(
        res,
        'El despacho de mercancía 3PL pertenece a un cliente externo y exige una solicitud previa autorizada (dispatch_request_id en estado APPROVED)',
        403
      );
    }

    const request = await prisma.dispatch_requests.findUnique({
      where: { id: dispatch_request_id },
    });

    if (!request || request.status !== 'APPROVED') {
      return sendError(
        res,
        'La solicitud de despacho indicada no existe o no se encuentra en estado APPROVED',
        403
      );
    }
  }

  const volFreed = (Number(item.occupied_m3) / item.quantity) * quantity;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Liberar volumen en casillero
    const location = await tx.storage_locations.findUnique({ where: { id: item.storage_location_id } });
    if (location) {
      const newVol = Math.max(0, Number(location.occupied_volume_m3) - volFreed);
      await tx.storage_locations.update({
        where: { id: item.storage_location_id },
        data: { occupied_volume_m3: newVol, status: newVol === 0 ? 'AVAILABLE' : 'PARTIAL' },
      });
    }

    // 2. Decrementar o eliminar item
    let updatedItem;
    if (quantity === item.quantity) {
      updatedItem = await tx.inventory_items.delete({ where: { id: inventory_item_id } });
    } else {
      updatedItem = await tx.inventory_items.update({
        where: { id: inventory_item_id },
        data: {
          quantity: item.quantity - quantity,
          occupied_m3: Number(item.occupied_m3) - volFreed,
        },
      });
    }

    // 3. Marcar solicitud 3PL como FULFILLED si corresponde
    if (dispatch_request_id) {
      await tx.dispatch_requests.update({
        where: { id: dispatch_request_id },
        data: { status: 'FULFILLED' },
      });
    }

    // 4. Registrar Kardex Outbound
    const movement = await tx.inventory_movements.create({
      data: {
        company_id: companyId,
        inventory_item_id: item.id,
        movement_type: 'OUTBOUND',
        source_location_id: item.storage_location_id,
        quantity,
        performed_by_user_id: userId,
      },
    });

    return { item: updatedItem, movement };
  });

  return sendSuccess(res, result, 200, 'Salida/Despacho registrado en Kardex');
}

// --- GESTIÓN DE SOLICITUDES DE DESPACHO 3PL ---
export async function getDispatchRequests(req: AuthRequest, res: Response) {
  const queryCompanyId = req.query?.company_id ? String(req.query.company_id) : null;
  const companyId = (req.user?.roleCode === 'SUPER_ADMIN' || req.user?.roleCode === 'PLATFORM_ADMIN') && queryCompanyId
    ? queryCompanyId
    : req.user?.companyId;

  const whereClause: any = {};
  if (companyId) whereClause.company_id = companyId;

  const requests = await prisma.dispatch_requests.findMany({
    where: whereClause,
    include: {
      clients: { select: { id: true, name: true, tax_id: true } },
      products: { select: { id: true, sku: true, name: true } },
      users_dispatch_requests_requested_by_user_idTousers: { select: { full_name: true, email: true } },
      users_dispatch_requests_approved_by_user_idTousers: { select: { full_name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  return sendSuccess(res, requests);
}

export async function createDispatchRequest(req: AuthRequest, res: Response) {
  const queryCompanyId = req.body?.company_id || req.query?.company_id;
  const companyId = (req.user?.roleCode === 'SUPER_ADMIN' || req.user?.roleCode === 'PLATFORM_ADMIN') && queryCompanyId
    ? queryCompanyId
    : req.user?.companyId;
  const userId = req.user?.userId;
  const { product_id, client_id, quantity, notes } = req.body;

  if (!companyId) {
    return sendError(res, 'Debe especificar la empresa para crear la solicitud de despacho', 400);
  }

  let targetClientId = client_id;
  if (!targetClientId) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    targetClientId = user?.client_id || undefined;
  }

  if (!targetClientId && companyId) {
    const defaultClient = await prisma.clients.findFirst({
      where: { company_id: companyId, is_internal_company: false },
    });
    targetClientId = defaultClient?.id;
  }

  const request = await prisma.dispatch_requests.create({
    data: {
      company_id: companyId,
      client_id: targetClientId!,
      product_id,
      quantity,
      requested_by_user_id: userId!,
      status: 'PENDING',
      notes: notes || null,
    },
  });

  return sendSuccess(res, request, 201, 'Solicitud de despacho 3PL enviada (Estado: PENDING)');
}

export async function approveDispatchRequest(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.userId;

  const request = await prisma.dispatch_requests.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approved_by_user_id: userId,
    },
  });

  return sendSuccess(res, request, 200, 'Solicitud de despacho 3PL aprobada (Estado: APPROVED)');
}

export async function rejectDispatchRequest(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  const request = await prisma.dispatch_requests.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejection_reason: rejection_reason || 'Rechazada por supervisor de bodega',
    },
  });

  return sendSuccess(res, request, 200, 'Solicitud de despacho 3PL rechazada (Estado: REJECTED)');
}

// --- HISTÓRICO KARDEX ---
export async function getMovements(req: AuthRequest, res: Response) {
  const queryCompanyId = req.query?.company_id ? String(req.query.company_id) : null;
  const companyId = (req.user?.roleCode === 'SUPER_ADMIN' || req.user?.roleCode === 'PLATFORM_ADMIN') && queryCompanyId
    ? queryCompanyId
    : req.user?.companyId;

  const page = Number(req.query?.page || 1);
  const limit = Number(req.query?.limit || 20);
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (companyId) whereClause.company_id = companyId;

  const [movements, total] = await Promise.all([
    prisma.inventory_movements.findMany({
      where: whereClause,
      include: {
        inventory_items: { include: { products: true } },
        users: { select: { full_name: true, email: true } },
        storage_locations_inventory_movements_source_location_idTostorage_locations: true,
        storage_locations_inventory_movements_destination_location_idTostorage_locations: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.inventory_movements.count({ where: whereClause }),
  ]);

  return sendPaginated(res, movements, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
