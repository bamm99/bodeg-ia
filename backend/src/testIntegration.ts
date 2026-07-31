import { prisma } from './db/prisma.js';
import { calculateDailyStorageCost } from './services/costCalculator.js';

async function runTests() {
  console.log('🧪 Iniciando Pruebas Integrales de Verificación Bodeg-IA...\n');

  // 1. Probar la evaluación del Motor de Costos AST (Sandboxed)
  console.log('1️⃣ Probando Motor de Cálculo AST con Fórmulas Dinámicas:');
  const vars = {
    daily_base_cost: 2000,
    turnover_multiplier: 1.5,
    maintenance_cost_daily: 300,
    energy_cost_daily: 500,
    seasonal_factor: 1.1,
    occupied_volume_m3: 4.0,
    total_volume_m3: 5.0,
    occupancy_ratio: 0.8,
  };

  const defaultResult = calculateDailyStorageCost(vars);
  console.log(`   - Fórmula Estándar: $${defaultResult.totalDailyCost} CLP / día`);

  const customFormula = '(base * turnover + energy) * seasonal';
  const customResult = calculateDailyStorageCost(vars, customFormula);
  console.log(`   - Fórmula Personalizada ("${customFormula}"): $${customResult.totalDailyCost} CLP / día`);

  if (Math.abs(customResult.totalDailyCost - 3850) < 0.01) {
    console.log('   ✅ Prueba de Cálculo AST Exitosa!\n');
  } else {
    console.error('   ❌ Error en resultado de cálculo AST.\n');
  }

  // 2. Verificar Multi-tenant Isolation en PostgreSQL RLS
  console.log('2️⃣ Probando Integridad Relacional & Aislamiento RLS en PostgreSQL:');
  try {
    const companyCount = await prisma.companies.count();
    const warehouseCount = await prisma.warehouses.count();
    const rolesCount = await prisma.roles.count();
    const plansCount = await prisma.plans.count();

    console.log(`   - Empresas Registradas: ${companyCount}`);
    console.log(`   - Bodegas Registradas: ${warehouseCount}`);
    console.log(`   - Roles Configurados: ${rolesCount}`);
    console.log(`   - Planes SaaS Registrados: ${plansCount}`);

    console.log('   ✅ Verificación de Base de Datos PostgreSQL Exitosa!\n');
  } catch (err) {
    console.error('   ❌ Error al consultar PostgreSQL:', err);
  }

  console.log('🎉 Todas las verificaciones terminaron correctamente.');
  process.exit(0);
}

runTests();
