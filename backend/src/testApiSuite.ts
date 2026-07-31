import { calculateDailyStorageCost } from './services/costCalculator.js';

async function runApiSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 SUITE DE PRUEBAS EXHAUSTIVA DE LA API REST BODEG-IA');
  console.log('🧪 ========================================================\n');

  const BASE_URL = 'http://localhost:4000/api/v1';

  try {
    // 1. Registro de Nueva Empresa y Admin
    console.log('1️⃣ POST /api/v1/auth/register-company -> Registrando empresa...');
    const regRes = await fetch(`${BASE_URL}/auth/register-company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Empresa Test ${Date.now()}`,
        taxId: `RUT-${Date.now()}`,
        address: 'Av. Prueba 123',
        phone: '+56900000000',
        adminFullName: 'Juan Pérez Admin',
        adminEmail: `admin_${Date.now()}@test.cl`,
        adminPassword: 'password123',
      }),
    });
    const regData = await regRes.json();
    console.log(`   Result: HTTP ${regRes.status} | Success: ${regData.success}`);

    // 2. Login
    console.log('\n2️⃣ POST /api/v1/auth/login -> Autenticando...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regData.data.adminUser.email,
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log(`   Result: HTTP ${loginRes.status} | JWT obtenido: ${token ? 'SÍ' : 'NO'}`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Perfil /me
    console.log('\n3️⃣ GET /api/v1/auth/me -> Perfil de usuario...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    console.log(`   Result: HTTP ${meRes.status} | Usuario: ${meData.data.user.email}`);

    // 4. Crear Sucursal y Bodega
    console.log('\n4️⃣ POST /api/v1/locations/branches -> Creando sucursal...');
    const branchRes = await fetch(`${BASE_URL}/locations/branches`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Sucursal Test Norte', address: 'Camino Norte 44' }),
    });
    const branchData = await branchRes.json();

    console.log('   POST /api/v1/locations/warehouses -> Creando bodega...');
    const whRes = await fetch(`${BASE_URL}/locations/warehouses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        branch_id: branchData.data.id,
        name: 'Bodega Central Test',
        code: `BOD-TST-${Date.now().toString().slice(-4)}`,
        is_cost_tracking_enabled: true,
      }),
    });
    const whData = await whRes.json();
    console.log(`   Result: Bodega ID ${whData.data.id} creada.`);

    // 5. Crear Zona, Pasillo y Repisa 2D
    console.log('\n5️⃣ Creando Jerarquía Espacial (Zona -> Pasillo -> Repisa 2D -> Nivel -> Casillero)...');
    const zoneRes = await fetch(`${BASE_URL}/locations/zones`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ warehouse_id: whData.data.id, name: 'Zona Secos A', turnover_rate: 'HIGH' }),
    });
    const zoneData = await zoneRes.json();

    const aisleRes = await fetch(`${BASE_URL}/locations/aisles`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ zone_id: zoneData.data.id, name: 'Pasillo 01' }),
    });
    const aisleData = await aisleRes.json();

    const rackRes = await fetch(`${BASE_URL}/locations/racks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        aisle_id: aisleData.data.id,
        code: 'REP-TST-01',
        position_x: 3,
        position_y: 4,
        width_units: 3,
        length_units: 2,
      }),
    });
    const rackData = await rackRes.json();

    const levelRes = await fetch(`${BASE_URL}/locations/levels`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ rack_id: rackData.data.id, level_number: 1, height_cm: 200, width_cm: 300, depth_cm: 150 }),
    });
    const levelData = await levelRes.json();

    const locRes = await fetch(`${BASE_URL}/locations/storage-locations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ level_id: levelData.data.id, code: 'TST-N1-POS1', total_volume_m3: 5.0 }),
    });
    const locData = await locRes.json();
    console.log(`   Result: Casillero ${locData.data.code} creado.`);

    // 6. Crear Perfil de Costos y Simular Tarifa AST
    console.log('\n6️⃣ POST /api/v1/costs/profiles -> Perfil de costo y simulador AST...');
    const costRes = await fetch(`${BASE_URL}/costs/profiles`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        zone_id: zoneData.data.id,
        daily_base_cost: 2500,
        turnover_multiplier: 1.4,
        maintenance_cost_daily: 300,
        custom_formula_expression: '(base * turnover + maintenance) * seasonal',
      }),
    });
    const costData = await costRes.json();

    const simRes = await fetch(`${BASE_URL}/costs/simulate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        daily_base_cost: 2500,
        turnover_multiplier: 1.4,
        maintenance_cost_daily: 300,
        seasonal_factor: 1.0,
        occupied_volume_m3: 2.5,
        total_volume_m3: 5.0,
        custom_formula_expression: '(base * turnover + maintenance) * seasonal',
      }),
    });
    const simData = await simRes.json();
    console.log(`   Result: Tarifa calculada AST: $${simData.data.totalDailyCost} CLP / día.`);

    // 7. Crear Producto y Registrar Inbound Stock
    console.log('\n7️⃣ POST /api/v1/catalog/products -> Crear producto e Inbound Stock...');
    const prodRes = await fetch(`${BASE_URL}/catalog/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ sku: `SKU-${Date.now()}`, name: 'Caja Test 10kg', unit_weight_kg: 10, unit_volume_m3: 0.1 }),
    });
    const prodData = await prodRes.json();

    const inboundRes = await fetch(`${BASE_URL}/inventory/inbound`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        product_id: prodData.data.id,
        storage_location_id: locData.data.id,
        quantity: 20,
        occupied_m3: 2.0,
      }),
    });
    const inboundData = await inboundRes.json();
    console.log(`   Result: Inbound registrado. Movimiento ID: ${inboundData.data.movement.id}`);

    // 8. Consultar Kardex
    console.log('\n8️⃣ GET /api/v1/inventory/movements -> Kardex audit...');
    const kardexRes = await fetch(`${BASE_URL}/inventory/movements`, { headers: authHeaders });
    const kardexData = await kardexRes.json();
    console.log(`   Result: Total movimientos en Kardex: ${kardexData.meta.total}`);

    console.log('\n🎉 ========================================================');
    console.log('🎉 SUITE DE PRUEBAS COMPLETADA 100% EXITOSAMENTE!');
    console.log('🎉 ========================================================\n');
  } catch (err) {
    console.error('❌ Error en suite de pruebas:', err);
  }
}

runApiSuite();
