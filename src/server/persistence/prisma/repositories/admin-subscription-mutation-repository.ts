import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  assessPlanChange,
  assessSmartLinkPlanChange,
} from "@/server/business/plans";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";
import type {
  AdminSubscriptionMutation,
  AdminSubscriptionMutationRepository,
} from "@/server/services/contracts";

export class PrismaAdminSubscriptionMutationRepository
  implements AdminSubscriptionMutationRepository {
  constructor(private readonly db: PrismaClient) {}

  async apply(
    actorUserId: string,
    userId: string,
    action: AdminSubscriptionMutation,
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

      switch (action.type) {
        case "RENEW": {
          const now = new Date();
          const restarting =
            subscription.status === "EXPIRED" || subscription.status === "STOPPED";
          const base =
            restarting || subscription.endsAt < now ? now : subscription.endsAt;
          const startsAt = restarting ? now : subscription.startsAt;
          const endsAt = addMonthsClamped(base, action.months);
          const metadata = {
            months: action.months,
            expiresAt: endsAt.toISOString(),
          };

          await saveSubscription(tx, {
            userId,
            plan: subscription.plan,
            status: "ACTIVE",
            startsAt,
            endsAt,
            autoRenew: subscription.autoRenew,
            historyAction: "RENEWED",
            historyMetadata: metadata,
          });

          if (user.accountStatus === "DISABLED") {
            await tx.user.update({
              where: { id: userId },
              data: { accountStatus: "ACTIVE" },
            });
          }

          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "SUBSCRIPTION_RENEWED",
            metadata,
          });
          return;
        }

        case "STOP_RENEWAL":
          await saveSubscription(tx, {
            userId,
            plan: subscription.plan,
            status: "CANCEL_AT_PERIOD_END",
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            autoRenew: false,
            historyAction: "STOP_RENEWAL",
          });
          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "SUBSCRIPTION_STOP_RENEWAL",
          });
          return;

        case "RESUME_RENEWAL":
          await saveSubscription(tx, {
            userId,
            plan: subscription.plan,
            status: "ACTIVE",
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            autoRenew: true,
            historyAction: "RESUME_RENEWAL",
          });
          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "SUBSCRIPTION_RESUMED",
          });
          return;

        case "STOP_IMMEDIATELY": {
          const now = new Date();
          await saveSubscription(tx, {
            userId,
            plan: subscription.plan,
            status: "STOPPED",
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            autoRenew: false,
            historyAction: "STOP_IMMEDIATELY",
          });
          await tx.user.update({
            where: { id: userId },
            data: { accountStatus: "DISABLED" },
          });
          await tx.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: now },
          });
          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "SUBSCRIPTION_STOPPED",
          });
          return;
        }

        case "CHANGE_PLAN": {
          const [smartLinkCount, pages] = await Promise.all([
            tx.smartLink.count({ where: { userId } }),
            tx.page.findMany({
              where: {
                smartLink: {
                  userId,
                  type: "LANDING_PAGE",
                },
              },
              select: {
                _count: { select: { cards: true } },
              },
            }),
          ]);
          const maxPageCardCount = pages.reduce(
            (max, page) => Math.max(max, page._count.cards),
            0,
          );
          const pageCardAssessment = assessPlanChange(
            subscription.plan,
            action.plan,
            maxPageCardCount,
          );
          const smartLinkAssessment = assessSmartLinkPlanChange(
            subscription.plan,
            action.plan,
            smartLinkCount,
          );
          const metadata = {
            previousPlan: subscription.plan,
            nextPlan: action.plan,
            overNewLimit:
              pageCardAssessment.exceedsNewLimit ||
              smartLinkAssessment.exceedsNewLimit,
            pageCardsOverNewLimit:
              pageCardAssessment.linksToRemoveBeforeAddingNew,
            smartLinksOverNewLimit:
              smartLinkAssessment.linksToRemoveBeforeAddingNew,
          };

          await saveSubscription(tx, {
            userId,
            plan: action.plan,
            status: subscription.status,
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            autoRenew: subscription.autoRenew,
            historyAction: "PLAN_CHANGED",
            historyMetadata: metadata,
          });
          await writeAudit(tx, {
            actorUserId,
            targetUserId: userId,
            action: "PLAN_CHANGED",
            metadata,
          });
          return;
        }
      }
    });
  }
}

type SubscriptionWrite = {
  userId: string;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "CANCEL_AT_PERIOD_END" | "EXPIRED" | "STOPPED";
  startsAt: Date;
  endsAt: Date;
  autoRenew: boolean;
  historyAction: string;
  historyMetadata?: Record<string, string | number | boolean | null>;
};

async function saveSubscription(
  tx: Prisma.TransactionClient,
  input: SubscriptionWrite,
) {
  await tx.subscription.update({
    where: { userId: input.userId },
    data: {
      plan: input.plan,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      autoRenew: input.autoRenew,
    },
  });

  await tx.subscriptionHistory.create({
    data: {
      userId: input.userId,
      plan: input.plan,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      action: input.historyAction,
      metadata: input.historyMetadata ? toJson(input.historyMetadata) : undefined,
    },
  });
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorUserId: string;
    targetUserId: string;
    action: string;
    metadata?: Record<string, string | number | boolean | null>;
  },
) {
  await tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      action: input.action,
      resourceType: "SUBSCRIPTION",
      resourceId: input.targetUserId,
      metadata: input.metadata ? toJson(input.metadata) : undefined,
    },
  });
}

function addMonthsClamped(source: Date, months: number) {
  const day = source.getDate();
  const result = new Date(source);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}
