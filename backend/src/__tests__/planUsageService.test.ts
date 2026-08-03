import { describe, it, expect } from 'vitest';
import { getCompanyUsageStats } from '../services/planUsageService';

describe('Servicio de Consumo de Plan SaaS (planUsageService.ts)', () => {
  const agrosurCompanyId = 'c1000000-0000-0000-0000-000000000001';

  it('debe obtener estadísticas de consumo y calcular porcentajes de uso para una empresa', async () => {
    const stats = await getCompanyUsageStats(agrosurCompanyId);

    expect(stats).toBeDefined();
    expect(stats.companyId).toBe(agrosurCompanyId);
    expect(typeof stats.planName).toBe('string');
    expect(typeof stats.usage.warehousesCount).toBe('number');
    expect(typeof stats.usage.usersCount).toBe('number');
    expect(typeof stats.usage.storageM3Occupied).toBe('number');

    expect(stats.limits.maxWarehouses).toBeGreaterThan(0);
    expect(stats.limits.maxUsers).toBeGreaterThan(0);
    expect(stats.limits.maxStorageM3).toBeGreaterThan(0);

    expect(typeof stats.percentages.warehousesPercent).toBe('number');
    expect(typeof stats.percentages.usersPercent).toBe('number');
    expect(typeof stats.percentages.storageM3Percent).toBe('number');
    expect(typeof stats.is90PercentWarning).toBe('boolean');
  });
});
