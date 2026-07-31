import uuid

# Hash bcrypt válido para "admin123"
BCRYPT_HASH = "$2a$10$cZn6qHgPgE1XaENJ.PbSNOyS57yP2YcTno/8DoZwDFDBlX5UA/gji"

def generate_auth_sql(company_ids):
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
    """)

    # Crear roles y usuarios para cada empresa (COMPANY_ADMIN, WAREHOUSE_MANAGER, OPERATOR)
    users_list = [
        ('agrosur', 'Empresa AgroSur', [
            ('admin.agrosur@bodegia.cl', 'Sebastián Morales', 'COMPANY_ADMIN', 'Administrador AgroSur'),
            ('jefe.pudahuel@bodegia.cl', 'Carlos Mendoza', 'WAREHOUSE_MANAGER', 'Jefe Bodega Pudahuel'),
            ('operador.pudahuel@bodegia.cl', 'Rodrigo Silva', 'OPERATOR', 'Bodeguero Operador'),
        ]),
        ('electrochile', 'ElectroChile S.A.', [
            ('admin.electro@bodegia.cl', 'Valeria Fuentealba', 'COMPANY_ADMIN', 'Gerente Operaciones ElectroChile'),
            ('jefe.huechuraba@bodegia.cl', 'Matías Tapia', 'WAREHOUSE_MANAGER', 'Jefe CD Huechuraba'),
        ]),
        ('austral', 'Distribuidora Austral', [
            ('admin.austral@bodegia.cl', 'Gonzalo Araya', 'COMPANY_ADMIN', 'Admin Austral'),
            ('jefe.nos@bodegia.cl', 'Loreto Sepúlveda', 'WAREHOUSE_MANAGER', 'Jefe Centro Nos'),
        ]),
        ('textil', 'Textil Maipú', [
            ('admin.textil@bodegia.cl', 'Camila Benítez', 'COMPANY_ADMIN', 'Administradora Maipú'),
        ]),
        ('quimicos', 'Químicos Industriales', [
            ('admin.quimicos@bodegia.cl', 'Ignacio Villagra', 'COMPANY_ADMIN', 'Jefe Planta Hazmat'),
            ('jefe.lampa@bodegia.cl', 'Esteban Paredes', 'WAREHOUSE_MANAGER', 'Jefe Bodega Lampa'),
        ])
    ]

    for key, cname, users in users_list:
        cid = company_ids[key]
        
        # Crear Rol Admin Empresa y Jefe Bodega para la empresa
        role_comp_admin = str(uuid.uuid4())
        role_wh_manager = str(uuid.uuid4())
        role_operator = str(uuid.uuid4())

        sql.append(f"""
        INSERT INTO roles (id, company_id, code, name, permissions, is_system_role) VALUES
        ('{role_comp_admin}', '{cid}', 'COMPANY_ADMIN', 'Administrador de {cname}', '["company:read", "warehouse:*", "cost:*", "inventory:*", "user:*", "catalog:*"]'::jsonb, false),
        ('{role_wh_manager}', '{cid}', 'WAREHOUSE_MANAGER', 'Jefe de Bodega ({cname})', '["warehouse:read", "inventory:*", "cost:read"]'::jsonb, false),
        ('{role_operator}', '{cid}', 'OPERATOR', 'Operador de Bodega ({cname})', '["inventory:read", "movement:create"]'::jsonb, false)
        ON CONFLICT (company_id, code) DO NOTHING;
        """)

        company_roles[key] = {
            'COMPANY_ADMIN': role_comp_admin,
            'WAREHOUSE_MANAGER': role_wh_manager,
            'OPERATOR': role_operator
        }

        for email, full_name, role_code, _ in users:
            uid = str(uuid.uuid4())
            rid = company_roles[key][role_code]
            sql.append(f"""
            INSERT INTO users (id, primary_company_id, role_id, email, password_hash, full_name) VALUES
            ('{uid}', '{cid}', '{rid}', '{email}', '{BCRYPT_HASH}', '{full_name}')
            ON CONFLICT (email) DO NOTHING;
            """)
            users_data.append((uid, email, cid))

    return "\n".join(sql), users_data
