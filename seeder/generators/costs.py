import uuid

def generate_cost_sql(company_ids, location_ids):
    sql = []
    
    # Extraer zonas únicas asociadas a empresas
    processed_zones = set()
    for loc_id, loc_code, cid, zid, rack_id, lvl_id in location_ids:
        if zid not in processed_zones:
            processed_zones.add(zid)
            cprofile_id = str(uuid.uuid4())

            # Definir tarifas según tipo de zona
            if 'A' in loc_code: # Secos Alta Rotación
                base_cost = 2200.0
                turnover_mult = 1.5
                energy_cost = 0.0
                formula = '(base * turnover + maintenance) * seasonal'
            elif 'C' in loc_code or 'F' in loc_code: # Frío / Congelados
                base_cost = 3500.0
                turnover_mult = 1.2
                energy_cost = 1100.0
                formula = '(base * turnover + energy + maintenance) * seasonal'
            else: # General
                base_cost = 1800.0
                turnover_mult = 1.0
                energy_cost = 0.0
                formula = '(base * turnover + maintenance) * seasonal'

            sql.append(f"""
            INSERT INTO cost_profiles (id, company_id, zone_id, daily_base_cost, currency, turnover_multiplier, maintenance_cost_daily, energy_cost_daily, seasonal_factor, custom_formula_expression) VALUES
            ('{cprofile_id}', '{cid}', '{zid}', {base_cost}, 'CLP', {turnover_mult}, 300.0, {energy_cost}, 1.1, '{formula}');
            """)

            # Histórico de cambios
            history_id = str(uuid.uuid4())
            prev_cost = base_cost - 300.0
            sql.append(f"""
            INSERT INTO cost_history (id, company_id, cost_profile_id, previous_cost, new_cost, currency, change_reason) VALUES
            ('{history_id}', '{cid}', '{cprofile_id}', {prev_cost}, {base_cost}, 'CLP', 'Ajuste tarifario IPC trimestral');
            """)

    return "\n".join(sql)
