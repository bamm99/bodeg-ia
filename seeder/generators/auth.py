import uuid

# Hash bcrypt válido para "admin123"
BCRYPT_HASH = "$2a$10$cZn6qHgPgE1XaENJ.PbSNOyS57yP2YcTno/8DoZwDFDBlX5UA/gji"

def generate_auth_sql(company_ids, client_ids_map=None):
    sql = []
    
    # 1. Roles del Sistema Global
    role_super_admin = 'a1000000-0000-0000-0000-000000000001'
    role_platform_admin = 'a1000000-0000-0000-0000-000000000002'

    sql.append(f"""
    INSERT INTO roles (id, company_id, code, name, permissions, is_system_role) VALUES
    ('{role_super_admin}', NULL, 'SUPER_ADMIN', 'Super Administrador Plataforma', '["*"]'::jsonb, true),
    ('{role_platform_admin}', NULL, 'PLATFORM_ADMIN', 'Ejecutivo de Plataforma', '["company:*", "warehouse:read", "cost:read", "inventory:read"]'::jsonb, true)
    ON CONFLICT (company_id, code) DO NOTHING;
    """)

    # 2. Roles por Empresa y Usuarios
    company_roles = {}
    users_data = []

    # Super Admin Global (Sin empresa asignada fija: primary_company_id = NULL)
    super_admin_user_id = '10000000-0000-0000-0000-000000000001'
    sql.append(f"""
    INSERT INTO users (id, primary_company_id, role_id, email, password_hash, full_name) VALUES
    ('{super_admin_user_id}', NULL, '{role_super_admin}', 'admin@bodegia.cl', '{BCRYPT_HASH}', 'Administrador Principal Bodeg-IA')
    ON CONFLICT (email) DO NOTHING;
    """)
    users_data.append((super_admin_user_id, 'admin@bodegia.cl', None))

    # Executive Platform Admin (Admin Plataforma con cartola de clientes asignados en user_company_access)
    exec_user_id = '20000000-0000-0000-0000-000000000002'
    sql.append(f"""
    INSERT INTO users (id, primary_company_id, role_id, email, password_hash, full_name) VALUES
    ('{exec_user_id}', NULL, '{role_platform_admin}', 'ejecutivo@bodegia.cl', '{BCRYPT_HASH}', 'Felipe Soto (Ejecutivo de Cuenta)')
    ON CONFLICT (email) DO NOTHING;
    """)
    users_data.append((exec_user_id, 'ejecutivo@bodegia.cl', None))

    # Asignar cartola de clientes a ejecutivo@bodegia.cl (AgroSur + ElectroChile)
    sql.append(f"""
    INSERT INTO user_company_access (user_id, company_id) VALUES
    ('{exec_user_id}', '{company_ids['agrosur']}'),
    ('{exec_user_id}', '{company_ids['electrochile']}')
    ON CONFLICT DO NOTHING;

    INSERT INTO executive_portfolio_history (id, executive_user_id, company_id, assigned_by_user_id, action, reason, created_at) VALUES
    (gen_random_uuid(), '{exec_user_id}', '{company_ids['agrosur']}', '{super_admin_user_id}', 'ASSIGNED', 'Asignación inicial por seeder de prueba', NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), '{exec_user_id}', '{company_ids['electrochile']}', '{super_admin_user_id}', 'ASSIGNED', 'Asignación inicial por seeder de prueba', NOW() - INTERVAL '15 days')
    ON CONFLICT DO NOTHING;
    """)

    # Crear roles y usuarios para cada empresa (COMPANY_ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_OPERATOR, COMMERCIAL_MANAGEMENT, CLIENT_VIEWER)
    users_list = [
        ('agrosur', 'Empresa AgroSur', [
            ('admin.agrosur@bodegia.cl', 'Sebastián Morales', 'COMPANY_ADMIN', None),
            ('jefe.pudahuel@bodegia.cl', 'Carlos Mendoza', 'WAREHOUSE_MANAGER', None),
            ('operador.pudahuel@bodegia.cl', 'Rodrigo Silva', 'WAREHOUSE_OPERATOR', None),
            ('comercial.agrosur@bodegia.cl', 'Andrea Tapia', 'COMMERCIAL_MANAGEMENT', None),
            ('cliente.frutas@bodegia.cl', 'Portal Cliente Frutas Cachapoal', 'CLIENT_VIEWER', 'frutas'),
        ]),
        ('electrochile', 'ElectroChile S.A.', [
            ('admin.electro@bodegia.cl', 'Valeria Fuentealba', 'COMPANY_ADMIN', None),
            ('jefe.huechuraba@bodegia.cl', 'Matías Tapia', 'WAREHOUSE_MANAGER', None),
            ('comercial.electro@bodegia.cl', 'Camilo Lagos', 'COMMERCIAL_MANAGEMENT', None),
            ('cliente.tech@bodegia.cl', 'Portal Cliente Retail Tech', 'CLIENT_VIEWER', 'retail'),
        ]),
        ('austral', 'Distribuidora Austral', [
            ('admin.austral@bodegia.cl', 'Gonzalo Araya', 'COMPANY_ADMIN', None),
            ('jefe.nos@bodegia.cl', 'Loreto Sepúlveda', 'WAREHOUSE_MANAGER', None),
        ]),
        ('textil', 'Textil Maipú', [
            ('admin.textil@bodegia.cl', 'Camila Benítez', 'COMPANY_ADMIN', None),
        ]),
        ('quimicos', 'Químicos Industriales', [
            ('admin.quimicos@bodegia.cl', 'Ignacio Villagra', 'COMPANY_ADMIN', None),
            ('jefe.lampa@bodegia.cl', 'Esteban Paredes', 'WAREHOUSE_MANAGER', None),
        ])
    ]

    for key, cname, users in users_list:
        cid = company_ids[key]
        
        # Crear los 5 roles por empresa
        role_comp_admin = str(uuid.uuid4())
        role_wh_manager = str(uuid.uuid4())
        role_operator = str(uuid.uuid4())
        role_commercial = str(uuid.uuid4())
        role_client_viewer = str(uuid.uuid4())

        sql.append(f"""
        INSERT INTO roles (id, company_id, code, name, permissions, is_system_role) VALUES
        ('{role_comp_admin}', '{cid}', 'COMPANY_ADMIN', 'Administrador de {cname}', '["company:read", "warehouse:*", "cost:*", "inventory:*", "user:*", "catalog:*"]'::jsonb, false),
        ('{role_wh_manager}', '{cid}', 'WAREHOUSE_MANAGER', 'Jefe de Bodega ({cname})', '["warehouse:read", "inventory:*", "cost:read"]'::jsonb, false),
        ('{role_operator}', '{cid}', 'WAREHOUSE_OPERATOR', 'Operador de Bodega ({cname})', '["inventory:read", "movement:create"]'::jsonb, false),
        ('{role_commercial}', '{cid}', 'COMMERCIAL_MANAGEMENT', 'Gestión Comercial ({cname})', '["cost:read", "catalog:*", "client:*", "billing:read"]'::jsonb, false),
        ('{role_client_viewer}', '{cid}', 'CLIENT_VIEWER', 'Cliente 3PL Portal ({cname})', '["inventory:read_own_stock"]'::jsonb, false)
        ON CONFLICT (company_id, code) DO NOTHING;
        """)

        company_roles[key] = {
            'COMPANY_ADMIN': role_comp_admin,
            'WAREHOUSE_MANAGER': role_wh_manager,
            'WAREHOUSE_OPERATOR': role_operator,
            'COMMERCIAL_MANAGEMENT': role_commercial,
            'CLIENT_VIEWER': role_client_viewer,
        }

        for email, full_name, role_code, client_key in users:
            uid = str(uuid.uuid4())
            rid = company_roles[key][role_code]
            client_id_val = 'NULL'
            if client_key and client_ids_map and client_key in client_ids_map:
                client_id_val = f"'{client_ids_map[client_key]}'"

            sql.append(f"""
            INSERT INTO users (id, primary_company_id, client_id, role_id, email, password_hash, full_name) VALUES
            ('{uid}', '{cid}', {client_id_val}, '{rid}', '{email}', '{BCRYPT_HASH}', '{full_name}')
            ON CONFLICT (email) DO NOTHING;
            """)
            users_data.append((uid, email, cid))

    return "\n".join(sql), users_data
