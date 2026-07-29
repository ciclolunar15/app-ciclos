import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente de Prisma.
 *
 * Prisma 7 exige un driver adapter: `new PrismaClient()` sin `adapter` ya no
 * compila. Para Postgres el adaptador es PrismaPg, que envuelve un pool de
 * `pg` y recibe la cadena de conexión directamente.
 *
 * El singleton sobre globalThis evita que el hot reload de desarrollo abra un
 * pool nuevo con cada cambio hasta agotar las conexiones de Postgres.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function crearCliente() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. Copia .env.example a .env y rellena la cadena de conexión.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
