import subprocess
import os
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

class DBAdapter:
    def __init__(self):
        self.env = os.environ.copy()
        self.env['PGPASSWORD'] = DB_PASSWORD

    def execute_sql(self, sql_statement):
        """Ejecuta una consulta SQL en el servidor PostgreSQL de pruebas"""
        cmd = [
            'psql',
            '-h', DB_HOST,
            '-p', str(DB_PORT),
            '-U', DB_USER,
            '-d', DB_NAME,
            '-c', sql_statement
        ]
        result = subprocess.run(cmd, env=self.env, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Error SQL: {result.stderr.strip()}")
            return False
        return True

    def execute_script(self, sql_script):
        """Ejecuta un script SQL completo por entrada estándar"""
        cmd = [
            'psql',
            '-h', DB_HOST,
            '-p', str(DB_PORT),
            '-U', DB_USER,
            '-d', DB_NAME
        ]
        result = subprocess.run(cmd, input=sql_script, env=self.env, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Error en script SQL: {result.stderr.strip()}")
            return False
        return True

db = DBAdapter()
