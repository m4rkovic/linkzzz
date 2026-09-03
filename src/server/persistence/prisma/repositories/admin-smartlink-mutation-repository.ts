import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { getEffectiveSubscriptionStatus } from "@/server/business/subscriptions";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";
import type {
  AdminSmartLinkMutation,
  AdminSmartLinkMutationRepository,
} from "@/server/services/contracts";

export class PrismaAdminSmartLinkMutationRepository
  implements AdminSmartLinkMutationRepository {
  constructor(private readonly db: PrismaClient) {}

  async apply(
    actorUserId: string,
    userId: string,
    action: AdminSmartLinkMutation,
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, userId);

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== "CUSTOMER") {
        throw new Error("Customer not found.");
      }

      const subscription = await tx.subscription.findUnique({ where: { userId } });
      if (!subscription) {
        throw new Error("Customer subscription is missing.");
      }

      const smartLink = await tx.smartLink.findFirst({
        where: { id: action.smartLinkId, userId },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          revision: true,
        },
      });
      if (!smartLink) {
        throw new Error("Smart Link not found.");
      }

      if (action.status === "DISABLED" && smartLink.status !== "PUBLISHED") {
        throw new Error("Only published Smart Links can be disabled by an administrator.");
      }

      if (action.status === "PUBLISHED") {
        const effectiveSubscriptionStatus = getEffectiveSubscriptionStatus(
          subscription.status,
          subscription.endsAt,
        );
        const accessActive =
          user.accountStatus === "ACTIVE" &&
          effectiveSubscriptionStatus !== "EXPIRED" &&
          effectiveSubscriptionStatus !== "STOPPED";

        if (!accessActive) {
          throw new Error(
            "Restore the customer account and subscription before enabling this Smart Link.",
          );
        }
        if (smartLink.status !== "DISABLED") {
          throw new Error("Only administrator-disabled Smart Links can be restored.");
        }
      }

      const now = new Date();
      const write = await tx.smartLink.updateMany({
        where: {
          id: smartLink.id,
          userId,
          revision: smartLink.revision,
        },
        data: {
          status: action.status,
          revision: { increment: 1 },
          updatedAt: now,
        },
      });
      if (write.count !== 1) {
        throw new Error(
          "Smart Link changed while the admin action was being applied. Try again.",
        );
      }

      await tx.auditLog.create({
        data: {
          actorUserId,
          targetUserId: userId,
          action:
            action.status === "DISABLED"
              ? "SMART_LINK_DISABLED"
              : "SMART_LINK_ENABLED",
          resourceType: "SMART_LINK",
          resourceId: smartLink.id,
          metadata: toJson({ title: smartLink.title, slug: smartLink.slug }),
        },
      });
    });
  }
}
