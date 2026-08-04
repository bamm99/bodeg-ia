import sys
import os
import time

from config import DB_HOST, DB_PORT, DB_NAME, DB_USER
from db_adapter import db
from generators.saas import generate_saas_sql
from generators.auth import generate_auth_sql
from generators.spatial import generate_spatial_sql
from generators.costs import generate_cost_sql
from generators.catalog import generate_catalog_sql
from generators.inventory import generate_inventory_sql

def run_seeder():
    print("=" * 70)
    print("🚀 PYTHON DATA SEEDER SUB-PROJECT — BODEG-IA ENTERPRISE PLATFORM")
    print(f"📡 Conectando a Servidor PostgreSQL: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    print("=" * 70 + "\n")

    start_time = time.time()

    # 1. Limpieza de tablas previas
    print("🧹 [1/6] Limpiando tablas previas en el servidor de pruebas...")
    clean_sql = """
    TRUNCATE TABLE executive_portfolio_history, inventory_movements, inventory_items, products, clients,
                   cost_history, cost_profiles, storage_locations, levels,
                   racks, aisles, zones, user_warehouse_assignments,
                   user_company_access, user_sessions, users, warehouses,
                   branches, subscriptions, roles, companies, plans CASCADE;
    """
    if not db.execute_sql(clean_sql):
        print("❌ Error al limpiar las tablas previas.")
        sys.exit(1)
    print("   ✅ Tablas limpiadas exitosamente.")

    # 2. Generar y poblar Planes, Empresas y Suscripciones
    print("\n📦 [2/6] Poblando Planes SaaS, Empresas y Suscripciones...")
    saas_sql, company_ids = generate_saas_sql()
    if not db.execute_script(saas_sql):
        print("❌ Error al poblar SaaS.")
        sys.exit(1)
    print(f"   ✅ 5 Empresas creadas (AgroSur, ElectroChile, Austral, Textil, Químicos).")

    # 3. Generar Catálogo de Productos y Clientes 3PL primero (para referencias client_id)
    print("\n🛒 [3/6] Poblando Productos y Clientes 3PL (Internos & Externos)...")
    catalog_sql, product_ids, client_ids, client_ids_map = generate_catalog_sql(company_ids)
    if not db.execute_script(catalog_sql):
        print("❌ Error al poblar Catálogo.")
        sys.exit(1)

    # 4. Generar Roles RBAC y Usuarios
    print("\n🛡️ [4/6] Poblando Roles RBAC y Usuarios de prueba (7 Roles) con bcrypt...")
    auth_sql, users_data = generate_auth_sql(company_ids, client_ids_map)
    if not db.execute_script(auth_sql):
        print("❌ Error al poblar Autenticación.")
        sys.exit(1)
    print(f"   ✅ {len(users_data)} Usuarios de prueba creados (Clave por defecto: admin123).")

    # 5. Generar Jerarquía Espacial de Bodegas
    print("\n🏭 [5/6] Poblando Sucursales, Bodegas, Zonas, Pasillos, Repisas 2D, Niveles y Casilleros...")
    spatial_sql, warehouse_ids, location_ids = generate_spatial_sql(company_ids)
    if not db.execute_script(spatial_sql):
        print("❌ Error al poblar Jerarquía Espacial.")
        sys.exit(1)
    print(f"   ✅ {len(warehouse_ids)} Bodegas y {len(location_ids)} Casilleros/Posiciones 2D generados.")

    # 6. Generar Perfiles de Costos con Fórmulas AST Dinámicas
    print("\n💰 [6/6] Poblando Perfiles de Costos e Histórico Auditorable (Arco Exclusivo)...")
    costs_sql = generate_cost_sql(company_ids, location_ids)
    if not db.execute_script(costs_sql):
        print("❌ Error al poblar Perfiles de Costos.")
        sys.exit(1)
    print("   ✅ Perfiles de Costo con Fórmulas AST asignados (Respetando cost_enabled y variando Arco Exclusivo).")

    # 7. Generar Existencias Ubicadas e Histórico Kardex
    print("\n📦 [7/7] Poblando Existencias Ubicadas (60% Propio / 40% 3PL) y Kardex de Movimientos...")
    inventory_sql = generate_inventory_sql(company_ids, location_ids, product_ids, client_ids, users_data)
    if not db.execute_script(inventory_sql):
        print("❌ Error al poblar Inventario y Kardex.")
        sys.exit(1)

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 70)
    print(f"✨ POBLADO MASIVO EN PYTHON FINALIZADO EXITOSAMENTE ({elapsed}s)")
    print("=" * 70)
    print("📌 Cuentas de Acceso para Pruebas (Clave por defecto: admin123):")
    print("   • Super Admin Global:        admin@bodegia.cl")
    print("   • Ejecutivo Plataforma:      ejecutivo@bodegia.cl")
    print("   • Admin AgroSur Logística:   admin.agrosur@bodegia.cl")
    print("   • Jefe Bodega Pudahuel:      jefe.pudahuel@bodegia.cl")
    print("   • Bodeguero Operador:        operador.pudahuel@bodegia.cl")
    print("   • Gestión Comercial AgroSur: comercial.agrosur@bodegia.cl")
    print("   • Portal Cliente 3PL Frutas: cliente.frutas@bodegia.cl")
    print("=" * 70)

if __name__ == '__main__':
    run_seeder()
