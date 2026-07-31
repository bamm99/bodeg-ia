-- ============================================================
-- SCRIPT DE INICIALIZACIÓN BODEG-IA (PostgreSQL DDL & SEEDS)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

------------------------------------------------------------
-- 1. PLANES, SUBSCRIPCIONES Y EMPRESAS
------------------------------------------------------------

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    max_warehouses INT NOT NULL DEFAULT 1,
    max_users INT NOT NULL DEFAULT 5,
    max_storage_m3 DECIMAL(12,2) NOT NULL DEFAULT 500.00,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------
-- 2. AUTENTICACIÓN, ROLES Y SESIONES
------------------------------------------------------------

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_role_company_code UNIQUE (company_id, code)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address VARCHAR(45),
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_company_access (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, company_id)
);

CREATE TABLE user_warehouse_assignments (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL,
    access_level VARCHAR(20) NOT NULL DEFAULT 'FULL',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, warehouse_id)
);

------------------------------------------------------------
-- 3. JERARQUÍA ESPACIAL DE BODEGAS
------------------------------------------------------------

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    map_layout_json JSONB DEFAULT '{}'::jsonb,
    is_cost_tracking_enabled BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_warehouse_code_company UNIQUE (company_id, code)
);

ALTER TABLE user_warehouse_assignments 
ADD CONSTRAINT fk_user_wh_assignment_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;

CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    turnover_rate VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE aisles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE racks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    aisle_id UUID NOT NULL REFERENCES aisles(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    width_units INT NOT NULL DEFAULT 1,
    length_units INT NOT NULL DEFAULT 1,
    rotation_deg INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rack_id UUID NOT NULL REFERENCES racks(id) ON DELETE CASCADE,
    level_number INT NOT NULL,
    height_cm DECIMAL(10,2),
    width_cm DECIMAL(10,2),
    depth_cm DECIMAL(10,2),
    max_weight_kg DECIMAL(10,2),
    total_volume_m3 DECIMAL(10,3) GENERATED ALWAYS AS (
        COALESCE(height_cm * width_cm * depth_cm / 1000000.0, 0)
    ) STORED,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    max_weight_kg DECIMAL(10,2),
    total_volume_m3 DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    occupied_volume_m3 DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_occupied_vol CHECK (occupied_volume_m3 >= 0 AND occupied_volume_m3 <= total_volume_m3)
);

------------------------------------------------------------
-- 4. MOTOR DE COSTOS
------------------------------------------------------------

CREATE TABLE cost_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    rack_id UUID REFERENCES racks(id) ON DELETE CASCADE,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    daily_base_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
    turnover_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    maintenance_cost_daily DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    energy_cost_daily DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    seasonal_factor DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    ai_suggested_cost DECIMAL(12,2),
    custom_formula_expression TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_cost_profile_exclusive_arc CHECK (
        num_nonnulls(zone_id, rack_id, level_id) = 1
    ),
    CONSTRAINT chk_daily_base_cost_positive CHECK (daily_base_cost >= 0)
);

CREATE TABLE cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    cost_profile_id UUID NOT NULL REFERENCES cost_profiles(id) ON DELETE CASCADE,
    previous_cost DECIMAL(12,2) NOT NULL,
    new_cost DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
    change_reason TEXT,
    changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------
-- 5. INVENTARIO Y MOVIMIENTOS
------------------------------------------------------------

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    is_internal_company BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit_weight_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit_volume_m3 DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    is_palletized BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_product_sku_company UNIQUE (company_id, sku)
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    storage_location_id UUID NOT NULL REFERENCES storage_locations(id),
    client_owner_id UUID NOT NULL REFERENCES clients(id),
    quantity INT NOT NULL DEFAULT 1,
    lot_number VARCHAR(100),
    expiration_date DATE,
    occupancy_type VARCHAR(20) NOT NULL DEFAULT 'BOXES',
    occupied_m3 DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_inventory_qty_positive CHECK (quantity >= 0)
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL,
    source_location_id UUID REFERENCES storage_locations(id),
    destination_location_id UUID REFERENCES storage_locations(id),
    quantity INT NOT NULL,
    performed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------
-- 6. ÍNDICES DE RENDIMIENTO
------------------------------------------------------------

