import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireDatabaseConnectionString } from "@/server/config/postgres-connection-string";

const globalForPrisma = globalThis as unknown as {
  linkzzzPrisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = requireDatabaseConnectionString();
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function getPrismaClient() {
  if (globalForPrisma.linkzzzPrisma) {
    return globalForPrisma.linkzzzPrisma;
  }

  const prisma = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.linkzzzPrisma = prisma;
  }
  return prisma;
}
