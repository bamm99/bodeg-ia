import subprocess
import os
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

class DBAdapter:
    def __init__(self):
        self.env = os.environ.copy()
        self.env['PGPASSWORD'] = DB_PASSWORD

    def execute_sql(self, sql_statement):
        """Ejecuta una consulta SQL en el servidor PostgreSQL de pruebas con bypass de RLS"""
        bypass_prefix = "SET app.current_company_id = 'BYPASS'; "
        cmd = [
            'psql',
            '-h', DB_HOST,
            '-p', str(DB_PORT),
            '-U', DB_USER,
            '-d', DB_NAME,
            '-v', 'ON_ERROR_STOP=1',
            '-c', bypass_prefix + sql_statement
        ]
        result = subprocess.run(cmd, env=self.env, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Error SQL: {result.stderr.strip()}")
            return False
        return True

    def execute_script(self, sql_script):
        """Ejecuta un script SQL completo por entrada estándar con bypass de RLS multi-tenant"""
        bypass_prefix = "SET app.current_company_id = 'BYPASS';\n"
        cmd = [
            'psql',
            '-h', DB_HOST,
            '-p', str(DB_PORT),
            '-U', DB_USER,
            '-d', DB_NAME,
            '-v', 'ON_ERROR_STOP=1',
        ]
        result = subprocess.run(cmd, input=bypass_prefix + sql_script, env=self.env, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Error en script SQL: {result.stderr.strip()}")
            return False
        return True

db = DBAdapter()
