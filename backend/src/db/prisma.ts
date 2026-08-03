import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Helper para ejecutar consultas dentro de un contexto de Row Level Security (RLS) en PostgreSQL
 */
export async function withTenant<T>(
  companyId: string,
  fn: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Cambiar a rol no-superusuario para obligar a PostgreSQL a evaluar las políticas RLS
    await tx.$executeRawUnsafe(`SET LOCAL ROLE bodegia_app_user;`);
    await tx.$executeRawUnsafe(`SET LOCAL app.current_company_id = '${companyId}';`);
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${companyId}';`);
    return fn(tx as typeof prisma);
  });
}

