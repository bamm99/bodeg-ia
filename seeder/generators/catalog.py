import uuid

def generate_catalog_sql(company_ids):
    sql = []
    product_ids = []
    client_ids = []
    client_ids_map = {}

    # Productos por Empresa
    products_catalog = {
        'agrosur': [
            ('HAR-IND-25', 'Caja Harina Industrial 25kg', 25.0, 0.05, False),
            ('SEM-TRIGO-50', 'Saco Semilla Trigo Certificado 50kg', 50.0, 0.09, True),
            ('PUL-MANZ-P01', 'Palet Pulpa de Manzana Congelada 500kg', 500.0, 2.5, True),
            ('ACE-SOJA-20L', 'Bidón Aceite de Soja Refinado 20L', 20.0, 0.03, False),
        ],
        'electrochile': [
            ('NOTE-PRO-15', 'Caja Notebook Enterprise 15" (10 unid)', 22.0, 0.08, False),
            ('MON-4K-27', 'Caja Monitor 4K UHD 27" Ergono', 8.5, 0.06, False),
            ('PAL-TV-65', 'Palet Smart TV 65" QLED (12 unid)', 280.0, 2.8, True),
            ('CAB-UTP-CAT6', 'Carrete Cable Red UTP Cat6 305m', 14.0, 0.04, False),
        ],
        'austral': [
            ('ACE-MAR-12', 'Caja Aceite Maravilla 12x1L', 12.0, 0.02, False),
            ('ARROZ-GR1-1', 'Caja Arroz Grado 1 20x1kg', 20.0, 0.03, False),
            ('ATUN-LOM-48', 'Caja Atún en Lomo en Aceite 48x170g', 10.5, 0.025, False),
            ('PAL-BEB-15L', 'Palet Bebida Gaseosa 1.5L (60 packs)', 620.0, 2.9, True),
        ],
        'textil': [
            ('TEL-ALGO-100', 'Rollo Tela Algodón 100% 50m', 35.0, 0.12, False),
            ('ROL-MEZCL-60', 'Rollo Mezclilla Jean Denim 60m', 48.0, 0.15, False),
            ('CAJ-POL-XL', 'Caja Poleras Manga Corta XL (50 unid)', 15.0, 0.05, False),
        ],
        'quimicos': [
            ('TAM-SOLV-200', 'Tambor Solvente Industrial 200L (Hazmat)', 210.0, 0.45, True),
            ('BID-ACID-20', 'Bidón Ácido Sulfúrico Concentrado 20L', 36.0, 0.03, False),
            ('PAL-DETER-500', 'Palet Detergente Líquido Industrial 500L', 520.0, 2.4, True),
        ],
    }

    clients_data = {
        'agrosur': [('Propio AgroSur', '76.890.123-5', True, 'own'), ('Frutas del Cachapoal Ltda', '96.111.222-3', False, 'frutas')],
        'electrochile': [('Propio ElectroChile', '77.456.789-K', True, 'own'), ('Retail Tech Store SpA', '95.333.444-5', False, 'retail')],
        'austral': [('Propio Austral', '78.123.456-7', True, 'own'), ('Supermercados del Sur S.A.', '94.555.666-7', False, 'superSur')],
        'textil': [('Propio Textil Maipú', '79.987.654-3', True, 'own'), ('Confecciones Santiago Ltda', '93.777.888-9', False, 'stgoConfecciones')],
        'quimicos': [('Propio Químicos Hazmat', '80.111.222-1', True, 'own'), ('Minería & Procesos SpA', '92.999.000-1', False, 'mineria')],
    }

    for key, cid in company_ids.items():
        # Insertar Clientes
        for cname, ctax, is_int, client_alias in clients_data[key]:
            client_id = str(uuid.uuid4())
            sql.append(f"""
            INSERT INTO clients (id, company_id, name, tax_id, is_internal_company) VALUES
            ('{client_id}', '{cid}', '{cname}', '{ctax}', {str(is_int).lower()})
            ON CONFLICT DO NOTHING;
            """)
            client_ids.append((client_id, key, is_int))
            client_ids_map[client_alias] = client_id

        # Insertar Productos
        for sku, pname, weight, vol, is_pal in products_catalog[key]:
            pid = str(uuid.uuid4())
            sql.append(f"""
            INSERT INTO products (id, company_id, sku, name, unit_weight_kg, unit_volume_m3, is_palletized) VALUES
            ('{pid}', '{cid}', '{sku}', '{pname}', {weight}, {vol}, {str(is_pal).lower()})
            ON CONFLICT (company_id, sku) DO NOTHING;
            """)
            product_ids.append((pid, sku, key, vol, weight))

    return "\n".join(sql), product_ids, client_ids, client_ids_map
