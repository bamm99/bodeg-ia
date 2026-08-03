import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

async function applyRlsMigration() {
  console.log('🔒 Aplicando Migración PostgreSQL Row-Level Security (RLS)...');

  try {
    const sqlPath = path.join(__dirname, '../../prisma/migrations/enable_pg_rls.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    // Separar instrucciones SQL respetando el bloque de función PL/pgSQL
    const statements: string[] = [];
    let currentStmt = '';
    let inFunction = false;

    const lines = sqlScript.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      if (trimmed.includes('$$')) {
        inFunction = !inFunction;
      }

      currentStmt += line + '\n';

      if (trimmed.endsWith(';') && !inFunction) {
        statements.push(currentStmt.trim());
        currentStmt = '';
      }
    }

    if (currentStmt.trim()) {
      statements.push(currentStmt.trim());
    }

    for (const stmt of statements) {
      if (stmt) {
        await prisma.$executeRawUnsafe(stmt);
      }
    }

    console.log(`✅ Migración PostgreSQL RLS aplicada con éxito (${statements.length} instrucciones ejecutadas en todas las tablas multi-tenant).`);
  } catch (error) {
    console.error('❌ Error aplicando la migración PostgreSQL RLS:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyRlsMigration();
}

export { applyRlsMigration };
