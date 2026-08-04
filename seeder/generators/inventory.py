import uuid
import random
from datetime import datetime, timedelta

def generate_inventory_sql(company_ids, location_ids, product_ids, client_ids, users_data):
    sql = []
    
    # Mapeo de clientes propios y externos por empresa
    own_clients = {}
    external_clients_by_company = {}

    for cl_id, ckey, is_int in client_ids:
        if is_int:
            own_clients[ckey] = cl_id
        else:
            if ckey not in external_clients_by_company:
                external_clients_by_company[ckey] = []
            external_clients_by_company[ckey].append(cl_id)

    # Mapeo de usuarios por empresa
    users_by_company = {}
    for uid, email, cid in users_data:
        if cid:
            if cid not in users_by_company:
                users_by_company[cid] = []
            users_by_company[cid].append(uid)

    # Filtrar productos por empresa
    products_by_company = {}
    for pid, sku, ckey, vol, weight in product_ids:
        if ckey not in products_by_company:
            products_by_company[ckey] = []
        products_by_company[ckey].append((pid, sku, vol, weight))

    # Filtrar casilleros por empresa
    locations_by_company = {}
    for loc_item in location_ids:
        loc_id = loc_item[0]
        cid = loc_item[2]
        if cid not in locations_by_company:
            locations_by_company[cid] = []
        locations_by_company[cid].append(loc_id)

    # Generar Items de Inventario y Kardex
    item_counter = 1
    movement_types = ['INBOUND', 'RELOCATION', 'OUTBOUND']

    for ckey, cid in company_ids.items():
        prods = products_by_company.get(ckey, [])
        locs = locations_by_company.get(cid, [])
        uids = users_by_company.get(cid, [])

        if not prods or not locs or not uids:
            continue

        # Generar entre 20 y 35 ítems de inventario ubicados por empresa
        for i in range(random.randint(20, 35)):
            item_id = str(uuid.uuid4())
            pid, sku, unit_vol, weight = random.choice(prods)
            loc_id = random.choice(locs)
            qty = random.randint(10, 200)
            occupied_m3 = round(unit_vol * qty, 3)
            lot_num = f"LOT-2026-0{random.randint(1, 9)}{chr(65 + (i % 5))}"
            
            # Asignación de cliente: 60% propio interno, 40% cliente 3PL externo
            externals = external_clients_by_company.get(ckey, [])
            if externals and random.random() < 0.4:
                client_owner_id = random.choice(externals)
            else:
                client_owner_id = own_clients.get(ckey)

            if not client_owner_id:
                continue

            # Fecha de vencimiento a 6-18 meses en el futuro
            exp_date = (datetime.now() + timedelta(days=random.randint(180, 540))).strftime('%Y-%m-%d')
            occ_type = 'PALLET' if unit_vol > 1.0 else 'BOXES'

            sql.append(f"""
            INSERT INTO inventory_items (id, company_id, product_id, storage_location_id, client_owner_id, quantity, lot_number, expiration_date, occupancy_type, occupied_m3, entered_at) VALUES
            ('{item_id}', '{cid}', '{pid}', '{loc_id}', '{client_owner_id}', {qty}, '{lot_num}', '{exp_date}', '{occ_type}', {occupied_m3}, NOW() - INTERVAL '{random.randint(1, 90)} days');
            """)

            # Generar Histórico Kardex para este item (2-4 movimientos pasados)
            for m in range(random.randint(2, 4)):
                mov_id = str(uuid.uuid4())
                mtype = random.choice(movement_types)
                perf_by = random.choice(uids)
                days_ago = random.randint(1, 120)
                mqty = random.randint(5, qty)

                if mtype == 'INBOUND':
                    source_sql, dest_sql = 'NULL', f"'{loc_id}'"
                elif mtype == 'OUTBOUND':
                    source_sql, dest_sql = f"'{loc_id}'", 'NULL'
                else:  # RELOCATION
                    alt_loc = random.choice([l for l in locs if l != loc_id]) if len(locs) > 1 else loc_id
                    source_sql, dest_sql = f"'{loc_id}'", f"'{alt_loc}'"

                sql.append(f"""
                INSERT INTO inventory_movements (id, company_id, inventory_item_id, movement_type, source_location_id, destination_location_id, quantity, performed_by_user_id, created_at) VALUES
                ('{mov_id}', '{cid}', '{item_id}', '{mtype}', {source_sql}, {dest_sql}, {mqty}, '{perf_by}', NOW() - INTERVAL '{days_ago} days');
                """)

            item_counter += 1

    return "\n".join(sql)
