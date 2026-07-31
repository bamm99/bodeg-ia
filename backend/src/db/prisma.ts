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
    // Establecer la variable de sesión app.current_tenant_id para RLS
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${companyId}';`);
    return fn(tx as typeof prisma);
  });
}
