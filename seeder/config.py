import os
import re

def load_env(env_path):
    """Carga variables de entorno desde un archivo .env sin librerías externas"""
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    key = key.strip()
                    val = val.strip().strip('"\'')
                    env_vars[key] = val
    return env_vars

# Cargar .env desde la raíz del proyecto
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(ROOT_DIR, '.env')
ENV = load_env(ENV_FILE)

DB_HOST = ENV.get('DB_HOST', '192.168.1.49')
DB_PORT = ENV.get('DB_PORT', '5432')
DB_USER = ENV.get('POSTGRES_USER', 'bdg')
DB_PASSWORD = ENV.get('POSTGRES_PASSWORD', 'bodegia-db')
DB_NAME = ENV.get('POSTGRES_DB', 'bodeg-ia')
