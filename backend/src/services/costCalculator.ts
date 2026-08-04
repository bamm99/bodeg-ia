import { create, all } from 'mathjs';

const math = create(all);

export interface CostVariables {
  daily_base_cost: number;
  turnover_multiplier: number;
  maintenance_cost_daily: number;
  energy_cost_daily: number;
  seasonal_factor: number;
  occupied_volume_m3: number;
  total_volume_m3: number;
  occupancy_ratio: number;
}

/**
 * Calculador de Costo Diario de Almacenaje
 * Evalúa expresiones personalizadas de forma aislada y segura usando AST Parsing sin eval()
 */
export function calculateDailyStorageCost(
  variables: CostVariables,
  customFormula?: string | null
): { totalDailyCost: number; isCustomFormulaUsed: boolean } {
  const scope = {
    base: variables.daily_base_cost,
    turnover: variables.turnover_multiplier,
    maintenance: variables.maintenance_cost_daily,
    energy: variables.energy_cost_daily,
    seasonal: variables.seasonal_factor,
    occupied_m3: variables.occupied_volume_m3,
    total_m3: variables.total_volume_m3,
    occupancy_pct: variables.occupancy_ratio,
  };

  // 1. Fórmula por defecto si no hay fórmula personalizada válida
  if (!customFormula || customFormula.trim() === '') {
    const defaultCost =
      (variables.daily_base_cost * variables.turnover_multiplier +
        variables.maintenance_cost_daily +
        variables.energy_cost_daily) *
      variables.seasonal_factor;
    return {
      totalDailyCost: Number(defaultCost.toFixed(2)),
      isCustomFormulaUsed: false,
    };
  }

  // 2. Evaluación segura mediante Math.js AST parser
  try {
    const compiled = math.parse(customFormula);
    const result = compiled.evaluate(scope);
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return {
        totalDailyCost: Number(Math.max(0, result).toFixed(2)),
        isCustomFormulaUsed: true,
      };
    }
  } catch (err) {
    console.error('Error al evaluar la fórmula personalizada de costo:', err);
  }

  // Fallback seguro a fórmula estándar si falla el parseo
  const fallbackCost =
    (variables.daily_base_cost * variables.turnover_multiplier +
      variables.maintenance_cost_daily +
      variables.energy_cost_daily) *
    variables.seasonal_factor;

  return {
    totalDailyCost: Number(fallbackCost.toFixed(2)),
    isCustomFormulaUsed: false,
  };
}

/**
 * Validador Sintáctico AST y Sandbox Whitelist
 */
export function validateASTFormula(formula: string): { isValid: boolean; error?: string; allowedVariables: string[] } {
  const allowedVariables = ['base', 'turnover', 'maintenance', 'energy', 'seasonal', 'occupied_m3', 'total_m3', 'occupancy_pct'];
  if (!formula || formula.trim() === '') {
    return { isValid: false, error: 'La expresión de la fórmula no puede estar vacía', allowedVariables };
  }

  try {
    const node = math.parse(formula);
    const symbols: string[] = [];
    node.traverse((n: any) => {
      if (n.isSymbolNode) {
        symbols.push(n.name);
      }
    });

    const invalidSymbols = symbols.filter((s) => !allowedVariables.includes(s));
    if (invalidSymbols.length > 0) {
      return {
        isValid: false,
        error: `Variables no reconocidas: ${invalidSymbols.join(', ')}. Variables permitidas: ${allowedVariables.join(', ')}`,
        allowedVariables,
      };
    }

    return { isValid: true, allowedVariables };
  } catch (err: any) {
    return { isValid: false, error: `Error de sintaxis matemática: ${err.message}`, allowedVariables };
  }
}
