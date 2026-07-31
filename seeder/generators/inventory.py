import uuid
import random
from datetime import datetime, timedelta

def generate_inventory_sql(company_ids, location_ids, product_ids, client_ids, users_data):
    sql = []
    
    # Mapeo de clientes propios por empresa
    own_clients = {}
    for cl_id, ckey, is_int in client_ids:
        if is_int:
            own_clients[ckey] = cl_id

    # Mapeo de usuarios por empresa
    users_by_company = {}
    for uid, email, cid in users_data:
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
    for loc_id, loc_code, cid, zid, rack_id, lvl_id in location_ids:
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
        client_owner_id = own_clients.get(ckey)

        if not prods or not locs or not uids or not client_owner_id:
            continue

        # Generar entre 15 y 30 ítems de inventario ubicados por empresa
        for i in range(random.randint(15, 30)):
            item_id = str(uuid.uuid4())
            pid, sku, unit_vol, weight = random.choice(prods)
            loc_id = random.choice(locs)
            qty = random.randint(10, 200)
            occupied_m3 = round(unit_vol * qty, 3)
            lot_num = f"LOT-2026-0{random.randint(1, 9)}{chr(65 + (i % 5))}"
            
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

                sql.append(f"""
                INSERT INTO inventory_movements (id, company_id, inventory_item_id, movement_type, destination_location_id, quantity, performed_by_user_id, created_at) VALUES
                ('{mov_id}', '{cid}', '{item_id}', '{mtype}', '{loc_id}', {mqty}, '{perf_by}', NOW() - INTERVAL '{days_ago} days');
                """)

            item_counter += 1

    return "\n".join(sql)
