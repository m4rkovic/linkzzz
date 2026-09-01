import "server-only";

import type { ServerDependencies } from "@/server/services/contracts";
import { prisma } from "@/server/persistence/prisma/client";
import {
  PrismaAnalyticsRepository, PrismaAssetRepository, PrismaAuditRepository,
  PrismaCustomDomainRepository, PrismaPasswordCredentialRepository,
  PrismaCustomerProvisioningRepository,
  PrismaProfileRepository, PrismaSessionRepository,
  PrismaSubscriptionHistoryRepository, PrismaSubscriptionRepository,
  PrismaUserRepository,
} from "@/server/persistence/prisma/repositories";

let dependencies: ServerDependencies | undefined;
export async function getPrismaServerDependencies(): Promise<ServerDependencies> {
  return dependencies ??= {
    users: new PrismaUserRepository(prisma),
    passwords: new PrismaPasswordCredentialRepository(prisma),
    sessions: new PrismaSessionRepository(prisma),
    subscriptions: new PrismaSubscriptionRepository(prisma),
    profiles: new PrismaProfileRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
    subscriptionHistory: new PrismaSubscriptionHistoryRepository(prisma),
    analytics: new PrismaAnalyticsRepository(prisma),
    assets: new PrismaAssetRepository(prisma),
    customDomains: new PrismaCustomDomainRepository(prisma),
    customerProvisioning: new PrismaCustomerProvisioningRepository(prisma),
  };
}
