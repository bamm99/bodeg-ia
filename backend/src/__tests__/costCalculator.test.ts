import { describe, it, expect } from 'vitest';
import { calculateDailyStorageCost, CostVariables } from '../services/costCalculator.js';

describe('Motor de Cálculo de Costos AST (costCalculator.ts)', () => {
  const baseVariables: CostVariables = {
    daily_base_cost: 2000,
    turnover_multiplier: 1.5,
    maintenance_cost_daily: 300,
    energy_cost_daily: 500,
    seasonal_factor: 1.1,
    occupied_volume_m3: 4.0,
    total_volume_m3: 5.0,
    occupancy_ratio: 0.8,
  };

  it('debe calcular correctamente el costo con la fórmula estándar por defecto', () => {
    const result = calculateDailyStorageCost(baseVariables);
    // Fórmula: (2000 * 1.5 + 300 + 500) * 1.1 = (3000 + 800) * 1.1 = 3800 * 1.1 = 4180
    expect(result.totalDailyCost).toBe(4180);
    expect(result.isCustomFormulaUsed).toBe(false);
  });

  it('debe evaluar correctamente una fórmula AST personalizada válida', () => {
    const customFormula = '(base * turnover + energy) * seasonal';
    const result = calculateDailyStorageCost(baseVariables, customFormula);
    // (2000 * 1.5 + 500) * 1.1 = 3500 * 1.1 = 3850
    expect(result.totalDailyCost).toBe(3850);
    expect(result.isCustomFormulaUsed).toBe(true);
  });

  it('debe hacer fallback seguro a la fórmula estándar si se ingresa una fórmula sintácticamente inválida', () => {
    const invalidFormula = 'base * + / invalid_syntax ???';
    const result = calculateDailyStorageCost(baseVariables, invalidFormula);
    expect(result.totalDailyCost).toBe(4180);
    expect(result.isCustomFormulaUsed).toBe(false);
  });

  it('debe evitar valores negativos en el resultado del cálculo', () => {
    const negativeFormula = 'base - 999999';
    const result = calculateDailyStorageCost(baseVariables, negativeFormula);
    expect(result.totalDailyCost).toBe(0);
    expect(result.isCustomFormulaUsed).toBe(true);
  });
});
