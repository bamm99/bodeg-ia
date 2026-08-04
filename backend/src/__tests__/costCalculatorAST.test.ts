import { describe, it, expect } from 'vitest';
import { calculateDailyStorageCost, validateASTFormula } from '../services/costCalculator.js';

describe('Fase 4 Backend: Motor de Costos AST, Validador Sintáctico & Liquidación 3PL', () => {
  it('debe validar correctamente una fórmula con variables permitidas en la Whitelist AST', () => {
    const formula = '(base * turnover + maintenance) * seasonal';
    const result = validateASTFormula(formula);

    expect(result.isValid).toBe(true);
    expect(result.allowedVariables).toContain('base');
    expect(result.allowedVariables).toContain('turnover');
  });

  it('debe rechazar fórmulas que intenten invocar variables o funciones no permitidas fuera de la Whitelist', () => {
    const formula = 'base * turnover + process.env.DATABASE_URL';
    const result = validateASTFormula(formula);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Variables no reconocidas');
  });

  it('debe calcular el costo diario usando la expresión personalizada AST en mathjs sandbox', () => {
    const formula = 'base * turnover + 50';
    const variables = {
      daily_base_cost: 200,
      turnover_multiplier: 1.5,
      maintenance_cost_daily: 0,
      energy_cost_daily: 0,
      seasonal_factor: 1,
      occupied_volume_m3: 10,
      total_volume_m3: 100,
      occupancy_ratio: 0.1,
    };

    const result = calculateDailyStorageCost(variables, formula);

    expect(result.isCustomFormulaUsed).toBe(true);
    expect(result.totalDailyCost).toBe(350); // 200 * 1.5 + 50 = 350
  });

  it('debe hacer fallback seguro a la fórmula estándar si la fórmula es inválida', () => {
    const invalidFormula = 'base * + / invalid';
    const variables = {
      daily_base_cost: 100,
      turnover_multiplier: 1,
      maintenance_cost_daily: 20,
      energy_cost_daily: 10,
      seasonal_factor: 1,
      occupied_volume_m3: 5,
      total_volume_m3: 50,
      occupancy_ratio: 0.1,
    };

    const result = calculateDailyStorageCost(variables, invalidFormula);

    expect(result.isCustomFormulaUsed).toBe(false);
    expect(result.totalDailyCost).toBe(130); // (100 * 1 + 20 + 10) * 1 = 130
  });
});
