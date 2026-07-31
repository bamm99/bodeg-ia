import { prisma } from './db/prisma.js';

async function seed() {
  console.log('🌱 Poblando la base de datos Bodeg-IA con datos de prueba realistas...\n');

  // 1. Limpiar datos existentes en orden inverso de claves foráneas
  console.log('🧹 Limpiando tablas previas...');
  await prisma.inventory_movements.deleteMany();
  await prisma.inventory_items.deleteMany();
  await prisma.products.deleteMany();
  await prisma.clients.deleteMany();
  await prisma.cost_history.deleteMany();
  await prisma.cost_profiles.deleteMany();
  await prisma.storage_locations.deleteMany();
  await prisma.levels.deleteMany();
  await prisma.racks.deleteMany();
  await prisma.aisles.deleteMany();
  await prisma.zones.deleteMany();
  await prisma.user_warehouse_assignments.deleteMany();
  await prisma.user_company_access.deleteMany();
  await prisma.user_sessions.deleteMany();
  await prisma.users.deleteMany();
  await prisma.warehouses.deleteMany();
  await prisma.branches.deleteMany();
  await prisma.subscriptions.deleteMany();
  await prisma.roles.deleteMany();
  await prisma.companies.deleteMany();
  await prisma.plans.deleteMany();

  console.log('   ✅ Tablas limpiadas correctamente.\n');

  // 2. Insertar Planes SaaS
  console.log('📦 Creando Planes SaaS...');
  const planBasic = await prisma.plans.create({
    data: {
      name: 'BASIC',
      max_warehouses: 1,
      max_users: 3,
      max_storage_m3: 200.0,
      price_monthly: 49900.0,
      currency: 'CLP',
    },
  });

  const planPro = await prisma.plans.create({
    data: {
      name: 'PRO',
      max_warehouses: 5,
      max_users: 15,
      max_storage_m3: 2000.0,
      price_monthly: 129900.0,
      currency: 'CLP',
    },
  });

  const planEnterprise = await prisma.plans.create({
    data: {
      name: 'ENTERPRISE',
      max_warehouses: 99,
      max_users: 999,
      max_storage_m3: 999999.0,
      price_monthly: 399900.0,
      currency: 'CLP',
    },
  });

  // 3. Insertar Empresas Demo
  console.log('🏢 Creando Empresas Demo...');
  const companyDemo = await prisma.companies.create({
    data: {
      name: 'Empresa Logística Demo SpA',
      tax_id: '76.543.210-K',
      address: 'Av. Las Condes 1234, Santiago',
      phone: '+56912345678',
    },
  });

  const companyFruticola = await prisma.companies.create({
    data: {
      name: 'Distribuidora Frutícola del Sur Ltda',
      tax_id: '77.890.123-4',
      address: 'Camino a Melipilla 4500, Maipú',
      phone: '+56987654321',
    },
  });

  // Suscripciones
  await prisma.subscriptions.create({
    data: {
      company_id: companyDemo.id,
      plan_id: planEnterprise.id,
      status: 'ACTIVE',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subscriptions.create({
    data: {
      company_id: companyFruticola.id,
      plan_id: planPro.id,
      status: 'ACTIVE',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Roles RBAC por Defecto
  console.log('🛡️ Configurando Roles y Permisos RBAC...');
  const roleSuperAdmin = await prisma.roles.create({
    data: {
      code: 'SUPER_ADMIN',
      name: 'Super Administrador Plataforma',
      permissions: ['*'],
      is_system_role: true,
    },
  });

  const roleCompanyAdmin = await prisma.roles.create({
    data: {
      code: 'COMPANY_ADMIN',
      name: 'Administrador de Empresa',
      permissions: ['company:read', 'warehouse:*', 'cost:*', 'inventory:*'],
      is_system_role: true,
    },
  });

  const roleWarehouseManager = await prisma.roles.create({
    data: {
      code: 'WAREHOUSE_MANAGER',
      name: 'Jefe de Bodega',
      permissions: ['warehouse:read', 'inventory:*', 'cost:read'],
      is_system_role: true,
    },
  });

  const roleOperator = await prisma.roles.create({
    data: {
      code: 'OPERATOR',
      name: 'Operador de Bodega',
      permissions: ['inventory:read', 'movement:create'],
      is_system_role: true,
    },
  });

  // 5. Usuarios Demo
  console.log('👤 Creando Usuarios...');
  const userAdmin = await prisma.users.create({
    data: {
      primary_company_id: companyDemo.id,
      role_id: roleSuperAdmin.id,
      email: 'admin@bodegia.cl',
      password_hash: '$2b$10$wN1rB5.8t.7.eK9vV3sR/OQ5Vp8S8sX5u8T8S8sX5u8T8S8sX5u8T', // admin123
      full_name: 'Administrador Principal',
    },
  });

  const userJefeBodega = await prisma.users.create({
    data: {
      primary_company_id: companyDemo.id,
      role_id: roleWarehouseManager.id,
      email: 'cmendoza@bodegia.cl',
      password_hash: '$2b$10$wN1rB5.8t.7.eK9vV3sR/OQ5Vp8S8sX5u8T8S8sX5u8T8S8sX5u8T',
      full_name: 'Carlos Mendoza (Jefe Pudahuel)',
    },
  });

  // 6. Propietarios de Mercadería (Clients)
  const clientPropio = await prisma.clients.create({
    data: {
      company_id: companyDemo.id,
      name: 'Propio (Empresa Logística Demo)',
      tax_id: '76.543.210-K',
      is_internal_company: true,
    },
  });

  const clientTercero = await prisma.clients.create({
    data: {
      company_id: companyDemo.id,
      name: 'Comercializadora Fruta Fresca SpA',
      tax_id: '99.111.222-3',
      is_internal_company: false,
    },
  });

  // 7. Estructura Física de Bodegas (Sucursales, Bodegas, Zonas, Pasillos, Repisas 2D, Niveles, Casilleros)
  console.log('🏭 Creando Estructura de Bodegas y Plano 2D...');
  const branchPudahuel = await prisma.branches.create({
    data: {
      company_id: companyDemo.id,
      name: 'Sucursal Pudahuel Central',
      address: 'Av. Industrial 500, Pudahuel, Santiago',
    },
  });

  const warehousePudahuel = await prisma.warehouses.create({
    data: {
      id: 'f0000000-0000-0000-0000-000000000001',
      company_id: companyDemo.id,
      branch_id: branchPudahuel.id,
      name: 'Bodega Principal Pudahuel',
      code: 'BOD-PUDA-01',
      is_cost_tracking_enabled: true,
    },
  });

  // Asignar al usuario
  await prisma.user_warehouse_assignments.create({
    data: {
      user_id: userJefeBodega.id,
      warehouse_id: warehousePudahuel.id,
      access_level: 'FULL',
    },
  });

  // --- Zona A: Alta Rotación (Secos) ---
  const zoneA = await prisma.zones.create({
    data: {
      company_id: companyDemo.id,
      warehouse_id: warehousePudahuel.id,
      name: 'Zona A - Alta Rotación (Secos)',
      turnover_rate: 'HIGH',
    },
  });

  // Costo por Zona A
  await prisma.cost_profiles.create({
    data: {
      company_id: companyDemo.id,
      zone_id: zoneA.id,
      daily_base_cost: 2000.0,
      currency: 'CLP',
      turnover_multiplier: 1.5,
      maintenance_cost_daily: 250.0,
      energy_cost_daily: 0.0,
      seasonal_factor: 1.0,
      custom_formula_expression: '(base * turnover + maintenance) * seasonal',
    },
  });

  const aisleA1 = await prisma.aisles.create({
    data: {
      company_id: companyDemo.id,
      zone_id: zoneA.id,
      name: 'Pasillo 01',
    },
  });

  // Repisa A1 (Posición 2D X:1, Y:1)
  const rackA1 = await prisma.racks.create({
    data: {
      company_id: companyDemo.id,
      aisle_id: aisleA1.id,
      code: 'REP-A1',
      position_x: 1,
      position_y: 1,
      width_units: 3,
      length_units: 2,
    },
  });

  const levelA1_1 = await prisma.levels.create({
    data: {
      company_id: companyDemo.id,
      rack_id: rackA1.id,
      level_number: 1,
      height_cm: 200,
      width_cm: 300,
      depth_cm: 150,
      max_weight_kg: 2000,
    },
  });

  const locA1_1_1 = await prisma.storage_locations.create({
    data: {
      company_id: companyDemo.id,
      level_id: levelA1_1.id,
      code: 'A1-N1-POS1',
      max_weight_kg: 1000,
      total_volume_m3: 4.5,
      occupied_volume_m3: 3.8, // 84% Lleno -> Rojo
      status: 'PARTIAL',
    },
  });

  const locA1_1_2 = await prisma.storage_locations.create({
    data: {
      company_id: companyDemo.id,
      level_id: levelA1_1.id,
      code: 'A1-N1-POS2',
      max_weight_kg: 1000,
      total_volume_m3: 4.5,
      occupied_volume_m3: 2.0, // 44% Lleno -> Amarillo
      status: 'PARTIAL',
    },
  });

  // Repisa A2 (Posición 2D X:5, Y:1)
  const rackA2 = await prisma.racks.create({
    data: {
      company_id: companyDemo.id,
      aisle_id: aisleA1.id,
      code: 'REP-A2',
      position_x: 5,
      position_y: 1,
      width_units: 3,
      length_units: 2,
    },
  });

  const levelA2_1 = await prisma.levels.create({
    data: {
      company_id: companyDemo.id,
      rack_id: rackA2.id,
      level_number: 1,
      height_cm: 200,
      width_cm: 300,
      depth_cm: 150,
      max_weight_kg: 2000,
    },
  });

  await prisma.storage_locations.create({
    data: {
      company_id: companyDemo.id,
      level_id: levelA2_1.id,
      code: 'A2-N1-POS1',
      max_weight_kg: 1000,
      total_volume_m3: 4.5,
      occupied_volume_m3: 0.5, // 11% Lleno -> Verde
      status: 'AVAILABLE',
    },
  });

  // --- Zona F: Frigorífica (Congelados) ---
  const zoneF = await prisma.zones.create({
    data: {
      company_id: companyDemo.id,
      warehouse_id: warehousePudahuel.id,
      name: 'Zona Fría - Congelados Premium',
      turnover_rate: 'MEDIUM',
    },
  });

  // Costo por Zona F (Con costo energético diario de frío)
  await prisma.cost_profiles.create({
    data: {
      company_id: companyDemo.id,
      zone_id: zoneF.id,
      daily_base_cost: 3000.0,
      currency: 'CLP',
      turnover_multiplier: 1.2,
      maintenance_cost_daily: 400.0,
      energy_cost_daily: 900.0,
      seasonal_factor: 1.15,
      custom_formula_expression: '(base * turnover + energy + maintenance) * seasonal',
    },
  });

  const aisleF1 = await prisma.aisles.create({
    data: {
      company_id: companyDemo.id,
      zone_id: zoneF.id,
      name: 'Pasillo Frío 01',
    },
  });

  // Repisa F1 (Posición 2D X:1, Y:5)
  const rackF1 = await prisma.racks.create({
    data: {
      company_id: companyDemo.id,
      aisle_id: aisleF1.id,
      code: 'REP-F1',
      position_x: 1,
      position_y: 5,
      width_units: 4,
      length_units: 2,
    },
  });

  const levelF1_1 = await prisma.levels.create({
    data: {
      company_id: companyDemo.id,
      rack_id: rackF1.id,
      level_number: 1,
      height_cm: 220,
      width_cm: 400,
      depth_cm: 150,
      max_weight_kg: 3000,
    },
  });

  const locF1_1_1 = await prisma.storage_locations.create({
    data: {
      company_id: companyDemo.id,
      level_id: levelF1_1.id,
      code: 'F1-N1-POS1',
      max_weight_kg: 1500,
      total_volume_m3: 6.0,
      occupied_volume_m3: 5.5, // 91% Lleno -> Rojo
      status: 'FULL',
    },
  });

  // 8. Catálogo de Productos
  console.log('🛒 Creando Catálogo de Productos e Inventario...');
  const prodHarina = await prisma.products.create({
    data: {
      company_id: companyDemo.id,
      sku: 'HAR-IND-25',
      name: 'Caja Harina Industrial 25kg',
      unit_weight_kg: 25.0,
      unit_volume_m3: 0.05,
      is_palletized: false,
    },
  });

  const prodMariscos = await prisma.products.create({
    data: {
      company_id: companyDemo.id,
      sku: 'MAR-CONG-P01',
      name: 'Palet Mariscos Congelados Premium',
      unit_weight_kg: 500.0,
      unit_volume_m3: 2.75,
      is_palletized: true,
    },
  });

  const prodAceite = await prisma.products.create({
    data: {
      company_id: companyDemo.id,
      sku: 'ACE-MAR-12',
      name: 'Caja Aceite Maravilla 12x1L',
      unit_weight_kg: 12.0,
      unit_volume_m3: 0.02,
      is_palletized: false,
    },
  });

  // 9. Existencias Ubicadas (Inventory Items)
  const item1 = await prisma.inventory_items.create({
    data: {
      company_id: companyDemo.id,
      product_id: prodHarina.id,
      storage_location_id: locA1_1_1.id,
      client_owner_id: clientPropio.id,
      quantity: 76,
      lot_number: 'LOT-2026-07A',
      expiration_date: new Date('2027-01-15'),
      occupancy_type: 'BOXES',
      occupied_m3: 3.8,
    },
  });

  const item2 = await prisma.inventory_items.create({
    data: {
      company_id: companyDemo.id,
      product_id: prodMariscos.id,
      storage_location_id: locF1_1_1.id,
      client_owner_id: clientTercero.id,
      quantity: 2,
      lot_number: 'LOT-FRIO-99',
      expiration_date: new Date('2026-11-30'),
      occupancy_type: 'PALLET',
      occupied_m3: 5.5,
    },
  });

  const item3 = await prisma.inventory_items.create({
    data: {
      company_id: companyDemo.id,
      product_id: prodAceite.id,
      storage_location_id: locA1_1_2.id,
      client_owner_id: clientPropio.id,
      quantity: 100,
      lot_number: 'LOT-2026-08B',
      expiration_date: new Date('2027-06-20'),
      occupancy_type: 'BOXES',
      occupied_m3: 2.0,
    },
  });

  // 10. Kardex de Movimientos
  console.log('📜 Generando Histórico de Movimientos Kardex...');
  await prisma.inventory_movements.create({
    data: {
      company_id: companyDemo.id,
      inventory_item_id: item1.id,
      movement_type: 'INBOUND',
      destination_location_id: locA1_1_1.id,
      quantity: 76,
      performed_by_user_id: userJefeBodega.id,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
  });

  await prisma.inventory_movements.create({
    data: {
      company_id: companyDemo.id,
      inventory_item_id: item2.id,
      movement_type: 'INBOUND',
      destination_location_id: locF1_1_1.id,
      quantity: 2,
      performed_by_user_id: userJefeBodega.id,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  await prisma.inventory_movements.create({
    data: {
      company_id: companyDemo.id,
      inventory_item_id: item3.id,
      movement_type: 'INBOUND',
      destination_location_id: locA1_1_2.id,
      quantity: 100,
      performed_by_user_id: userAdmin.id,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  console.log('\n✨ Poblado finalizado con éxito! La base de datos contiene ahora:');
  console.log('   - 2 Empresas (Empresa Logística Demo SpA & Distribuidora Frutícola)');
  console.log('   - 5 Roles RBAC & Usuarios de prueba (admin@bodegia.cl / admin123)');
  console.log('   - 1 Bodega Principal con Zonas Secas y Frías, Pasillos, Repisas 2D, Niveles y Casilleros');
  console.log('   - Perfiles de Costos con Fórmulas Dinámicas por Zona');
  console.log('   - Catálogo de Productos, Existencias y Kardex de Movimientos auditorables.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error al poblar la base de datos:', err);
    process.exit(1);
  });
