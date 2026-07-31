import { Router, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Obtener todas las bodegas de la empresa del usuario
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;

  try {
    const warehouses = await prisma.warehouses.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        branches: true,
        zones: {
          include: {
            aisles: {
              include: {
                racks: {
                  include: {
                    levels: {
                      include: {
                        storage_locations: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.json({ warehouses });
  } catch (err) {
    console.error('Error al listar bodegas:', err);
    return res.status(500).json({ error: 'Error al consultar bodegas.' });
  }
});

// Obtener árbol jerárquico completo y plano 2D de una bodega
router.get('/:id/tree', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  try {
    const warehouse = await prisma.warehouses.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        branches: true,
        zones: {
          where: { deleted_at: null },
          include: {
            cost_profiles: { where: { is_active: true } },
            aisles: {
              where: { deleted_at: null },
              include: {
                racks: {
                  where: { deleted_at: null },
                  include: {
                    cost_profiles: { where: { is_active: true } },
                    levels: {
                      where: { deleted_at: null },
                      include: {
                        cost_profiles: { where: { is_active: true } },
                        storage_locations: {
                          where: { deleted_at: null },
                          include: {
                            inventory_items: {
                              include: {
                                products: true,
                                clients: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Bodega no encontrada.' });
    }

    return res.json({ warehouse });
  } catch (err) {
    console.error('Error al obtener jerarquía de bodega:', err);
    return res.status(500).json({ error: 'Error al cargar mapa y estructura de bodega.' });
  }
});

// Crear una nueva bodega
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  const { name, code, branch_id, is_cost_tracking_enabled } = req.body;

  if (!name || !code || !companyId) {
    return res.status(400).json({ error: 'Nombre y código de bodega son obligatorios.' });
  }

  try {
    const warehouse = await prisma.warehouses.create({
      data: {
        company_id: companyId,
        branch_id: branch_id || null,
        name,
        code,
        is_cost_tracking_enabled: Boolean(is_cost_tracking_enabled),
      },
    });

    return res.status(201).json({ warehouse });
  } catch (err) {
    console.error('Error al crear bodega:', err);
    return res.status(500).json({ error: 'Error al crear la bodega.' });
  }
});

// Crear una Zona/Sector dentro de una bodega
router.post('/zones', authenticateToken, async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  const { warehouse_id, name, turnover_rate } = req.body;

  if (!warehouse_id || !name || !companyId) {
    return res.status(400).json({ error: 'warehouse_id y nombre son requeridos.' });
  }

  try {
    const zone = await prisma.zones.create({
      data: {
        company_id: companyId,
        warehouse_id,
        name,
        turnover_rate: turnover_rate || 'MEDIUM',
      },
    });

    return res.status(201).json({ zone });
  } catch (err) {
    return res.status(500).json({ error: 'Error al crear la zona.' });
  }
});

// Crear una Repisa/Estantería con coordenadas 2D
router.post('/racks', authenticateToken, async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  const { aisle_id, code, position_x, position_y, width_units, length_units, rotation_deg } =
    req.body;

  if (!aisle_id || !code || !companyId) {
    return res.status(400).json({ error: 'aisle_id y código son requeridos.' });
  }

  try {
    const rack = await prisma.racks.create({
      data: {
        company_id: companyId,
        aisle_id,
        code,
        position_x: position_x || 0,
        position_y: position_y || 0,
        width_units: width_units || 1,
        length_units: length_units || 1,
        rotation_deg: rotation_deg || 0,
      },
    });

    return res.status(201).json({ rack });
  } catch (err) {
    return res.status(500).json({ error: 'Error al crear la repisa.' });
  }
});

export default router;
