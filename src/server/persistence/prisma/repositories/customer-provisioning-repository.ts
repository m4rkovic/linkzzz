import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CustomerProvisioningRepository,
  ProvisionCustomerInput,
  UserRecord,
} from "@/server/services/contracts";
import { toJson } from "@/server/persistence/prisma/repositories/json";

export class PrismaCustomerProvisioningRepository
  implements CustomerProvisioningRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: ProvisionCustomerInput): Promise<UserRecord> {
    const expiresAt = input.subscription.expiresAt;
    if (!expiresAt) throw new Error("A subscription expiry date is required.");

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: input.username.trim().toLowerCase(),
          email: input.email.trim().toLowerCase(),
          displayName: input.profile.displayName,
          role: "CUSTOMER",
          accountStatus: "ACTIVE",
        },
      });

      await tx.passwordCredential.create({
        data: {
          userId: user.id,
          passwordHash: input.passwordHash,
          mustChangePassword: input.mustChangePassword,
        },
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          plan: input.subscription.plan,
          status: input.subscription.status,
          startsAt: input.subscription.startedAt,
          endsAt: expiresAt,
          autoRenew: input.subscription.autoRenew,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          userId: user.id,
          plan: input.subscription.plan,
          status: input.subscription.status,
          startsAt: input.subscription.startedAt,
          endsAt: expiresAt,
          action: "CREATED",
          metadata: toJson({ initial: true }),
        },
      });

      const smartLink = await tx.smartLink.create({
        data: {
          userId: user.id,
          type: "LANDING_PAGE",
          title: input.profile.displayName,
          slug: input.profile.slug.trim().toLowerCase(),
          status: input.profile.status,
        },
      });

      await tx.page.create({
        data: {
          smartLinkId: smartLink.id,
          displayName: input.profile.displayName,
          username: input.profile.username,
          bio: input.profile.bio,
          locationLabel: input.profile.locationLabel,
          appearance: toJson(input.profile.appearance),
          contentBlocks: toJson(input.profile.contentBlocks),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          targetUserId: user.id,
          action: "USER_CREATED",
          resourceType: "USER",
          resourceId: user.id,
          metadata: toJson({ plan: input.subscription.plan, slug: input.profile.slug }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          targetUserId: user.id,
          action: "SUBSCRIPTION_RENEWED",
          resourceType: "SUBSCRIPTION",
          resourceId: user.id,
          metadata: toJson({ months: 0, initial: true }),
        },
      });

      return user;
    });
  }
}

