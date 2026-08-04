import uuid
import random

def generate_cost_sql(company_ids, location_ids):
    sql = []
    
    processed_elements = set()
    for loc_id, loc_code, cid, wid, cost_enabled, zid, rack_id, lvl_id in location_ids:
        if not cost_enabled:
            continue  # Saltar si la bodega no tiene tracking de costos activado

        # Variar nivel de asignación del arco exclusivo (zone, rack o level)
        target_choice = random.choice(['zone', 'rack', 'level'])
        elem_key = zid if target_choice == 'zone' else (rack_id if target_choice == 'rack' else lvl_id)

        if elem_key not in processed_elements:
            processed_elements.add(elem_key)
            cprofile_id = str(uuid.uuid4())

            zone_sql = f"'{zid}'" if target_choice == 'zone' else "NULL"
            rack_sql = f"'{rack_id}'" if target_choice == 'rack' else "NULL"
            level_sql = f"'{lvl_id}'" if target_choice == 'level' else "NULL"

            # Definir tarifas según tipo de zona
            if 'A' in loc_code:  # Secos Alta Rotación
                base_cost = 2200.0
                turnover_mult = 1.5
                energy_cost = 0.0
                formula = '(base * turnover + maintenance) * seasonal'
            elif 'C' in loc_code or 'F' in loc_code:  # Frío / Congelados
                base_cost = 3500.0
                turnover_mult = 1.2
                energy_cost = 1100.0
                formula = '(base * turnover + energy + maintenance) * seasonal'
            else:  # General
                base_cost = 1800.0
                turnover_mult = 1.0
                energy_cost = 0.0
                formula = '(base * turnover + maintenance) * seasonal'

            sql.append(f"""
            INSERT INTO cost_profiles (id, company_id, zone_id, rack_id, level_id, daily_base_cost, currency, turnover_multiplier, maintenance_cost_daily, energy_cost_daily, seasonal_factor, custom_formula_expression) VALUES
            ('{cprofile_id}', '{cid}', {zone_sql}, {rack_sql}, {level_sql}, {base_cost}, 'CLP', {turnover_mult}, 300.0, {energy_cost}, 1.1, '{formula}');
            """)

            # Histórico de cambios
            history_id = str(uuid.uuid4())
            prev_cost = base_cost - 300.0
            sql.append(f"""
            INSERT INTO cost_history (id, company_id, cost_profile_id, previous_cost, new_cost, currency, change_reason) VALUES
            ('{history_id}', '{cid}', '{cprofile_id}', {prev_cost}, {base_cost}, 'CLP', 'Ajuste tarifario IPC trimestral');
            """)

    return "\n".join(sql)
