import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

// --- EXISTENCIAS ---
export async function getInventoryItems(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.inventory_items.findMany({
      where: { company_id: companyId },
      include: {
        products: true,
        storage_locations: { include: { levels: { include: { racks: true } } } },
        clients: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.inventory_items.count({ where: { company_id: companyId } }),
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
  const companyId = req.user?.companyId;
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

  // 1. Obtener cliente por defecto si no viene especificado
  let clientId = client_owner_id;
  if (!clientId) {
    const defaultClient = await prisma.clients.findFirst({
      where: { company_id: companyId, is_internal_company: true },
    });
    clientId = defaultClient?.id;
  }

  if (!clientId) {
    return sendError(res, 'No se encontró un cliente registrado para la empresa', 400);
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
        company_id: companyId!,
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
        company_id: companyId!,
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
  const companyId = req.user?.companyId;
  const userId = req.user?.userId;
  const { inventory_item_id, destination_location_id, quantity } = req.body;

  const item = await prisma.inventory_items.findUnique({
    where: { id: inventory_item_id },
  });

  if (!item) return sendError(res, 'Item de inventario no encontrado', 404);

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
        company_id: companyId!,
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

// --- DESPACHO / SALIDA (OUTBOUND) ---
export async function outboundStock(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const userId = req.user?.userId;
  const { inventory_item_id, quantity } = req.body;

  const item = await prisma.inventory_items.findUnique({
    where: { id: inventory_item_id },
  });

  if (!item) return sendError(res, 'Item de inventario no encontrado', 404);
  if (quantity > item.quantity) {
    return sendError(res, `Stock insuficiente. Disponible: ${item.quantity}`, 400);
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

    // 3. Registrar Kardex Outbound
    const movement = await tx.inventory_movements.create({
      data: {
        company_id: companyId!,
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

// --- HISTÓRICO KARDEX ---
export async function getMovements(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    prisma.inventory_movements.findMany({
      where: { company_id: companyId },
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
    prisma.inventory_movements.count({ where: { company_id: companyId } }),
  ]);

  return sendPaginated(res, movements, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
