import "server-only";

import type { ServerDependencies } from "@/server/services/contracts";
import { getPrismaClient } from "@/server/persistence/prisma/client";
import {
  PrismaAdminAccountMutationRepository, PrismaAdminReadRepository,
  PrismaAdminSubscriptionMutationRepository, PrismaAnalyticsRepository,
  PrismaAssetRepository, PrismaAuditRepository, PrismaCustomDomainRepository,
  PrismaPasswordCredentialRepository, PrismaCustomerProvisioningRepository,
  PrismaLeadSubmissionRepository, PrismaProfileRepository, PrismaSessionRepository,
  PrismaSmartLinkRepository, PrismaSubscriptionHistoryRepository,
  PrismaSubscriptionRepository, PrismaUserRepository,
} from "@/server/persistence/prisma/repositories/index";

let dependencies: ServerDependencies | undefined;
export async function getPrismaServerDependencies(): Promise<ServerDependencies> {
  const prisma = getPrismaClient();
  return dependencies ??= {
    adminRead: new PrismaAdminReadRepository(prisma),
    adminSubscriptions: new PrismaAdminSubscriptionMutationRepository(prisma),
    adminAccounts: new PrismaAdminAccountMutationRepository(prisma),
    users: new PrismaUserRepository(prisma),
    passwords: new PrismaPasswordCredentialRepository(prisma),
    sessions: new PrismaSessionRepository(prisma),
    subscriptions: new PrismaSubscriptionRepository(prisma),
    smartLinks: new PrismaSmartLinkRepository(prisma),
    profiles: new PrismaProfileRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
    subscriptionHistory: new PrismaSubscriptionHistoryRepository(prisma),
    analytics: new PrismaAnalyticsRepository(prisma),
    leadSubmissions: new PrismaLeadSubmissionRepository(prisma),
    assets: new PrismaAssetRepository(prisma),
    customDomains: new PrismaCustomDomainRepository(prisma),
    customerProvisioning: new PrismaCustomerProvisioningRepository(prisma),
  };
}
