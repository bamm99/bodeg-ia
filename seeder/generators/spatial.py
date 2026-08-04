import uuid
import random

def generate_spatial_sql(company_ids):
    sql = []
    location_ids = []
    warehouse_ids = []

    # Configuración de Bodegas por Empresa
    warehouses_config = [
        ('agrosur', 'Sucursal Pudahuel Central', 'Av. Industrial 500, Pudahuel', [
            ('BOD-PUDA-01', 'Bodega Principal Pudahuel (Filtro & Frío)', True),
            ('BOD-PUDA-02', 'Bodega Seca & Semillas (Renca)', False),
        ]),
        ('electrochile', 'Sucursal Huechuraba Tech', 'Av. El Salto 4000, Huechuraba', [
            ('CD-HUECH-01', 'Centro de Distribución Electrónica', True),
        ]),
        ('austral', 'Sucursal San Bernardo Nos', 'Camino Nos 800, San Bernardo', [
            ('CD-SANBER-01', 'Bodega Central de Alimentos Abarrotes', True),
        ]),
        ('textil', 'Sucursal Maipú Telas', 'Av. Pajaritos 2200, Maipú', [
            ('BOD-MAIPU-01', 'Bodega Galpón de Telas & Ropa', False),
        ]),
        ('quimicos', 'Sucursal Lampa Hazmat', 'Calle Parque Industrial 90, Lampa', [
            ('BOD-LAMPA-01', 'Bodega de Químicos & Inflamables', True),
        ])
    ]

    for key, bname, baddr, wh_list in warehouses_config:
        cid = company_ids[key]
        branch_id = str(uuid.uuid4())

        sql.append(f"""
        INSERT INTO branches (id, company_id, name, address) VALUES
        ('{branch_id}', '{cid}', '{bname}', '{baddr}')
        ON CONFLICT DO NOTHING;
        """)

        for code, wname, cost_enabled in wh_list:
            wid = str(uuid.uuid4())
            warehouse_ids.append((wid, code, cid))

            sql.append(f"""
            INSERT INTO warehouses (id, company_id, branch_id, name, code, is_cost_tracking_enabled) VALUES
            ('{wid}', '{cid}', '{branch_id}', '{wname}', '{code}', {str(cost_enabled).lower()})
            ON CONFLICT (company_id, code) DO NOTHING;
            """)

            # Zonas por Bodega
            zones_data = [
                ('Zona A - Alta Rotación (Secos)', 'HIGH'),
                ('Zona B - Almacenamiento General', 'MEDIUM'),
                ('Zona C - Frío / Congelados', 'MEDIUM'),
                ('Zona D - Carga Pesada & Voluminosa', 'LOW'),
            ]

            for zname, turnover in zones_data:
                zid = str(uuid.uuid4())
                sql.append(f"""
                INSERT INTO zones (id, company_id, warehouse_id, name, turnover_rate) VALUES
                ('{zid}', '{cid}', '{wid}', '{zname}', '{turnover}');
                """)

                # Pasillo
                aisle_id = str(uuid.uuid4())
                sql.append(f"""
                INSERT INTO aisles (id, company_id, zone_id, name) VALUES
                ('{aisle_id}', '{cid}', '{zid}', 'Pasillo 01');
                """)

                # Generar 3 Repisas (Racks 2D) por zona con coordenadas distribuidas
                for rack_idx in range(1, 4):
                    rack_id = str(uuid.uuid4())
                    pos_x = (rack_idx * 3) - 2
                    pos_y = 1 if 'A' in zname or 'B' in zname else 5
                    rack_code = f"REP-{zname[5]}{rack_idx}"

                    sql.append(f"""
                    INSERT INTO racks (id, company_id, aisle_id, code, position_x, position_y, width_units, length_units) VALUES
                    ('{rack_id}', '{cid}', '{aisle_id}', '{rack_code}', {pos_x}, {pos_y}, 3, 2);
                    """)

                    # 2 Niveles por Repisa
                    for lvl_num in range(1, 3):
                        lvl_id = str(uuid.uuid4())
                        sql.append(f"""
                        INSERT INTO levels (id, company_id, rack_id, level_number, height_cm, width_cm, depth_cm, max_weight_kg) VALUES
                        ('{lvl_id}', '{cid}', '{rack_id}', {lvl_num}, 200, 300, 150, 2500);
                        """)

                        # 2 Casilleros por Nivel
                        for pos_idx in range(1, 3):
                            loc_id = str(uuid.uuid4())
                            loc_code = f"{zname[5]}{rack_idx}-N{lvl_num}-POS{pos_idx}"
                            
                            # Simular diferentes ocupaciones (Vacío, Parcial, Casi Lleno)
                            tot_vol = 5.0
                            occ_vol = round(random.choice([0.0, 1.2, 2.5, 4.2, 4.8]), 2)
                            status = 'AVAILABLE' if occ_vol == 0 else ('FULL' if occ_vol >= 4.5 else 'PARTIAL')

                            sql.append(f"""
                            INSERT INTO storage_locations (id, company_id, level_id, code, max_weight_kg, total_volume_m3, occupied_volume_m3, status) VALUES
                            ('{loc_id}', '{cid}', '{lvl_id}', '{loc_code}', 1250, {tot_vol}, {occ_vol}, '{status}');
                            """)

                            location_ids.append((loc_id, loc_code, cid, wid, cost_enabled, zid, rack_id, lvl_id))

    return "\n".join(sql), warehouse_ids, location_ids
