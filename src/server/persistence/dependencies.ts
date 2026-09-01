import "server-only";

import type { ServerDependencies } from "@/server/services/contracts";

export async function getServerDependencies(): Promise<ServerDependencies> {
  if (process.env.PERSISTENCE_ADAPTER === "json") {
    const { getJsonServerDependencies } = await import("@/server/persistence/json/dependencies");
    return getJsonServerDependencies();
  }
  const { getPrismaServerDependencies } = await import("@/server/persistence/prisma/dependencies");
  return getPrismaServerDependencies();
}
