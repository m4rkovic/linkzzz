import "server-only";

import { getPrismaServerDependencies } from "@/server/persistence/prisma/dependencies";
import type { ServerDependencies } from "@/server/services/contracts";

export async function getServerDependencies(): Promise<ServerDependencies> {
  return getPrismaServerDependencies();
}
