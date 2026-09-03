import "server-only";

import {
  getPrismaServerDependencies,
  getPrismaSmartLinkDeletionRepository,
} from "@/server/persistence/prisma/dependencies";
import type {
  ServerDependencies,
  SmartLinkRepository,
} from "@/server/services/contracts";

type RuntimeSmartLinkRepository = Pick<
  SmartLinkRepository,
  | "listForUser"
  | "findByIdForUser"
  | "findBySlug"
  | "createWithinLimit"
  | "updateIfRevision"
  | "duplicateForUserWithinLimit"
>;

type RuntimeServerDependencies = Omit<ServerDependencies, "smartLinks"> & {
  smartLinks: RuntimeSmartLinkRepository;
};

export async function getServerDependencies(): Promise<RuntimeServerDependencies> {
  return getPrismaServerDependencies();
}

export function getSmartLinkDeletionRepository() {
  return getPrismaSmartLinkDeletionRepository();
}
