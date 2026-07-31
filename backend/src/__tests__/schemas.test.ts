import { describe, it, expect } from 'vitest';
import { loginSchema, registerCompanySchema } from '../schemas/auth.schema.js';
import { createRackSchema, createStorageLocationSchema } from '../schemas/location.schema.js';
import { createCostProfileSchema } from '../schemas/cost.schema.js';
import { inboundStockSchema } from '../schemas/inventory.schema.js';

describe('Validaciones DTO con Esquemas Zod', () => {
  describe('auth.schema.ts', () => {
    it('debe validar un login correcto', () => {
      const valid = loginSchema.safeParse({ email: 'test@bodegia.cl', password: 'password123' });
      expect(valid.success).toBe(true);
    });

    it('debe rechazar un email inválido', () => {
      const invalid = loginSchema.safeParse({ email: 'no-es-email', password: '123' });
      expect(invalid.success).toBe(false);
    });
  });

  describe('location.schema.ts', () => {
    it('debe validar la creación de repisa 2D con valores por defecto', () => {
      const valid = createRackSchema.safeParse({
        aisle_id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'REP-01',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.position_x).toBe(0);
        expect(valid.data.width_units).toBe(1);
      }
    });

    it('debe validar la creación de un casillero', () => {
      const valid = createStorageLocationSchema.safeParse({
        level_id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'A1-N1-POS1',
        total_volume_m3: 5.5,
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('cost.schema.ts (Arco Exclusivo)', () => {
    it('debe aceptar un perfil de costo asociado a EXACTAMENTE 1 entidad (zone_id)', () => {
      const valid = createCostProfileSchema.safeParse({
        zone_id: '123e4567-e89b-12d3-a456-426614174000',
        daily_base_cost: 2000,
      });
      expect(valid.success).toBe(true);
    });

    it('debe rechazar un perfil de costo asociado a MÚLTIPLES entidades simultáneamente', () => {
      const invalid = createCostProfileSchema.safeParse({
        zone_id: '123e4567-e89b-12d3-a456-426614174000',
        rack_id: '223e4567-e89b-12d3-a456-426614174000',
        daily_base_cost: 2000,
      });
      expect(invalid.success).toBe(false);
    });

    it('debe rechazar un perfil de costo asociado a NINGUNA entidad', () => {
      const invalid = createCostProfileSchema.safeParse({
        daily_base_cost: 2000,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('inventory.schema.ts', () => {
    it('debe validar un ingreso Inbound correcto', () => {
      const valid = inboundStockSchema.safeParse({
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        storage_location_id: '223e4567-e89b-12d3-a456-426614174000',
        quantity: 50,
        occupied_m3: 2.5,
      });
      expect(valid.success).toBe(true);
    });
  });
});
