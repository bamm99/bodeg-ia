import uuid

def generate_saas_sql():
    sql = []
    
    # IDs fijos para referencias
    company_ids = {
        'agrosur': 'c1000000-0000-0000-0000-000000000001',
        'electrochile': 'c2000000-0000-0000-0000-000000000002',
        'austral': 'c3000000-0000-0000-0000-000000000003',
        'textil': 'c4000000-0000-0000-0000-000000000004',
        'quimicos': 'c5000000-0000-0000-0000-000000000005',
    }

    plan_ids = {
        'basic': '11111111-1111-1111-1111-111111111111',
        'pro': '22222222-2222-2222-2222-222222222222',
        'enterprise': '33333333-3333-3333-3333-333333333333',
    }

    # Planes
    sql.append(f"""
    INSERT INTO plans (id, name, max_warehouses, max_users, max_storage_m3, price_monthly, currency) VALUES
    ('{plan_ids['basic']}', 'BASIC', 1, 3, 200.00, 49900.00, 'CLP'),
    ('{plan_ids['pro']}', 'PRO', 5, 15, 2000.00, 129900.00, 'CLP'),
    ('{plan_ids['enterprise']}', 'ENTERPRISE', 99, 999, 999999.00, 399900.00, 'CLP')
    ON CONFLICT (name) DO NOTHING;
    """)

    # Empresas
    companies_data = [
        (company_ids['agrosur'], 'AgroSur Logística & Frío SpA', '76.890.123-5', 'Av. Renca Poniente 1500, Renca', '+56911223344'),
        (company_ids['electrochile'], 'ElectroChile Importaciones S.A.', '77.456.789-K', 'Av. El Salto 4000, Huechuraba', '+56922334455'),
        (company_ids['austral'], 'Distribuidora Austral de Alimentos Ltda', '78.123.456-7', 'Camino Nos 800, San Bernardo', '+56933445566'),
        (company_ids['textil'], 'Textil & Confecciones Maipú SpA', '79.987.654-3', 'Av. Pajaritos 2200, Maipú', '+56944556677'),
        (company_ids['quimicos'], 'Químicos & Soluciones Industriales S.A.', '80.111.222-1', 'Calle Parque Industrial 90, Lampa', '+56955667788'),
    ]

    for cid, name, tax_id, address, phone in companies_data:
        sql.append(f"""
        INSERT INTO companies (id, name, tax_id, address, phone) VALUES
        ('{cid}', '{name}', '{tax_id}', '{address}', '{phone}')
        ON CONFLICT (tax_id) DO NOTHING;
        """)

    # Suscripciones
    subs = [
        (company_ids['agrosur'], plan_ids['enterprise']),
        (company_ids['electrochile'], plan_ids['pro']),
        (company_ids['austral'], plan_ids['pro']),
        (company_ids['textil'], plan_ids['basic']),
        (company_ids['quimicos'], plan_ids['enterprise']),
    ]

    for cid, pid in subs:
        sid = str(uuid.uuid4())
        sql.append(f"""
        INSERT INTO subscriptions (id, company_id, plan_id, status, current_period_start, current_period_end) VALUES
        ('{sid}', '{cid}', '{pid}', 'ACTIVE', NOW(), NOW() + INTERVAL '1 year');
        """)

    return "\n".join(sql), company_ids
