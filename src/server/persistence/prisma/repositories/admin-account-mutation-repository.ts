import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { AdminError } from "@/server/admin/admin-errors";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";
import type {
  AdminAccountMutation,
  AdminAccountMutationRepository,
} from "@/server/services/contracts";

export class PrismaAdminAccountMutationRepository
  implements AdminAccountMutationRepository {
  constructor(private readonly db: PrismaClient) {}

  async apply(
    actorUserId: string,
    userId: string,
    action: AdminAccountMutation,
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, userId);

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== "CUSTOMER") {
        throw new AdminError("CUSTOMER_NOT_FOUND", "Customer not found.");
      }

      switch (action.type) {
        case "SUSPEND": {
          const now = new Date();
          await tx.user.update({
            where: { id: userId },
            data: { accountStatus: "SUSPENDED" },
          });
          await tx.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: now },
          });
          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "USER_SUSPENDED",
            metadata: { reason: action.reason?.trim() || null },
          });
          return;
        }

        case "REACTIVATE": {
          const subscription = await tx.subscription.findUnique({ where: { userId } });
          if (!subscription) {
            throw new AdminError(
              "SUBSCRIPTION_MISSING",
              "Customer subscription is missing.",
            );
          }

          const now = new Date();
          if (
            subscription.status === "STOPPED" ||
            subscription.status === "EXPIRED" ||
            subscription.endsAt.getTime() <= now.getTime()
          ) {
            throw new AdminError(
              "SUBSCRIPTION_REACTIVATION_REQUIRED",
              "Renew the subscription before reactivating this account.",
            );
          }

          await tx.user.update({
            where: { id: userId },
            data: { accountStatus: "ACTIVE" },
          });
          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "USER_REACTIVATED",
          });
          return;
        }

        case "RESET_PASSWORD": {
          const now = new Date();
          await tx.passwordCredential.upsert({
            where: { userId },
            create: {
              userId,
              passwordHash: action.passwordHash,
              mustChangePassword: true,
            },
            update: {
              passwordHash: action.passwordHash,
              mustChangePassword: true,
            },
          });
          await tx.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: now },
          });
          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "PASSWORD_RESET",
          });
          return;
        }
      }
    });
  }
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorUserId: string;
    targetUserId: string;
    action: "USER_SUSPENDED" | "USER_REACTIVATED" | "PASSWORD_RESET";
    metadata?: Record<string, string | number | boolean | null>;
  },
) {
  await tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      action: input.action,
      resourceType: "USER",
      resourceId: input.targetUserId,
      metadata: input.metadata ? toJson(input.metadata) : undefined,
    },
  });
}
