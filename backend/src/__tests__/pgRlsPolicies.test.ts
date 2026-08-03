import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, withTenant } from '../db/prisma';

describe('Defensa en Profundidad: PostgreSQL Row-Level Security (RLS)', () => {
  const company1Id = 'c1000000-0000-0000-0000-000000000001'; // Agrosur
  const company2Id = 'c2000000-0000-0000-0000-000000000002'; // Logística Valparaíso

  it('debe permitir consultar registros del tenant autenticado dentro del contexto withTenant', async () => {
    const warehousesCompany1 = await withTenant(company1Id, async (tx) => {
      return tx.warehouses.findMany();
    });

    expect(warehousesCompany1).toBeDefined();
    expect(Array.isArray(warehousesCompany1)).toBe(true);
    
    // Todos los registros retornados deben pertenecer a company1
    warehousesCompany1.forEach((wh) => {
      expect(wh.company_id).toBe(company1Id);
    });
  });

  it('debe aislar estrictamente las consultas entre diferentes tenants impidiendo fugas de datos', async () => {
    const itemsCompany1 = await withTenant(company1Id, async (tx) => {
      return tx.inventory_items.findMany();
    });

    const itemsCompany2 = await withTenant(company2Id, async (tx) => {
      return tx.inventory_items.findMany();
    });

    // Ningún ítem de company1 debe aparecer en la consulta de company2
    itemsCompany1.forEach((item) => {
      expect(item.company_id).toBe(company1Id);
    });

    itemsCompany2.forEach((item) => {
      expect(item.company_id).toBe(company2Id);
    });
  });

  it('debe permitir consultas globales cuando se especifica el modo BYPASS (para Super Admin)', async () => {
    const allWarehouses = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL app.current_company_id = 'BYPASS';");
      return tx.warehouses.findMany();
    });

    expect(allWarehouses).toBeDefined();
    expect(allWarehouses.length).toBeGreaterThan(0);
  });
});
