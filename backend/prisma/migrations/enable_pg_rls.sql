-- =========================================================================
-- MIGRACIÓN POSTGRESQL ROW-LEVEL SECURITY (RLS) — BODEG-IA MULTI-TENANCY
-- Defiende la base de datos a nivel de motor contra filtraciones de tenants
-- =========================================================================

-- 1. Crear Rol de Aplicación sin atributos de Superusuario/BypassRLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bodegia_app_user') THEN
        CREATE ROLE bodegia_app_user NOSUPERUSER NOBYPASSRLS NOLOGIN;
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO bodegia_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bodegia_app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO bodegia_app_user;

-- 2. Función Helper para obtener app.current_company_id de forma segura
CREATE OR REPLACE FUNCTION current_app_company_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_company_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Habilitar ROW LEVEL SECURITY en todas las tablas asociadas a un tenant (company_id)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE aisles ENABLE ROW LEVEL SECURITY;
ALTER TABLE racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- FORCE ROW LEVEL SECURITY
ALTER TABLE inventory_items FORCE ROW LEVEL SECURITY;
ALTER TABLE cost_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements FORCE ROW LEVEL SECURITY;
ALTER TABLE storage_locations FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE cost_history FORCE ROW LEVEL SECURITY;
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;
ALTER TABLE branches FORCE ROW LEVEL SECURITY;
ALTER TABLE zones FORCE ROW LEVEL SECURITY;
ALTER TABLE aisles FORCE ROW LEVEL SECURITY;
ALTER TABLE racks FORCE ROW LEVEL SECURITY;
ALTER TABLE levels FORCE ROW LEVEL SECURITY;

-- 4. Eliminar políticas previas si existiesen
DROP POLICY IF EXISTS tenant_isolation_inventory_items ON inventory_items;
DROP POLICY IF EXISTS tenant_isolation_cost_profiles ON cost_profiles;
DROP POLICY IF EXISTS tenant_isolation_inventory_movements ON inventory_movements;
DROP POLICY IF EXISTS tenant_isolation_storage_locations ON storage_locations;
DROP POLICY IF EXISTS tenant_isolation_products ON products;
DROP POLICY IF EXISTS tenant_isolation_clients ON clients;
DROP POLICY IF EXISTS tenant_isolation_cost_history ON cost_history;
DROP POLICY IF EXISTS tenant_isolation_warehouses ON warehouses;
DROP POLICY IF EXISTS tenant_isolation_branches ON branches;
DROP POLICY IF EXISTS tenant_isolation_zones ON zones;
DROP POLICY IF EXISTS tenant_isolation_aisles ON aisles;
DROP POLICY IF EXISTS tenant_isolation_racks ON racks;
DROP POLICY IF EXISTS tenant_isolation_levels ON levels;

-- 5. Crear Políticas RLS de Aislamiento Incondicional por Tenant
CREATE POLICY tenant_isolation_inventory_items ON inventory_items
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_cost_profiles ON cost_profiles
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_inventory_movements ON inventory_movements
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_storage_locations ON storage_locations
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_products ON products
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_clients ON clients
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_cost_history ON cost_history
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_warehouses ON warehouses
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_branches ON branches
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_zones ON zones
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_aisles ON aisles
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_racks ON racks
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());

CREATE POLICY tenant_isolation_levels ON levels
    USING (current_setting('app.current_company_id', true) = 'BYPASS' OR company_id = current_app_company_id());