CREATE INDEX idx_users_company ON users(primary_company_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_warehouses_company ON warehouses(company_id);
CREATE INDEX idx_zones_warehouse ON zones(company_id, warehouse_id);
CREATE INDEX idx_racks_aisle ON racks(company_id, aisle_id);
CREATE INDEX idx_levels_rack ON levels(company_id, rack_id);
CREATE INDEX idx_storage_loc_level ON storage_locations(company_id, level_id);
CREATE INDEX idx_inventory_items_location ON inventory_items(company_id, storage_location_id);
CREATE INDEX idx_inventory_items_product ON inventory_items(company_id, product_id);
CREATE INDEX idx_movements_company_date ON inventory_movements(company_id, created_at DESC);

------------------------------------------------------------
-- 7. ROW-LEVEL SECURITY (RLS) MULTI-TENANT
------------------------------------------------------------

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_warehouses ON warehouses
    USING (company_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_storage_locations ON storage_locations
    USING (company_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_inventory_items ON inventory_items
    USING (company_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_movements ON inventory_movements
    USING (company_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_cost_profiles ON cost_profiles
    USING (company_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

------------------------------------------------------------
-- 8. SEEDS INICIALES CON UUIDs VÁLIDOS
------------------------------------------------------------

-- Planes Base
INSERT INTO plans (id, name, max_warehouses, max_users, max_storage_m3, price_monthly, currency) VALUES
('11111111-1111-1111-1111-111111111111', 'BASIC', 1, 3, 200.00, 49900.00, 'CLP'),
('22222222-2222-2222-2222-222222222222', 'PRO', 5, 15, 2000.00, 129900.00, 'CLP'),
('33333333-3333-3333-3333-333333333333', 'ENTERPRISE', 99, 999, 999999.00, 399900.00, 'CLP');

-- Empresa Inicial de Prueba
INSERT INTO companies (id, name, tax_id, address, phone) VALUES
('c0000000-0000-0000-0000-000000000001', 'Empresa Logística Demo SpA', '76.543.210-K', 'Av. Las Condes 1234, Santiago', '+56912345678');

-- Suscripción Activa
INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, current_period_end) VALUES
('c0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'ACTIVE', NOW(), NOW() + INTERVAL '1 year');

-- Roles por Defecto
INSERT INTO roles (id, company_id, code, name, permissions, is_system_role) VALUES
('a0000000-0000-0000-0000-000000000001', NULL, 'SUPER_ADMIN', 'Super Administrador Plataforma', '["*"]'::jsonb, true),
('a0000000-0000-0000-0000-000000000002', NULL, 'PLATFORM_ADMIN', 'Administrador de Plataforma', '["company:*", "warehouse:*"]'::jsonb, true),
('a0000000-0000-0000-0000-000000000003', NULL, 'COMPANY_ADMIN', 'Administrador de Empresa', '["company:read", "warehouse:*", "cost:*", "inventory:*"]'::jsonb, true),
('a0000000-0000-0000-0000-000000000004', NULL, 'WAREHOUSE_MANAGER', 'Jefe de Bodega', '["warehouse:read", "inventory:*", "cost:read"]'::jsonb, true),
('a0000000-0000-0000-0000-000000000005', NULL, 'OPERATOR', 'Operador de Bodega', '["inventory:read", "movement:create"]'::jsonb, true);

-- Usuario Super Admin Inicial
INSERT INTO users (id, primary_company_id, role_id, email, password_hash, full_name) VALUES
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin@bodegia.cl', '$2b$10$wN1rB5.8t.7.eK9vV3sR/OQ5Vp8S8sX5u8T8S8sX5u8T8S8sX5u8T', 'Administrador Principal');

-- Cliente Propietario por Defecto
INSERT INTO clients (id, company_id, name, tax_id, is_internal_company) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Propio (Empresa Logística Demo)', '76.543.210-K', true);

-- Sucursal & Bodega Demo
INSERT INTO branches (id, company_id, name, address) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Sucursal Central', 'Av. Industrial 500, Pudahuel');

INSERT INTO warehouses (id, company_id, branch_id, name, code, is_cost_tracking_enabled) VALUES
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Bodega Principal Pudahuel', 'BOD-PUDA-01', true);

-- Sectores / Zonas
INSERT INTO zones (id, company_id, warehouse_id, name, turnover_rate) VALUES
('f1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Zona Alta Rotación (Seco)', 'HIGH'),
('f1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Zona Fría (Congelados)', 'MEDIUM');

-- Perfil de Costos por Zona
INSERT INTO cost_profiles (company_id, zone_id, daily_base_cost, currency, turnover_multiplier, energy_cost_daily) VALUES
('c0000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 1500.00, 'CLP', 1.50, 0.00),
('c0000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 2500.00, 'CLP', 1.00, 800.00);
